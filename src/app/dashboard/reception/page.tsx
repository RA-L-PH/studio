
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/auth-provider';
import { db, rtdb } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue, set, get, child } from 'firebase/database';
import { ArrowLeft, UserPlus, ListOrdered, LogOut, Clock, Hospital, UserCheck, Activity } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Patient {
  token: number;
  name: string;
}

interface ClinicDetails {
  clinicName: string;
  doctorName: string;
}

export default function ReceptionView() {
  const { logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicCode = searchParams.get('code');

  const [clinicDetails, setClinicDetails] = useState<ClinicDetails | null>(null);
  const [patientName, setPatientName] = useState('');
  const [queue, setQueue] = useState<Patient[]>([]);
  const [currentToken, setCurrentToken] = useState<number>(0);
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
      onValue(queueRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const currentTokenVal = data.currentToken || 0;
          const allPatients = data.patients ? Object.values(data.patients) as Patient[] : [];
          const upcomingPatients = allPatients.filter(p => p.token > currentTokenVal);
          const avgTime = data.avgConsultationTime || 5;
          
          setQueue(allPatients);
          setCurrentToken(currentTokenVal);
          setWaitTime(Math.round(upcomingPatients.length * avgTime));
        }
      });
    }
  }, [clinicCode]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicCode && patientName.trim()) {
        const queueRef = ref(rtdb, `queues/${clinicCode}`);
        const snapshot = await get(queueRef);
        const data = snapshot.val();

        let nextToken = 1;
        if (data && data.patients) {
            const tokens = Object.values(data.patients).map((p: any) => p.token);
            if (tokens.length > 0) {
              nextToken = Math.max(...tokens) + 1;
            }
        }

        const newPatientRef = child(queueRef, `patients/${nextToken}`);
        set(newPatientRef, { token: nextToken, name: patientName.trim() });
        setPatientName('');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!clinicCode) {
    return (
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex items-center justify-center font-mono text-xs">
        Clinic code not found. Please access this page via your dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-800/40 bg-[#0D1012]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A81E6]/10 border border-[#1A81E6]/25 flex items-center justify-center text-[#1A81E6]">
              <Hospital size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white font-mono leading-none">{clinicDetails?.clinicName || 'Reception'}</h1>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">Dr. {clinicDetails?.doctorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors font-mono">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <button 
              onClick={handleLogout} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 text-xs font-semibold text-red-400 transition-all font-mono"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intake Panel */}
        <div className="bg-[#111618] border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800/60">
              <div className="w-8 h-8 rounded-lg bg-[#1A81E6]/10 border border-[#1A81E6]/20 flex items-center justify-center text-[#1A81E6]">
                <UserPlus size={16} />
              </div>
              <h2 className="text-lg font-bold text-white font-mono">Rapid Intake Portal</h2>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider font-mono">Patient Name</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full px-4 py-3 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#1A81E6] hover:bg-[#1A81E6]/95 text-white font-bold py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(26,129,230,0.15)] text-xs uppercase tracking-wider font-mono"
              >
                Register & Queue Patient
              </button>
            </form>
          </div>

          <div className="mt-8 text-center border-t border-gray-800/40 pt-6">
            <p className="text-[11px] text-gray-500 font-mono">Intake auto-generates sequential token numbers instantly synced to clinician dashboards.</p>
          </div>
        </div>

        {/* Live Queue Panel */}
        <div className="bg-[#111618] border border-gray-800/80 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800/60">
            <div className="w-8 h-8 rounded-lg bg-[#17CEA4]/10 border border-[#17CEA4]/20 flex items-center justify-center text-[#17CEA4]">
              <ListOrdered size={16} />
            </div>
            <h2 className="text-lg font-bold text-white font-mono">Live Consultation Queue</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0D1012] border border-gray-850 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#17CEA4] font-mono uppercase tracking-wider mb-1 font-bold">
                <Activity size={12} className="animate-pulse" /> Serving
              </div>
              <p className="text-2xl font-bold text-white font-mono">{currentToken || '-'}</p>
            </div>
            
            <div className="bg-[#0D1012] border border-gray-850 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
                <Clock size={12} /> Wait Time
              </div>
              <p className="text-2xl font-bold text-white font-mono">~{waitTime}m</p>
            </div>
          </div>

          <div className="space-y-2 flex-grow overflow-y-auto max-h-[320px] pr-1 custom-scrollbar">
            {queue.length > 0 ? (
              queue.sort((a,b)=>a.token - b.token).map(patient => {
                const isCompleted = patient.token <= currentToken;
                return (
                  <div 
                    key={patient.token} 
                    className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                      isCompleted 
                        ? 'border-gray-850 bg-gray-950/20 opacity-40' 
                        : 'border-gray-800 bg-[#0D1012] shadow-sm hover:border-gray-750'
                    }`}
                  >
                    <span className={`font-mono text-sm font-bold ${isCompleted ? 'text-gray-600' : 'text-[#1A81E6]'}`}>
                      #{String(patient.token).padStart(3, '0')}
                    </span>
                    <span className={`text-xs font-semibold ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {patient.name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock size={32} className="text-gray-600 mb-2"/>
                <p className="text-xs text-gray-500 font-mono">Queue is empty</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

