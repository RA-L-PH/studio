
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/auth-provider';
import { rtdb, db } from '../../../firebase';
import { ref, onValue, set, push, serverTimestamp } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface Patient {
  token: number;
  name: string;
  timestamp: object;
}

export default function ReceptionView() {
  const { user } = useAuth();
  const [clinicCode, setClinicCode] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [nextToken, setNextToken] = useState(1);

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
      const patientsRef = ref(rtdb, `queues/${clinicCode}/patients`);
      onValue(patientsRef, (snapshot) => {
        const patients = snapshot.val();
        let maxToken = 0;
        if (patients) {
            for (const key in patients) {
                if (patients[key].token > maxToken) {
                    maxToken = patients[key].token;
                }
            }
        }
        setNextToken(maxToken + 1);
      });
    }
  }, [clinicCode]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicCode && patientName) {
      const newPatient: Patient = {
        token: nextToken,
        name: patientName,
        timestamp: serverTimestamp()
      };

      const newPatientRef = push(ref(rtdb, `queues/${clinicCode}/patients`));
      await set(newPatientRef, newPatient);
      setPatientName('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-6 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reception Desk</h1>
          <p className="text-gray-500 mb-6">Add new patients to the queue.</p>

          <form onSubmit={handleAddPatient} className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-grow">
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Patient Name</label>
                <input 
                  id="patientName"
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Token</p>
                <p className="text-2xl font-bold text-indigo-600">{nextToken}</p>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              disabled={!patientName}
            >
              Add to Queue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
