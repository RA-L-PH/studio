
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../../../firebase';
import Link from 'next/link';

interface Patient {
  token: number;
  name: string;
  // Add other patient details here if needed
}

interface QueueData {
  currentToken: number;
  lastUpdated: string;
  patients: Record<string, Patient>;
}

export default function ClinicQueue() {
  const params = useParams();
  const clinicCode = params.clinicCode as string;
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
    }
  }, [clinicCode]);

  if (loading) {
    return <div>Loading queue...</div>;
  }

  if (!queueData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
              <h1 className="text-2xl font-bold mb-4">Clinic Not Found</h1>
              <p className="mb-6">The clinic with code <strong>{clinicCode}</strong> does not exist.</p>
              <Link href="/find-clinic" className="text-blue-500 hover:underline">
              Go back to search
              </Link>
          </div>
      </div>
    );
  }

  const patients = queueData.patients ? Object.values(queueData.patients) : [];
  const waitingPatients = patients.filter(p => p.token > queueData.currentToken);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clinic Queue</h1>
          <Link href="/find-clinic" className="text-blue-500 hover:underline">
            &larr; Back to Search
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-blue-100 p-6 rounded-lg text-center">
            <p className="text-lg font-semibold text-blue-800">Currently Serving</p>
            <p className="text-5xl font-bold text-blue-900">{queueData.currentToken}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg text-center">
            <p className="text-lg font-semibold text-green-800">Approx. Wait Time</p>
            <p className="text-5xl font-bold text-green-900">{waitingPatients.length * 15} min</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Waiting Patients</h2>
          {waitingPatients.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {waitingPatients.map((patient) => (
                <li key={patient.token} className="py-4 flex justify-between items-center">
                  <span className="text-lg font-medium">Token: {patient.token}</span>
                  <span className="text-lg">{patient.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">The queue is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
}
