
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/auth-provider';
import { rtdb, db } from '../../../firebase';
import { ref, onValue, set, runTransaction } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DoctorView() {
  const { user } = useAuth();
  const [clinicCode, setClinicCode] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<number>(0);

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
      const queueRef = ref(rtdb, `queues/${clinicCode}/currentToken`);
      const unsubscribe = onValue(queueRef, (snapshot) => {
        setCurrentToken(snapshot.val() ?? 0);
      });
      return () => unsubscribe();
    }
  }, [clinicCode]);

  const handleNextToken = () => {
    if (clinicCode) {
      const queueRef = ref(rtdb, `queues/${clinicCode}/currentToken`);
      runTransaction(queueRef, (currentValue) => (currentValue || 0) + 1);
    }
  };

  const handlePrevToken = () => {
    if (clinicCode) {
      const queueRef = ref(rtdb, `queues/${clinicCode}/currentToken`);
      runTransaction(queueRef, (currentValue) => Math.max(0, (currentValue || 0) - 1));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
            <Link href="/dashboard" className="absolute top-6 left-6 text-gray-500 hover:text-gray-800">
                &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Doctor's Control</h1>
            <p className="text-gray-500 mb-8">Manage the patient queue by calling the next token.</p>

            <div className="bg-blue-50 rounded-xl p-8 mb-8">
                <p className="text-lg font-semibold text-blue-700 mb-2">Currently Serving Token</p>
                <p className="text-7xl font-extrabold text-blue-900 tracking-tight">{currentToken}</p>
            </div>

            <div className="flex justify-center items-center gap-4">
                <button 
                    onClick={handlePrevToken} 
                    className="p-4 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
                    disabled={currentToken <= 0}
                >
                    <ArrowLeft size={24} />
                </button>
                <button 
                    onClick={handleNextToken} 
                    className="p-6 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-colors"
                >
                    <ArrowRight size={32} />
                </button>
            </div>
        </div>
    </div>
  );
}
