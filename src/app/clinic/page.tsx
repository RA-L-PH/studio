'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../../firebase';
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Hospital, Activity } from 'lucide-react';

interface Patient {
  token: number;
  name: string;
}

interface QueueData {
  currentToken: number;
  lastUpdated: string;
  patients: Record<string, Patient>;
}

function ClinicQueueContent() {
  const searchParams = useSearchParams();
  const clinicCode = searchParams.get('code');
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinicCode) {
      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      const unsubscribe = onValue(queueRef, (snapshot) => {
        if (snapshot.exists()) {
          setQueueData(snapshot.val());
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [clinicCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex items-center justify-center font-mono text-xs">
        Syncing queue data...
      </div>
    );
  }

  if (!clinicCode || !queueData) {
    return (
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-md w-full bg-[#111618] p-8 border border-gray-800 rounded-2xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h1 className="text-2xl font-bold mb-3 font-mono text-white">Clinic Not Found</h1>
          <p className="text-xs text-gray-400 mb-6">The clinic code <strong className="text-[#17CEA4] font-mono">{clinicCode || 'None'}</strong> is invalid or does not exist.</p>
          <Link href="/find-clinic" className="inline-flex items-center gap-1.5 text-xs text-[#1A81E6] hover:underline font-semibold font-mono">
            <ArrowLeft size={14} /> Back to search
          </Link>
        </div>
      </div>
    );
  }

  const patients = queueData.patients ? Object.values(queueData.patients) : [];
  const waitingPatients = patients.filter(p => p.token > queueData.currentToken);

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 p-6 relative">
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-[#1A81E6]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A81E6]/10 border border-[#1A81E6]/20 flex items-center justify-center text-[#1A81E6]">
              <Hospital size={16} />
            </div>
            <h1 className="text-2xl font-bold text-white font-mono tracking-wide">Clinic Queue</h1>
          </div>
          <Link href="/find-clinic" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Search
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111618] border border-[#1A81E6]/30 p-6 rounded-2xl text-center shadow-[0_4px_20px_rgba(26,129,230,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#1A81E6]/5 rounded-full blur-xl" />
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#1A81E6] font-mono uppercase tracking-wider mb-2 font-bold">
              <Activity size={12} className="animate-pulse" /> Currently Serving
            </div>
            <p className="text-5xl font-extrabold text-white font-mono">{queueData.currentToken || '-'}</p>
          </div>

          <div className="bg-[#111618] border border-gray-800/80 p-6 rounded-2xl text-center shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#17CEA4] font-mono uppercase tracking-wider mb-2 font-bold">
              <Clock size={12} /> Approx. Wait Time
            </div>
            <p className="text-5xl font-extrabold text-white font-mono">{waitingPatients.length * 15} <span className="text-xs text-gray-500 font-normal">min</span></p>
          </div>
        </div>

        <div className="bg-[#111618] border border-gray-800/85 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Users size={16} className="text-[#17CEA4]" /> Waiting Queue
            </h2>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{waitingPatients.length} Active Patients</span>
          </div>

          {waitingPatients.length > 0 ? (
            <div className="divide-y divide-gray-800/60 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {waitingPatients.map((patient) => (
                <div key={patient.token} className="py-3 flex justify-between items-center">
                  <span className="text-xs font-mono text-[#17CEA4] bg-[#17CEA4]/5 border border-[#17CEA4]/20 px-2.5 py-1 rounded-lg">
                    TOKEN #{String(patient.token).padStart(3, '0')}
                  </span>
                  <span className="text-sm font-semibold text-white">{patient.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-500 font-mono py-12">The queue is currently empty.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClinicQueue() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex items-center justify-center font-mono text-xs">
        Loading clinic queue...
      </div>
    }>
      <ClinicQueueContent />
    </Suspense>
  );
}
