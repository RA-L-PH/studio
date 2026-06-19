
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          PulseQueue
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A minimalist patient management engine for real-time clarity and a seamless clinic experience.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            Clinic Login <ArrowRight size={18} />
          </Link>
          <Link
            href="/find-clinic"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Find Clinic <Search size={18} />
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-0 py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Streamlining patient flow, one appointment at a time.</p>
      </footer>
    </main>
  );
}
