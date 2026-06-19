
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/auth-provider';
import { db, rtdb } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue, set, get, child } from 'firebase/database';
import { ArrowLeft, UserPlus, ListOrdered, LogOut, Clock, Hospital } from 'lucide-react';
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
      // Fetch static clinic details from Firestore
      const q = query(collection(db, "clinics"), where("clinicCode", "==", clinicCode));
      getDocs(q).then(querySnapshot => {
          if (!querySnapshot.empty) {
              const clinicData = querySnapshot.docs[0].data() as ClinicDetails;
              setClinicDetails(clinicData);
          }
      });

      // Listen for real-time queue updates from RTDB
      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      onValue(queueRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const currentTokenVal = data.currentToken || 0;
          const allPatients = data.patients ? Object.values(data.patients) as Patient[] : [];
          const upcomingPatients = allPatients.filter(p => p.token > currentTokenVal);
          const avgTime = data.avgConsultationTime || 5; // Use dynamic or default
          
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
    return <div className="min-h-screen flex items-center justify-center"><p>Clinic code not found. Please access this page via your dashboard.</p></div>;
  }

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 font-sans flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-md z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Hospital className="text-blue-600 dark:text-blue-400"/>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">{clinicDetails?.clinicName || 'Reception'}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dr. {clinicDetails?.doctorName}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    <ArrowLeft size={18} />
                    <span>Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow grid md:grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700">
        {/* Left Panel: Patient Intake */}
        <div className="bg-gray-100 dark:bg-gray-900 p-8 flex flex-col">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><UserPlus /> Rapid Intake Portal</h2>
            <form onSubmit={handleAddPatient} className="space-y-5">
                <input 
                    type="text" 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter Full Name"
                    required
                    className="w-full px-5 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                />
                <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-lg">
                    Register Patient & Add to Queue
                </button>
            </form>
             <div className="mt-auto pt-8">
                <p className="text-center text-gray-500 dark:text-gray-400">The patient will be assigned a token and added to the consultation queue automatically.</p>
            </div>
        </div>

        {/* Right Panel: Live Queue */}
        <div className="bg-gray-100 dark:bg-gray-900 p-8 flex flex-col">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><ListOrdered /> Live Consultation Queue</h2>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-lg">
                  <span className="text-lg font-semibold text-green-800 dark:text-green-300">Now Serving</span>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{currentToken || '-'}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-lg">
                  <span className="text-lg font-semibold text-blue-800 dark:text-blue-300">Est. Wait Time</span>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">≈{waitTime} min</p>
              </div>
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                {queue.length > 0 ? queue.sort((a,b)=>a.token - b.token).map(patient => (
                    <div key={patient.token} className={`flex items-center justify-between p-4 rounded-lg transition-all ${patient.token <= currentToken ? 'bg-gray-200 dark:bg-gray-700 opacity-60' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                        <span className={`font-bold text-xl ${patient.token <= currentToken ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>#{patient.token}</span>
                        <span className={`font-medium text-lg ${patient.token <= currentToken ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{patient.name}</span>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Clock size={40} className="text-gray-400 mb-2"/>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">The queue is currently empty.</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
