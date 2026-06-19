
'use client';

import { useState, useEffect } from 'react';
import { db, rtdb } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, onValue, Unsubscribe } from 'firebase/database';
import { useRouter } from 'next/navigation';
import { Hospital, Clock, Users, Stethoscope, MapPin, Search } from 'lucide-react';

interface Clinic {
  id: string;
  clinicName: string;
  doctorName: string;
  specialization: string;
  address: string;
  clinicCode: string;
  queueSize: number;
  waitTime: number;
  status: 'available' | 'on_break' | 'offline';
}

export default function FindClinic() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const listeners: Unsubscribe[] = [];

    const fetchClinicsAndQueues = async () => {
      setLoading(true);
      try {
        // 1. Fetch static clinic data from Firestore
        const clinicsSnapshot = await getDocs(collection(db, "clinics"));
        if (!isMounted) return;

        const clinicsFromDb = clinicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Omit<Clinic, 'queueSize' | 'waitTime' | 'status'>[];

        if (clinicsFromDb.length === 0) {
          setClinics([]);
          setLoading(false);
          return;
        }

        // Initialize state with Firestore data
        const initialClinicState = clinicsFromDb.map(c => ({ ...c, queueSize: 0, waitTime: 0, status: 'offline' as const }));
        if (isMounted) {
            setClinics(initialClinicState);
        }

        let initialLoadsPending = clinicsFromDb.length;

        // 2. Set up real-time listeners for each clinic's queue data
        clinicsFromDb.forEach(clinicInfo => {
          const queueRef = ref(rtdb, `queues/${clinicInfo.clinicCode}`);
          const listener = onValue(queueRef, (snapshot) => {
            if (!isMounted) return;

            const queueData = snapshot.val();
            const avgTime = queueData?.avgConsultationTime || 5;
            const currentToken = queueData?.currentToken || 0;
            const patients = queueData?.patients ? Object.values(queueData.patients) : [];
            const queueSize = patients.filter((p: any) => p.token > currentToken).length;
            const waitTime = Math.round(queueSize * avgTime);
            const status = queueData?.doctorStatus || 'offline';

            setClinics(prevClinics => 
              prevClinics.map(c => c.id === clinicInfo.id ? { ...c, queueSize, waitTime, status } : c)
              .sort((a, b) => a.clinicName.localeCompare(b.clinicName))
            );

            if (initialLoadsPending > 0) {
              initialLoadsPending--;
              if (initialLoadsPending === 0 && isMounted) {
                setLoading(false);
              }
            }
          }, (error) => {
            console.error(`Error fetching queue for ${clinicInfo.clinicCode}:`, error);
            if (initialLoadsPending > 0) {
              initialLoadsPending--;
              if (initialLoadsPending === 0 && isMounted) {
                setLoading(false);
              }
            }
          });
          listeners.push(listener);
        });

      } catch (error) {
        console.error("Failed to fetch clinics:", error);
        if (isMounted) {
            setLoading(false);
        }
      }
    };

    fetchClinicsAndQueues();

    return () => {
      isMounted = false;
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const filteredClinics = clinics.filter(clinic =>
    clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIndicator = (status: Clinic['status']) => {
      switch(status) {
          case 'available': return <span className="text-green-500 font-semibold">● Open</span>;
          case 'on_break': return <span className="text-yellow-500 font-semibold">● On Break</span>;
          default: return <span className="text-red-500 font-semibold">● Closed</span>;
      }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4 text-gray-900 dark:text-white">Find a Clinic</h1>
            <p className="text-md md:text-lg text-center text-gray-600 dark:text-gray-300 mb-8">Browse available clinics and view their live queue status and wait times.</p>

            <div className="max-w-2xl mx-auto mb-12">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input 
                        type="text"
                        placeholder="Search by clinic name, doctor, or specialty..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 md:py-4 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <p className="text-center py-10 text-gray-500 dark:text-gray-400">Loading clinics...</p>
            ) : filteredClinics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredClinics.map(clinic => (
                        <div key={clinic.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                           <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <Hospital className="text-blue-500 mb-3" size={32}/>
                                    <div className="text-sm text-right">{getStatusIndicator(clinic.status)}</div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{clinic.clinicName}</h2>
                                <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
                                    <Stethoscope size={16}/> 
                                    <span>Dr. {clinic.doctorName} ({clinic.specialization})</span>
                                </div>
                                <div className="flex items-start gap-2 mt-3 text-gray-600 dark:text-gray-400">
                                    <MapPin size={16} className="mt-1 shrink-0"/> 
                                    <span>{clinic.address}</span>
                                </div>
                           </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2"><Users size={18} /><span className="text-sm text-gray-500 dark:text-gray-400">In Queue</span></div>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{clinic.queueSize}</p>
                                </div>
                                <div className="text-center">
                                     <div className="flex items-center justify-center gap-2"><Clock size={18} /><span className="text-sm text-gray-500 dark:text-gray-400">Wait Time</span></div>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">≈{clinic.waitTime} min</p>
                                </div>
                            </div>

                           <div className="p-6 mt-auto">
                             <button 
                                onClick={() => router.push(`/mobile-queue?code=${clinic.clinicCode}`)}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-base disabled:bg-gray-400"
                                disabled={clinic.status === 'offline'}
                              >
                                View Live Queue
                               </button>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Clinics Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">There are no clinics available, or none match your search.</p>
                </div>
            )}
        </div>
    </div>
  );
}
