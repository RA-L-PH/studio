'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initialTheme = savedTheme || (systemPrefersLight ? 'light' : 'dark');
    
    setTheme(initialTheme);
    if (initialTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-xl flex items-center justify-center bg-[#111618]/80 hover:bg-[#111618] border border-gray-800 hover:border-gray-700 text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {theme === 'dark' ? (
          <Sun size={20} className="text-yellow-400 animate-spin-slow transition-transform duration-500 group-hover:rotate-45" />
        ) : (
          <Moon size={20} className="text-[#1A81E6] transition-transform duration-500 group-hover:-rotate-12" />
        )}
      </div>
    </button>
  );
}
