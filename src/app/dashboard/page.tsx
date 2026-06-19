
'use client';

import { useAuth } from '../../firebase/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Stethoscope, User, Monitor, ArrowRight, LogOut, FileText, ChevronDown, Clock, Users, Coffee } from 'lucide-react';

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
  totalPatients?: number; // Make optional for older reports
  avgConsultationTime?: number; // Make optional
  totalBreaks?: number; // Make optional
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
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col justify-between"
        onClick={() => router.push(path)}
    >
        <div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full w-max mb-3">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{description}</p>
        </div>
        <div className="flex items-center justify-end font-semibold text-blue-600 dark:text-blue-400 mt-4 text-sm">
            <span>Launch</span>
            <ArrowRight className="ml-1.5" size={18} />
        </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading dashboard...</p></div>
  }

  if (!clinicData) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
            <h1 className="text-2xl font-bold mb-4">No clinic data found.</h1>
            <p className="mb-8">Please set up your clinic first.</p>
            <button onClick={() => router.push('/signup')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Go to Signup</button>
        </div>
    )
  }

  const { clinicName, clinicCode } = clinicData;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{clinicName}</h1>
            <p className="text-gray-500 dark:text-gray-400">Clinic Code: <span className="font-semibold text-gray-700 dark:text-gray-300">{clinicCode}</span></p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 transition-colors">
                <LogOut size={18} />
                <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 overflow-y-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-12">Clinic Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card
                icon={<Stethoscope size={24} className="text-blue-600 dark:text-blue-400"/>}
                title="Doctor's Cockpit"
                description="Manage patient flow, view current token, and control consultation status."
                path={`/dashboard/doctor?code=${clinicCode}`}
            />
            <Card
                icon={<User size={24} className="text-blue-600 dark:text-blue-400"/>}
                title="Rapid Intake Portal"
                description="Register new patients and manage the live consultation queue."
                path={`/dashboard/reception?code=${clinicCode}`}
            />
            <Card
                icon={<Monitor size={24} className="text-blue-600 dark:text-blue-400"/>}
                title="Live Patient Monitor"
                description="Display the current token and upcoming queue in the waiting area."
                path={`/dashboard/queue?code=${clinicCode}`}
            />
        </div>

        <section className="max-w-5xl mx-auto mt-16">
          <h2 className="text-3xl font-extrabold text-center mb-8">Past Reports</h2>
          {loadingReports ? (
            <p className="text-center text-gray-500">Loading reports...</p>
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === report.id ? null : report.id)}
                    className="w-full flex justify-between items-center p-6 text-left font-semibold text-lg"
                  >
                    <span>{report.date}</span>
                    <ChevronDown className={`transform transition-transform ${activeAccordion === report.id ? 'rotate-180' : ''}`} />
                  </button>
                  {activeAccordion === report.id && (
                     <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex items-center gap-4">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                  <Users size={24} className="text-blue-600 dark:text-blue-400"/>
                              </div>
                              <div>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Patients</p>
                                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.totalPatients || 0}</p>
                              </div>
                          </div>
                           <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex items-center gap-4">
                               <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                  <Clock size={24} className="text-blue-600 dark:text-blue-400"/>
                              </div>
                              <div>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">Avg. Consultation Time</p>
                                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{(report.avgConsultationTime || 0).toFixed(1)} mins</p>
                              </div>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex items-center gap-4">
                               <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                  <Coffee size={24} className="text-blue-600 dark:text-blue-400"/>
                              </div>
                              <div>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Breaks</p>
                                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.totalBreaks || 0}</p>
                              </div>
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No reports yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">When you use the "End Day" function, your archived reports will appear here.</p>
            </div>

          )}
        </section>
      </main>
    </div>
  );
}
