'use client';

import { useState, useEffect, Suspense } from 'react';
import { db, rtdb } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { useSearchParams } from 'next/navigation';
import { Stethoscope, Clock, Bell, Activity, Users } from 'lucide-react';

interface Patient {
  token: number;
  name: string;
}

interface ClinicDetails {
  clinicName: string;
  doctorName: string;
  specialization: string;
}

function QueueDisplayContent() {
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
        return { text: "Doctor is on a short break.", icon: <Clock className="text-yellow-500 animate-pulse" size={48}/> };
      case 'offline':
         return { text: "Consultation ended for today.", icon: <Clock className="text-red-500" size={48}/> };
      default:
        return null;
    }
  }

  return (
    <div className="h-screen w-screen bg-[#0D1012] text-gray-100 font-sans flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#1A81E6]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="backdrop-blur-md border-b border-gray-800/40 bg-[#0D1012]/80 px-8 py-4 shrink-0">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1A81E6]/10 border border-[#1A81E6]/25 flex items-center justify-center text-[#1A81E6]">
                <Stethoscope size={24} />
              </div>
              <div className="text-center md:text-left">
                 <h1 className="text-3xl font-bold tracking-tight text-white font-mono">{clinicDetails?.clinicName || 'Clinic Lobby'}</h1>
                 <p className="text-sm text-gray-400 font-mono mt-0.5">Dr. {clinicDetails?.doctorName} <span className="text-gray-600">|</span> {clinicDetails?.specialization}</p>
              </div>
           </div>
           
           <div className="text-center md:text-right font-mono">
             <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
             <div className="flex items-center justify-center md:justify-end gap-1.5 mt-1.5 text-xs text-[#17CEA4] font-semibold">
                <Clock size={14}/>
                <span>Est. Wait Time: ~{waitTime}m</span>
              </div>
           </div>
        </div>
      </header>

      {/* Main serving view - Edged Layout */}
      <main className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-950/40 items-stretch overflow-hidden">
        {/* Now Serving Panel - Edged */}
        <div className="bg-[#111618] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden border-r border-gray-800/60">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#17CEA4]/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 text-xs text-[#17CEA4] font-mono uppercase tracking-widest font-bold mb-6">
            <Activity size={16} className="animate-pulse" /> Now Serving
          </div>
          <p className="text-[12rem] md:text-[16rem] font-black text-white leading-none tracking-tighter font-mono">
            {currentToken ? String(currentToken).padStart(3, '0') : '---'}
          </p>
        </div>

        {/* Upcoming Queue Panel - Edged */}
        <div className="bg-[#111618] flex flex-col p-10 justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-850 mb-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Users size={16} className="text-[#1A81E6]" /> Upcoming Queue
              </h2>
              <span className="text-[10px] font-mono text-gray-600">TV DISPLAY MODE</span>
            </div>

            <div className="w-full">
              { getStatusMessage() ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-[#0D1012]/40 rounded-2xl border border-gray-850/60 max-w-sm mx-auto w-full">
                     {getStatusMessage()?.icon}
                     <p className="mt-4 text-sm font-bold font-mono text-gray-400 leading-relaxed">{getStatusMessage()?.text}</p>
                  </div>
              ) : queue.length > 0 ? (
                 <div className="w-full space-y-4">
                    {queue.slice(0, 5).map((patient, index) => {
                      const isNext = index === 0;
                      return (
                        <div 
                          key={patient.token} 
                          className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
                            isNext 
                              ? 'bg-[#1A81E6] border-transparent shadow-[0_4px_25px_rgba(26,129,230,0.25)] scale-[1.01]' 
                              : 'bg-[#0D1012] border-gray-850'
                          }`}
                        >
                          <span className={`font-mono text-2xl font-bold ${isNext ? 'text-white' : 'text-[#1A81E6]'}`}>
                            #{String(patient.token).padStart(3, '0')}
                          </span>
                          <span className={`text-lg font-bold ${isNext ? 'text-white' : 'text-gray-300'}`}>
                            {patient.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
              ) : (
                 <div className="text-center py-12">
                    <p className="text-sm text-gray-600 font-mono">Queue is empty</p>
                 </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-850 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>PING AUDIO NOTIFICATIONS ACTIVE</span>
            <Bell size={12} className="text-[#1A81E6] animate-bounce" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QueueDisplay() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex items-center justify-center font-mono text-xs">
        Loading monitor...
      </div>
    }>
      <QueueDisplayContent />
    </Suspense>
  );
}
