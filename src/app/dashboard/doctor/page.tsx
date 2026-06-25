
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../../firebase/auth-provider';
import { db, rtdb } from '../../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, onValue, update, get, serverTimestamp } from 'firebase/database';
import { ArrowLeft, ArrowRight, UserCheck, Users, LogOut, Coffee, PowerOff, ListOrdered, Hospital, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Patient {
  token: number;
  name: string;
}

function DoctorViewContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicCode = searchParams.get('code');
  
  const [currentToken, setCurrentToken] = useState<number>(0);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patientQueue, setPatientQueue] = useState<Patient[]>([]);
  const [doctorStatus, setDoctorStatus] = useState<'available' | 'on_break' | 'offline'>('available');
  const [avgConsultationTime, setAvgConsultationTime] = useState(5);
  const [lastConsultationTimestamp, setLastConsultationTimestamp] = useState<number | null>(null);
  const [breakCount, setBreakCount] = useState<number>(0);

  const currentPatient = allPatients.find(p => p.token === currentToken);
  const nextPatient = patientQueue.length > 0 ? patientQueue[0] : null;

  useEffect(() => {
    if (clinicCode) {
      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      onValue(queueRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const currentTokenVal = data.currentToken || 0;
          setCurrentToken(currentTokenVal);
          const status = data.doctorStatus || 'available';
          setDoctorStatus(status);
          setAvgConsultationTime(data.avgConsultationTime || 5);
          setLastConsultationTimestamp(data.lastConsultationTimestamp || null);
          setBreakCount(data.breakCount || 0);
          const patients = data.patients ? Object.values(data.patients) as Patient[] : [];
          setAllPatients(patients);
          const upcoming = patients
            .filter(p => p.token > currentTokenVal)
            .sort((a, b) => a.token - b.token);
          setPatientQueue(upcoming);

          // Auto-activate clinic when doctor opens the cockpit
          if (status === 'offline') {
            update(queueRef, { doctorStatus: 'available' });
          }
        } else {
          // Initialize clinic in RTDB
          update(queueRef, {
            currentToken: 0,
            doctorStatus: 'available',
            avgConsultationTime: 5,
            breakCount: 0
          });
        }
      });
    }
  }, [clinicCode]);

  const handleToggleBreak = () => {
    if (clinicCode) {
      const newStatus = doctorStatus === 'on_break' ? 'available' : 'on_break';
      const updates: any = { doctorStatus: newStatus };
      if (newStatus === 'on_break') {
        updates.breakCount = (breakCount || 0) + 1;
      }
      update(ref(rtdb, `queues/${clinicCode}`), updates);
    }
  };

  const handleNextPatient = async () => {
    if (clinicCode && nextPatient) {
      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      const currentTime = Date.now();
      let newAvgTime = avgConsultationTime;

      if (lastConsultationTimestamp && currentToken > 0) {
        const durationInMinutes = (currentTime - lastConsultationTimestamp) / (1000 * 60);
        const totalPatientsServed = currentToken;
        newAvgTime = ((avgConsultationTime * (totalPatientsServed - 1)) + durationInMinutes) / totalPatientsServed;
        newAvgTime = Math.max(1, Math.min(newAvgTime, 60)); 
      }

      await update(queueRef, { 
        currentToken: nextPatient.token,
        doctorStatus: 'available',
        lastConsultationTimestamp: currentTime,
        avgConsultationTime: newAvgTime
      });
    }
  };
  
  const handleEndDay = async () => {
    if (clinicCode && user) {
      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      const snapshot = await get(queueRef);
      const queueData = snapshot.val();
      const patientsToArchive = queueData?.patients ? Object.values(queueData.patients) : [];

      if (patientsToArchive.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const reportId = `${clinicCode}_${today}`;
        const reportRef = doc(db, 'daily_reports', reportId);
        await setDoc(reportRef, {
          clinicCode: clinicCode,
          date: today,
          totalPatients: patientsToArchive.length,
          avgConsultationTime: queueData.avgConsultationTime || 5,
          totalBreaks: queueData.breakCount || 0,
          patients: patientsToArchive,
          createdAt: serverTimestamp()
        });
      }

      await update(queueRef, { 
        currentToken: 0,
        doctorStatus: 'offline',
        patients: null,
        lastConsultationTimestamp: null,
        avgConsultationTime: 5,
        breakCount: 0
      });
    }
  };

  const handleLogout = async () => {
    const { logout } = useAuth();
    await logout();
    router.push('/login');
  };

  if (!clinicCode) {
    return (
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex items-center justify-center font-mono text-xs">
        Clinic code not found.
      </div>
    );
  }

  const getStatusPill = () => {
    switch(doctorStatus) {
      case 'on_break':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-semibold font-mono">● On Break</span>;
      case 'offline':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold font-mono">● Offline</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17CEA4]/10 border border-[#17CEA4]/20 text-[#17CEA4] text-xs font-semibold font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#17CEA4] animate-ping" /> Available</span>;
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 flex flex-col md:flex-row relative overflow-hidden">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 bg-[#111618] border-r border-gray-800/80 flex flex-col justify-between p-6 shrink-0 z-20">
        <div>
          <div className="flex items-center gap-2.5 mb-8 pb-4 border-b border-gray-800/50">
            <div className="w-8 h-8 rounded-lg bg-[#1A81E6]/10 border border-[#1A81E6]/25 flex items-center justify-center text-[#1A81E6]">
              <Hospital size={16} />
            </div>
            <span className="font-bold text-sm text-white font-mono uppercase tracking-wider">Cockpit Controls</span>
          </div>

          <div className="space-y-3.5">
            <button 
              onClick={handleNextPatient} 
              disabled={!nextPatient || doctorStatus === 'on_break'} 
              className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-white bg-[#1A81E6] hover:bg-[#1A81E6]/95 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent rounded-xl transition-all shadow-[0_4px_12px_rgba(26,129,230,0.15)] uppercase tracking-wider font-mono"
            >
              <ArrowRight size={14}/> Call Next
            </button>
            <button 
              onClick={handleToggleBreak} 
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-gray-300 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-750 rounded-xl transition-all uppercase tracking-wider font-mono"
            >
              <Coffee size={14} className="text-yellow-500"/> {doctorStatus === 'on_break' ? 'Resume Consultation' : 'Take a Break'}
            </button>
            <button 
              onClick={handleEndDay} 
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/10 hover:bg-red-950/20 border border-red-500/20 rounded-xl transition-all uppercase tracking-wider font-mono"
            >
              <PowerOff size={14}/> End Session Day
            </button>
          </div>

          <hr className="my-8 border-gray-800/60"/>

          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
            <ListOrdered size={14} /> Upcoming (Next 5)
          </h3>
          <div className="space-y-2">
            {patientQueue.length > 0 ? (
              patientQueue.slice(0, 5).map(p => (
                <div key={p.token} className="flex items-center justify-between text-xs p-3 bg-[#0D1012] border border-gray-850 rounded-xl">
                  <span className="font-bold font-mono text-[#1A81E6]">#{String(p.token).padStart(3, '0')}</span>
                  <span className="font-semibold text-white truncate max-w-[140px]">{p.name}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-gray-600 font-mono italic">No patients waiting.</p>
            )}
          </div>
        </div>

        <div className="space-y-2.5 mt-8 pt-6 border-t border-gray-800/60">
          <Link href="/dashboard" className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-900/40 border border-gray-850 rounded-lg transition-colors font-mono">
            <ArrowLeft size={14} /> Dashboard Hub
          </Link>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/5 border border-red-500/10 rounded-lg transition-colors font-mono"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main serving interface */}
      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-950/40 relative z-10">
        <div className="absolute top-6 right-6 z-20">
          {getStatusPill()}
        </div>

        {/* Serving Panel */}
        <div className="bg-[#0D1012] flex flex-col items-center justify-center p-8 text-center border-b md:border-b-0 md:border-r border-gray-850">
          <div className="w-16 h-16 rounded-full bg-[#17CEA4]/5 border border-[#17CEA4]/15 flex items-center justify-center text-[#17CEA4] mb-6">
            <UserCheck size={28} />
          </div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">Now Serving</h2>
          <p className="text-8xl md:text-9xl font-extrabold text-white mt-4 tracking-tighter font-mono">
            {currentToken ? String(currentToken).padStart(3, '0') : '---'}
          </p>
          {currentPatient && (
            <p className="text-2xl font-bold text-[#17CEA4] mt-3 font-mono">{currentPatient.name}</p>
          )}
        </div>

        {/* Next Panel */}
        <div className="bg-[#0D1012] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1A81E6]/5 border border-[#1A81E6]/15 flex items-center justify-center text-[#1A81E6] mb-6">
            <Users size={28} />
          </div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono mb-6">Next Patient</h2>

          {nextPatient ? (
            <div className="w-full max-w-sm text-left bg-[#111618] border border-[#1A81E6]/30 p-6 rounded-2xl shadow-[0_4px_25px_rgba(26,129,230,0.1)]">
              <div className="flex justify-between items-baseline gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#1A81E6] font-mono uppercase tracking-wider block">Token Number</span>
                  <p className="text-5xl font-extrabold text-white font-mono mt-1">#{String(nextPatient.token).padStart(3, '0')}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 font-mono uppercase tracking-wider block">Patient Name</span>
                  <p className="text-lg font-bold text-white mt-1 truncate max-w-[160px]">{nextPatient.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-base font-bold text-gray-600 font-mono mt-4">Queue is empty.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DoctorView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex items-center justify-center font-mono text-xs">
        Loading cockpit...
      </div>
    }>
      <DoctorViewContent />
    </Suspense>
  );
}

