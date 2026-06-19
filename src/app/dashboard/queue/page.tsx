
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../firebase/auth-provider';
import { rtdb, db } from '../../../firebase';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface Patient {
  token: number;
  name: string;
}

interface QueueData {
  currentToken: number;
  patients: Record<string, Patient>;
}

export default function QueueDisplay() {
  const { user } = useAuth();
  const [clinicCode, setClinicCode] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        const getClinicCode = async () => {
            const clinicRef = doc(db, 'clinics', user.uid);
            const clinicSnap = await getDoc(clinicRef);
            if (clinicSnap.exists()) {
                setClinicCode(clinicSnap.data().clinicCode);
            }
        };
        getClinicCode();
    }
  }, [user]);

  useEffect(() => {
    if (clinicCode) {
      const queueRef = ref(rtdb, `queues/${clinicCode}`);
      const unsubscribe = onValue(queueRef, (snapshot) => {
        setQueueData(snapshot.val());
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [clinicCode]);

  if (loading || !queueData) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading Queue...</div>;
  }

  const waitingPatients = queueData.patients ? 
    Object.values(queueData.patients)
        .filter(p => p.token > queueData.currentToken)
        .sort((a, b) => a.token - b.token)
        .slice(0, 5) // Display next 5 patients
    : [];

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col p-4 sm:p-6 md:p-8 relative">
       <Link href="/dashboard" className="absolute top-4 left-4 text-sm text-gray-400 hover:text-white">&larr; Back to Dashboard</Link>
        <div className="flex-1 grid md:grid-cols-3 gap-8">
            {/* Currently Serving Section */}
            <div className="md:col-span-2 flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8">
                <h2 className="text-4xl sm:text-5xl font-semibold text-gray-400 mb-4">Now Serving</h2>
                <p className="text-8xl sm:text-9xl md:text-[12rem] font-bold text-green-400 tracking-tighter">{queueData.currentToken}</p>
            </div>

            {/* Up Next Section */}
            <div className="md:col-span-1 flex flex-col bg-gray-800 rounded-lg p-8">
                <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-6">Up Next</h2>
                <div className="flex-1 flex flex-col justify-center space-y-4">
                    {waitingPatients.length > 0 ? (
                        waitingPatients.map((patient, index) => (
                            <div key={patient.token} className={`flex justify-between items-center p-4 rounded-lg ${
                                index === 0 ? 'bg-blue-500 scale-105' : 'bg-gray-700'
                            }`}>
                                <span className={`text-2xl sm:text-3xl font-bold ${
                                    index === 0 ? 'text-white' : 'text-blue-300'
                                }`}>{patient.token}</span>
                                <span className={`text-lg sm:text-xl ${
                                    index === 0 ? 'text-white' : 'text-gray-300'
                                }`}>{patient.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400">The queue is empty.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
