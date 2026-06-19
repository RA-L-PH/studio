
'use client';

import { useState, useEffect } from 'react';
import { rtdb, db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { useSearchParams } from 'next/navigation';
import { Stethoscope, Clock, Users, Bell } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Patient {
  token: number;
  name: string;
}

interface ClinicDetails {
    clinicName: string;
    doctorName: string;
    specialization: string;
}

export default function MobileQueue() {
  const searchParams = useSearchParams();
  const clinicCode = searchParams.get('code');

  const [clinicDetails, setClinicDetails] = useState<ClinicDetails | null>(null);
  const [currentToken, setCurrentToken] = useState<number>(0);
  const [queue, setQueue] = useState<Patient[]>([]);
  const [doctorStatus, setDoctorStatus] = useState<'available' | 'on_break' | 'offline'>('available');
  const [waitTime, setWaitTime] = useState<number>(0);

  useEffect(() => {
    if (clinicCode) {
      // Fetch static clinic details
      const q = query(collection(db, "clinics"), where("clinicCode", "==", clinicCode));
      getDocs(q).then(querySnapshot => {
        if (!querySnapshot.empty) {
          const clinicData = querySnapshot.docs[0].data() as ClinicDetails;
          setClinicDetails(clinicData);
        }
      });

      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      const listener = onValue(queueRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const newCurrentToken = data.currentToken || 0;
          if (newCurrentToken > currentToken && currentToken !== 0) {
            const audio = new Audio('/ping.mp3');
            audio.play().catch(e => console.error("Audio play failed", e));
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

      return () => {
        listener();
      };
    }
  }, [clinicCode, currentToken]);

  const getStatusComponent = () => {
    switch(doctorStatus) {
      case 'on_break':
        return <div className="w-full bg-yellow-100 dark:bg-yellow-900/50 p-4 text-center text-yellow-800 dark:text-yellow-300 font-semibold"><Clock size={20} className="inline mr-2"/>Doctor is on a short break.</div>;
      case 'offline':
        return <div className="w-full bg-red-100 dark:bg-red-900/50 p-4 text-center text-red-800 dark:text-red-300 font-semibold"><Clock size={20} className="inline mr-2"/>Consultation has ended for the day.</div>;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <Stethoscope size={28} className="text-blue-500"/>
            <div>
                <h1 className="text-xl font-bold truncate">{clinicDetails?.clinicName || 'Live Queue'}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dr. {clinicDetails?.doctorName}</p>
            </div>
        </div>
      </header>

      {getStatusComponent()}

      {/* Main Content */}
      <main className="p-4 pb-20">
        
        {/* Now Serving Card */}
        <div className="bg-green-500 text-white rounded-xl shadow-lg p-6 text-center mb-6 relative overflow-hidden">
            <Bell size={80} className="absolute -bottom-4 -right-4 text-white/10"/>
            <h2 className="text-2xl font-bold uppercase tracking-wider">Now Serving</h2>
            <p className="text-8xl font-extrabold">{currentToken || '--'}</p>
        </div>

        {/* Queue Info Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center">
                <h3 className="font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"><Users size={18}/> In Queue</h3>
                <p className="text-4xl font-bold">{queue.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center">
                <h3 className="font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"><Clock size={18}/> Wait Time</h3>
                <p className="text-4xl font-bold">≈{waitTime}<span className="text-xl">min</span></p>
            </div>
        </div>

        {/* Upcoming Patients List */}
        <div>
            <h2 className="text-xl font-bold mb-3">Upcoming Patients</h2>
            {queue.length > 0 ? (
                <div className="space-y-3">
                    {queue.slice(0, 5).map((patient, index) => (
                        <div key={patient.token} className={`flex items-center justify-between p-4 rounded-lg transition-transform duration-300 ${index === 0 ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                            <span className={`font-bold text-2xl ${index === 0 ? '' : 'text-blue-500'}`}>#{patient.token}</span>
                            <span className="font-medium text-lg">{patient.name}</span>
                        </div>
                    ))}
                </div>
            ) : doctorStatus !== 'offline' ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <p>The queue is currently empty.</p>
                </div>
            ) : null}
        </div>
      </main>
    </div>
  );
}
