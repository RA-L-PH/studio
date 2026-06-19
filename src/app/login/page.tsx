'use client';

import { useState } from 'react';
import { useAuth } from '../../firebase/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-6">Clinic Login</h1>
        {error && <p className="text-red-500 text-center mb-4 font-medium">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="relative">
             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md"
          >
            Log In
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account? {' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
