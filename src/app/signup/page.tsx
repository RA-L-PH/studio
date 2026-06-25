
'use client';

import { useState } from 'react';
import { useAuth } from '../../firebase/auth-provider';
import { useRouter } from 'next/navigation';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';

function generateClinicCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const { user } = await signup(email, password);
      const clinicCode = generateClinicCode();
      await setDoc(doc(db, 'clinics', user.uid), {
        clinicName,
        clinicCode,
        owner: user.uid,
        doctorName,
        specialization,
        address,
      });
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 flex flex-col items-center justify-center p-6 relative">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1A81E6]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-[#17CEA4]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home link */}
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back Home
      </Link>

      <div className="max-w-md w-full p-8 bg-[#111618] border border-gray-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md mt-10 mb-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#17CEA4]/10 border border-[#17CEA4]/30 text-[#17CEA4] mb-3">
            <UserPlus size={22} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">Create Clinic</h1>
          <p className="text-xs text-gray-400 mt-1">Set up a real-time queue workspace</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider font-mono">Clinic Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g. Apex Health Clinic"
              required
              className="w-full px-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider font-mono">Doctor Name</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Smith"
                required
                className="w-full px-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider font-mono">Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Pediatrician"
                required
                className="w-full px-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider font-mono">Clinic Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Medical Way, NY"
              required
              className="w-full px-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider font-mono">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinic.com"
              required
              className="w-full px-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider font-mono">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider font-mono">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1A81E6] hover:bg-[#1A81E6]/95 text-white font-bold py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(26,129,230,0.25)] hover:scale-[1.01] active:scale-95 text-sm mt-2"
          >
            Create Workspace
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-800/60">
          <p className="text-xs text-gray-400">
            Already have a clinic?{' '}
            <Link href="/login" className="font-semibold text-[#17CEA4] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

