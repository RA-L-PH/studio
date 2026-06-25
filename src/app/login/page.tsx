'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError("Invalid email or password.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0D1012] text-gray-100 flex flex-col items-center justify-center p-6 relative">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1A81E6]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-[#17CEA4]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home link */}
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back Home
      </Link>

      <div className="max-w-md w-full p-8 bg-[#111618] border border-gray-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1A81E6]/10 border border-[#1A81E6]/30 text-[#1A81E6] mb-3">
            <Lock size={22} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">Clinic Access</h1>
          <p className="text-xs text-gray-400 mt-1">Sign in to manage your clinic queue</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider font-mono">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider font-mono">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-[#0D1012] border border-gray-800 rounded-xl focus:outline-none focus:border-[#1A81E6] focus:ring-1 focus:ring-[#1A81E6] text-white placeholder-gray-600 transition-all text-sm"
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

          <button
            type="submit"
            className="w-full bg-[#1A81E6] hover:bg-[#1A81E6]/95 text-white font-bold py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(26,129,230,0.25)] hover:scale-[1.01] active:scale-95 text-sm mt-2"
          >
            Log In
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-800/60">
          <p className="text-xs text-gray-400">
            Need a workspace?{' '}
            <Link href="/signup" className="font-semibold text-[#17CEA4] hover:underline">
              Create Clinic
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

