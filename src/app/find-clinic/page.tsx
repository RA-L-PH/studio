
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function FindClinic() {
  const [clinicCode, setClinicCode] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicCode) {
      router.push(`/clinic/${clinicCode}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Find Your Clinic</h1>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={clinicCode}
              onChange={(e) => setClinicCode(e.target.value)}
              placeholder="Enter Clinic Code"
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            type="submit"
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
