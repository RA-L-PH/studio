
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/auth-provider';
import { db, rtdb } from '../../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, onValue, update, get, serverTimestamp } from 'firebase/database';
import { ArrowLeft, ArrowRight, UserCheck, Users, LogOut, Coffee, PowerOff, ListOrdered } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Patient {
  token: number;
  name: string;
}

export default function DoctorView() {
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
  const [breakCount, setBreakCount] = useState<number>(0); // New state for breaks

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
          setDoctorStatus(data.doctorStatus || 'available');
          setAvgConsultationTime(data.avgConsultationTime || 5);
          setLastConsultationTimestamp(data.lastConsultationTimestamp || null);
          setBreakCount(data.breakCount || 0); // Get break count
          const patients = data.patients ? Object.values(data.patients) as Patient[] : [];
          setAllPatients(patients);
          const upcoming = patients
            .filter(p => p.token > currentTokenVal)
            .sort((a, b) => a.token - b.token);
          setPatientQueue(upcoming);
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
          totalBreaks: queueData.breakCount || 0, // Save total breaks
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
        breakCount: 0 // Reset break count
      });
    }
  };

  const handleLogout = async () => {
    const { logout } = useAuth();
    await logout();
    router.push('/login');
  };

  if (!clinicCode) {
    return <div className="min-h-screen flex items-center justify-center"><p>Clinic code not found.</p></div>;
  }

  const getStatusPill = () => {
    switch(doctorStatus) {
      case 'on_break':
        return <span className="absolute top-4 right-4 text-sm bg-yellow-500 text-white px-3 py-1 rounded-full">On a Break</span>;
      case 'offline':
        return <span className="absolute top-4 right-4 text-sm bg-red-500 text-white px-3 py-1 rounded-full">Offline</span>;
      default:
        return <span className="absolute top-4 right-4 text-sm bg-green-500 text-white px-3 py-1 rounded-full">Available</span>;
    }
  }

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 font-sans flex">
      <aside className="w-80 bg-white dark:bg-gray-800 shadow-xl flex flex-col justify-between p-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Controls</h2>
            <div className="space-y-4">
                <button onClick={handleNextPatient} disabled={!nextPatient || doctorStatus === 'on_break'} className="w-full flex items-center justify-center gap-3 px-4 py-5 text-lg font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-all">
                    <ArrowRight size={22}/> Call Next
                </button>
                 <button onClick={handleToggleBreak} className="w-full flex items-center justify-center gap-3 px-4 py-5 text-lg font-bold text-gray-800 dark:text-white bg-yellow-400 dark:bg-yellow-500 rounded-lg shadow-md hover:bg-yellow-500 dark:hover:bg-yellow-600 transition-all">
                    <Coffee size={22}/> {doctorStatus === 'on_break' ? 'Resume' : 'Take a Break'}
                </button>
                <button onClick={handleEndDay} className="w-full flex items-center justify-center gap-3 px-4 py-5 text-lg font-bold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition-all">
                    <PowerOff size={22}/> End Day
                </button>
            </div>
             <hr className="my-8 border-gray-200 dark:border-gray-700"/>
             <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ListOrdered size={20} /> Upcoming</h3>
             <div className="space-y-2">
                {patientQueue.length > 0 ? patientQueue.slice(0, 5).map(p => (
                    <div key={p.token} className="flex items-center justify-between text-lg p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <span className="font-bold text-blue-600 dark:text-blue-400">#{p.token}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                    </div>
                )) : <p className="text-gray-500 dark:text-gray-400">No patients in queue.</p>}
             </div>
        </div>

        <div className="space-y-2">
             <Link href="/dashboard" className="flex items-center justify-center gap-2 p-3 font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                 <ArrowLeft size={18} />
                 <span>Back to Dashboard</span>
             </Link>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors">
                <LogOut size={18} />
                <span>Logout</span>
             </button>
        </div>
      </aside>

      <main className="flex-grow grid grid-rows-2 grid-cols-1 md:grid-cols-2 md:grid-rows-1 gap-px bg-gray-200 dark:bg-gray-700 relative">
        {getStatusPill()}
        <div className="bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
            <UserCheck className="text-green-500 mb-6" size={80} />
            <h2 className="text-4xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Now Serving</h2>
            <p className="text-9xl font-extrabold text-gray-900 dark:text-white mt-4 tracking-tighter">{currentToken || '-'}</p>
            {currentPatient && <p className="text-4xl font-semibold text-gray-700 dark:text-gray-200 mt-2">{currentPatient.name}</p>}
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-8 text-center">
             <Users className="text-blue-500 mb-6" size={80} />
            <h2 className="text-4xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Upcoming Patients</h2>
            {nextPatient ? (
                <div className="w-full max-w-md mt-6 text-left">
                    <div className="bg-blue-500 text-white p-6 rounded-xl shadow-lg mb-6">
                        <p className="text-sm uppercase font-bold opacity-80">Next in Line</p>
                        <div className="flex items-baseline gap-4">
                            <p className="text-6xl font-extrabold">{nextPatient.token}</p>
                            <p className="text-3xl font-semibold truncate">{nextPatient.name}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {patientQueue.slice(1, 4).map(p => (
                            <div key={p.token} className="bg-white dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center shadow-sm">
                                <span className="font-bold text-2xl text-gray-800 dark:text-white">#{p.token}</span>
                                <span className="font-medium text-lg text-gray-600 dark:text-gray-300 truncate">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-4xl font-semibold text-gray-500 dark:text-gray-400 mt-6">The queue is empty.</p>
            )}
        </div>
      </main>
    </div>
  );
}
