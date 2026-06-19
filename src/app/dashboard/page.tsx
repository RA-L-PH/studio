
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../firebase/auth-provider';
import Link from 'next/link';
import { Stethoscope, User, Monitor } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Dashboard</h1>
        <p className="text-center text-lg text-gray-600 mb-12">Welcome! Please select your role to continue.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link href="/dashboard/doctor" className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
            <Stethoscope className="mx-auto text-blue-500 mb-4" size={48} />
            <h2 className="text-2xl font-semibold">Doctor</h2>
            <p className="text-gray-500 mt-2">View and manage patient consultations.</p>
          </Link>
          
          <Link href="/dashboard/reception" className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
            <User className="mx-auto text-green-500 mb-4" size={48} />
            <h2 className="text-2xl font-semibold">Reception</h2>
            <p className="text-gray-500 mt-2">Manage patient check-in and queue.</p>
          </Link>

          <Link href="/dashboard/queue" className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
            <Monitor className="mx-auto text-purple-500 mb-4" size={48} />
            <h2 className="text-2xl font-semibold">Queue Display</h2>
            <p className="text-gray-500 mt-2">Display the live queue for patients.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
