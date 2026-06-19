
'use client';

import { useState, useEffect } from 'react';
import { db, rtdb } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { useSearchParams } from 'next/navigation';
import { Stethoscope, User, Clock, Bell } from 'lucide-react';

interface Patient {
  token: number;
  name: string;
}

interface ClinicDetails {
    clinicName: string;
    doctorName: string;
    specialization: string;
}

export default function QueueDisplay() {
  const searchParams = useSearchParams();
  const clinicCode = searchParams.get('code');

  const [clinicDetails, setClinicDetails] = useState<ClinicDetails | null>(null);
  const [currentToken, setCurrentToken] = useState<number>(0);
  const [queue, setQueue] = useState<Patient[]>([]);
  const [doctorStatus, setDoctorStatus] = useState<'available' | 'on_break' | 'offline'>('available');
  const [waitTime, setWaitTime] = useState<number>(0);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    if (typeof window !== 'undefined') {
      audio = new Audio('/ping.mp3');
    }

    if (clinicCode) {
      const q = query(collection(db, "clinics"), where("clinicCode", "==", clinicCode));
      getDocs(q).then(querySnapshot => {
        if (!querySnapshot.empty) {
          const clinicData = querySnapshot.docs[0].data() as ClinicDetails;
          setClinicDetails(clinicData);
        }
      });

      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      onValue(queueRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const newCurrentToken = data.currentToken || 0;

            if(newCurrentToken > currentToken && currentToken !== 0) {
                audio?.play().catch(e => console.error("Error playing sound:", e));
            }
            setCurrentToken(newCurrentToken);
            setDoctorStatus(data.doctorStatus || 'available');
            const patients = data.patients ? Object.values(data.patients) as Patient[] : [];
            const upcoming = patients.filter(p => p.token > newCurrentToken).sort((a,b) => a.token - b.token);
            const avgTime = data.avgConsultationTime || 5;

            setQueue(upcoming);
            setWaitTime(Math.round(upcoming.length * avgTime));
        }
      });
    }

    return () => {
      if (clinicCode) {
        const queueRef = ref(rtdb, `queues/${clinicCode}`);
        onValue(queueRef, () => {});
      }
    };
  }, [clinicCode, currentToken]);

  const getStatusMessage = () => {
    switch(doctorStatus) {
      case 'on_break':
        return { text: "The Doctor is on a short break.", icon: <Clock className="text-yellow-400" size={60}/> };
      case 'offline':
         return { text: "Consultation has ended for the day.", icon: <Clock className="text-red-400" size={60}/> };
      default:
        return null;
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white font-sans flex flex-col overflow-hidden">
      <header className="bg-black bg-opacity-30 p-4 shadow-lg shrink-0">
        <div className="container mx-auto flex justify-between items-center">
           <div className="flex items-center gap-4">
              <Stethoscope size={40} className="text-blue-400"/>
              <div>
                 <h1 className="text-4xl font-extrabold tracking-tight">{clinicDetails?.clinicName || 'Clinic'}</h1>
                 <p className="text-xl text-gray-300">Dr. {clinicDetails?.doctorName} <span className="text-base">({clinicDetails?.specialization})</span></p>
              </div>
           </div>
           <div className="text-lg font-semibold text-right">
             <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <div className="flex items-center justify-end gap-3 mt-1 text-blue-300">
                <Clock size={20}/>
                <p className="text-xl">Est. Wait Time: <span className="font-bold">≈{waitTime} min</span></p>
             </div>
           </div>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-2 gap-px bg-gray-700">
        {/* Left Side: Now Serving */}
        <div className="bg-green-600 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
             <Bell className="absolute -bottom-10 -right-10 text-white text-opacity-10" size={300}/>
             <h2 className="text-5xl font-bold uppercase tracking-wider text-green-100">Now Serving</h2>
             <p className="text-9xl font-extrabold text-white mt-4" style={{fontSize: '12rem'}}>{currentToken || '--'}</p>
        </div>

        {/* Right Side: Upcoming Queue */}
        <div className="bg-gray-800 flex flex-col p-10">
          <h2 className="text-4xl font-bold uppercase tracking-wider text-gray-400 mb-6 text-center">Upcoming</h2>
          <div className="flex-grow flex items-center justify-center">
            { getStatusMessage() ? (
                <div className="flex flex-col items-center justify-center text-center text-2xl text-gray-300">
                   {getStatusMessage()?.icon}
                   <p className="mt-4 font-semibold">{getStatusMessage()?.text}</p>
                </div>
            ) : queue.length > 0 ? (
               <div className="w-full space-y-4">
                  {queue.slice(0, 5).map((patient, index) => (
                    <div key={patient.token} className={`flex items-center justify-between p-5 rounded-lg text-3xl transition-all duration-300 ease-in-out transform ${index === 0 ? 'bg-blue-500 shadow-2xl scale-105' : 'bg-gray-700 opacity-80'}`}>
                      <span className={`font-bold ${index === 0 ? 'text-white' : 'text-blue-300'}`}>#{patient.token}</span>
                      <span className={`font-medium ${index === 0 ? 'text-white' : 'text-gray-200'}`}>{patient.name}</span>
                    </div>
                  ))}
                </div>
            ) : (
               <div className="text-center text-2xl text-gray-500">
                  <p>The queue is currently empty.</p>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
