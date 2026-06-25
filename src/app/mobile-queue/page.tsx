
'use client';

import { useState, useEffect } from 'react';
import { rtdb, db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { useSearchParams } from 'next/navigation';
import { Stethoscope, Clock, Users, Bell, Activity } from 'lucide-react';
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
        return <div className="w-full bg-yellow-500/10 border-b border-yellow-500/25 p-3 text-center text-xs text-yellow-500 font-bold font-mono">● Doctor is on a short break.</div>;
      case 'offline':
        return <div className="w-full bg-red-500/10 border-b border-red-500/25 p-3 text-center text-xs text-red-400 font-bold font-mono">● Consultation has ended for the day.</div>;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[#1A81E6]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-800/40 bg-[#0D1012]/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1A81E6]/10 border border-[#1A81E6]/25 flex items-center justify-center text-[#1A81E6]">
            <Stethoscope size={16} />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white font-mono leading-none">{clinicDetails?.clinicName || 'Live Queue'}</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Dr. {clinicDetails?.doctorName}</p>
          </div>
        </div>
      </header>

      {getStatusComponent()}

      {/* Main Content */}
      <main className="p-6 flex-grow flex flex-col max-w-md w-full mx-auto justify-start">
        {/* Now Serving Card */}
        <div className="bg-[#111618] border border-[#17CEA4]/25 rounded-2xl p-6 text-center mb-6 relative overflow-hidden shadow-[0_12px_30px_rgba(23,206,164,0.04)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#17CEA4]/5 rounded-full blur-xl" />
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#17CEA4] font-mono uppercase tracking-widest font-bold mb-3">
            <Activity size={14} className="animate-pulse" /> Now Serving
          </div>
          <p className="text-7xl font-extrabold text-white font-mono leading-none tracking-tighter">
            {currentToken ? String(currentToken).padStart(3, '0') : '---'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#111618] border border-gray-800/80 p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
              <Users size={12}/> In Queue
            </div>
            <p className="text-2xl font-bold text-white font-mono">{queue.length}</p>
          </div>
          <div className="bg-[#111618] border border-gray-800/80 p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
              <Clock size={12}/> Wait Time
            </div>
            <p className="text-2xl font-bold text-white font-mono">~{waitTime}m</p>
          </div>
        </div>

        {/* Upcoming Patients */}
        <div className="bg-[#111618] border border-gray-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-4 pb-3 border-b border-gray-850">
            Upcoming Queue
          </h2>
          {queue.length > 0 ? (
            <div className="space-y-2">
              {queue.slice(0, 5).map((patient, index) => {
                const isNext = index === 0;
                return (
                  <div 
                    key={patient.token} 
                    className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                      isNext 
                        ? 'bg-[#1A81E6] border-transparent shadow-[0_4px_15px_rgba(26,129,230,0.2)]' 
                        : 'bg-[#0D1012] border-gray-850'
                    }`}
                  >
                    <span className={`font-mono text-xs font-bold ${isNext ? 'text-white' : 'text-[#1A81E6]'}`}>
                      #{String(patient.token).padStart(3, '0')}
                    </span>
                    <span className={`text-xs font-semibold ${isNext ? 'text-white' : 'text-gray-300'}`}>
                      {patient.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : doctorStatus !== 'offline' ? (
            <p className="text-center text-xs text-gray-600 font-mono py-8">Queue is empty</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

