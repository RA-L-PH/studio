
'use client';

import { useState, useEffect } from 'react';
import { db, rtdb } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, onValue, Unsubscribe } from 'firebase/database';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Hospital, Clock, Users, Stethoscope, MapPin, Search, ArrowLeft } from 'lucide-react';

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

        const initialClinicState = clinicsFromDb.map(c => ({ ...c, queueSize: 0, waitTime: 0, status: 'offline' as const }));
        if (isMounted) {
            setClinics(initialClinicState);
        }

        let initialLoadsPending = clinicsFromDb.length;

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
          case 'available': return <span className="text-[#17CEA4] font-semibold text-xs flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#17CEA4] animate-ping" /> Open</span>;
          case 'on_break': return <span className="text-yellow-500 font-semibold text-xs flex items-center gap-1.5">● On Break</span>;
          default: return <span className="text-gray-500 font-semibold text-xs flex items-center gap-1.5">● Closed</span>;
      }
  }

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 p-6 relative">
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-[#1A81E6]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono mb-3">Find a Clinic</h1>
          <p className="text-sm text-gray-400">Browse available clinics and check live waiting queues in real-time.</p>
        </div>

        <div className="max-w-xl mx-auto mb-16">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
            <input 
              type="text"
              placeholder="Search clinic, doctor, or specialty..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#111618] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] transition-all shadow-sm text-sm"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-400 font-mono text-xs">Syncing available clinics...</p>
        ) : filteredClinics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClinics.map(clinic => (
              <div key={clinic.id} className="bg-[#111618] border border-gray-800/80 rounded-2xl flex flex-col hover:border-gray-700/80 hover:shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1A81E6]/10 border border-[#1A81E6]/20 flex items-center justify-center text-[#1A81E6]">
                      <Hospital size={20}/>
                    </div>
                    {getStatusIndicator(clinic.status)}
                  </div>
                  <h2 className="text-xl font-bold text-white truncate font-mono">{clinic.clinicName}</h2>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                    <Stethoscope size={14} className="text-[#17CEA4]"/> 
                    <span>Dr. {clinic.doctorName} ({clinic.specialization})</span>
                  </div>
                  <div className="flex items-start gap-1.5 mt-2 text-xs text-gray-400">
                    <MapPin size={14} className="text-gray-500 mt-0.5 shrink-0"/> 
                    <span>{clinic.address}</span>
                  </div>
                </div>

                <div className="bg-[#0D1012] px-6 py-4 grid grid-cols-2 gap-4 border-t border-b border-gray-800/60">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
                      <Users size={12} /> Queue Size
                    </div>
                    <p className="text-xl font-bold text-white font-mono">{clinic.queueSize}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
                      <Clock size={12} /> Est. Wait Time
                    </div>
                    <p className="text-xl font-bold text-white font-mono">~{clinic.waitTime}m</p>
                  </div>
                </div>

                <div className="p-5 mt-auto">
                  <button 
                    onClick={() => router.push(`/mobile-queue?code=${clinic.clinicCode}`)}
                    className="w-full bg-[#1A81E6] hover:bg-[#1A81E6]/90 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(26,129,230,0.15)] text-xs uppercase tracking-wider font-mono"
                    disabled={clinic.status === 'offline'}
                  >
                    {clinic.status === 'offline' ? 'Offline' : 'Monitor Live Queue'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl max-w-md mx-auto">
            <Hospital className="mx-auto text-gray-600 mb-3" size={32} />
            <h3 className="text-base font-bold text-white">No Clinics Found</h3>
            <p className="text-xs text-gray-500 mt-1">There are no clinics available matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

