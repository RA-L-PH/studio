
'use client';

import { useAuth } from '../../firebase/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Stethoscope, User, Monitor, ArrowRight, LogOut, FileText, ChevronDown, Clock, Users, Coffee, Hospital, Calendar } from 'lucide-react';

interface ClinicData {
  clinicName: string;
  clinicCode: string;
}

interface Patient {
  token: number;
  name: string;
}

interface DailyReport {
  id: string;
  date: string;
  totalPatients?: number;
  avgConsultationTime?: number;
  totalBreaks?: number;
  patients: Patient[];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchClinicData = async () => {
      const clinicRef = doc(db, 'clinics', user.uid);
      const docSnap = await getDoc(clinicRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as ClinicData;
        setClinicData(data);
        fetchReports(data.clinicCode);
      } else {
        setLoading(false);
      }
    };

    const fetchReports = async (clinicCode: string) => {
      setLoadingReports(true);
      const reportsRef = collection(db, 'daily_reports');
      const q = query(
        reportsRef,
        where('clinicCode', '==', clinicCode),
        orderBy('date', 'desc')
      );
      try {
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as DailyReport[];
        setReports(fetchedReports);
      } catch (error) {
        console.error("Error fetching reports: ", error);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchClinicData();
    setLoading(false);
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const Card = ({ icon, title, description, path }: { icon: React.ReactNode, title: string, description: string, path: string }) => (
    <div
      className="bg-[#111618] border border-gray-800 hover:border-gray-700/80 p-6 rounded-2xl flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all cursor-pointer group"
      onClick={() => router.push(path)}
    >
      <div>
        <div className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl w-max mb-4 text-[#1A81E6] group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white font-mono">{title}</h3>
        <p className="text-gray-400 mt-1.5 text-xs leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center justify-end font-semibold text-xs uppercase tracking-wider font-mono text-[#17CEA4] mt-6 gap-1 group-hover:translate-x-1 transition-transform">
        <span>Open Terminal</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex items-center justify-center font-mono text-xs">
        Syncing dashboard...
      </div>
    );
  }

  if (!clinicData) {
    return (
      <div className="min-h-screen bg-[#0D1012] text-gray-100 flex flex-col items-center justify-center p-6 relative">
        <div className="max-w-md w-full bg-[#111618] p-8 border border-gray-800 rounded-2xl text-center">
          <h1 className="text-2xl font-bold mb-3 font-mono">No Workspace Found</h1>
          <p className="text-xs text-gray-400 mb-6">Please set up your clinic profile first.</p>
          <button 
            onClick={() => router.push('/signup')} 
            className="w-full bg-[#1A81E6] hover:bg-[#1A81E6]/95 text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(26,129,230,0.15)] text-xs uppercase tracking-wider font-mono"
          >
            Create Clinic Profile
          </button>
        </div>
      </div>
    );
  }

  const { clinicName, clinicCode } = clinicData;

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-800/40 bg-[#0D1012]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A81E6]/10 border border-[#1A81E6]/25 flex items-center justify-center text-[#1A81E6]">
              <Hospital size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-mono leading-tight">{clinicName}</h1>
              <p className="text-[10px] text-gray-500 font-mono">WORKSPACE CODE: <span className="text-[#17CEA4] font-semibold">{clinicCode}</span></p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 text-xs font-semibold text-red-400 transition-all font-mono"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 w-full flex-grow">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-mono mb-2">Clinic Management</h2>
          <p className="text-xs text-gray-400">Launch dashboard terminals to orchestrate live clinic flow operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card
            icon={<Stethoscope size={20}/>}
            title="Doctor's Cockpit"
            description="Manage live patient flow, record breaks, view upcoming tokens, and control active consultations."
            path={`/dashboard/doctor?code=${clinicCode}`}
          />
          <Card
            icon={<User size={20}/>}
            title="Rapid Intake Portal"
            description="Register incoming patients immediately and manage waiting lists on the live queue."
            path={`/dashboard/reception?code=${clinicCode}`}
          />
          <Card
            icon={<Monitor size={20}/>}
            title="Live Patient Monitor"
            description="Display the current serving tokens and waiting ticker in the clinic lobby area."
            path={`/dashboard/queue?code=${clinicCode}`}
          />
        </div>

        <section className="max-w-3xl mx-auto mt-20 border-t border-gray-800/40 pt-16">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Calendar size={18} className="text-[#17CEA4]" />
            <h2 className="text-xl font-bold text-white font-mono">Past Session Reports</h2>
          </div>

          {loadingReports ? (
            <p className="text-center text-xs text-gray-500 font-mono">Syncing history reports...</p>
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="bg-[#111618] border border-gray-800/80 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === report.id ? null : report.id)}
                    className="w-full flex justify-between items-center p-5 text-left font-mono font-bold text-sm text-white hover:bg-gray-900/35 transition-colors"
                  >
                    <span>{report.date}</span>
                    <ChevronDown size={16} className={`transform text-gray-400 transition-transform ${activeAccordion === report.id ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  {activeAccordion === report.id && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-800/40 bg-[#0D1012]/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#0D1012]/60 border border-gray-850 p-4 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-[#1A81E6]/10 border border-[#1A81E6]/20 rounded-lg text-[#1A81E6]">
                            <Users size={18}/>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Total Patients</p>
                            <p className="text-lg font-bold text-white font-mono">{report.totalPatients || 0}</p>
                          </div>
                        </div>

                        <div className="bg-[#0D1012]/60 border border-gray-850 p-4 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-[#17CEA4]/10 border border-[#17CEA4]/20 rounded-lg text-[#17CEA4]">
                            <Clock size={18}/>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Avg. Consult</p>
                            <p className="text-lg font-bold text-white font-mono">{(report.avgConsultationTime || 0).toFixed(1)}m</p>
                          </div>
                        </div>

                        <div className="bg-[#0D1012]/60 border border-gray-850 p-4 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
                            <Coffee size={18}/>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Total Breaks</p>
                            <p className="text-lg font-bold text-white font-mono">{report.totalBreaks || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl max-w-md mx-auto">
              <FileText className="mx-auto h-8 w-8 text-gray-600 mb-3" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">No reports archived</h3>
              <p className="text-[11px] text-gray-500 mt-1">Archived session logs will appear here once you complete a clinic day.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

