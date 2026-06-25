
import Link from 'next/link';
import { ArrowRight, Search, Activity, Zap, Clock, RotateCcw, ShieldAlert, Monitor, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-y-auto bg-[#0D1012] text-gray-100 font-sans selection:bg-[#17CEA4]/30 selection:text-[#17CEA4]">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-[#1A81E6]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-[#17CEA4]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-800/40 bg-[#0D1012]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#1A81E6]/10 border border-[#1A81E6]/30">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-[#17CEA4] animate-ping" />
              <span className="relative w-2 h-2 rounded-full bg-[#17CEA4]" />
            </div>
            <span className="font-mono text-xl font-bold tracking-wider text-white">
              PULSE<span className="text-[#17CEA4]">QUEUE</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Live Preview</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/find-clinic"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white border border-gray-800 hover:border-gray-700 bg-gray-900/40 rounded-lg transition-all"
            >
              <Search size={14} className="text-[#17CEA4]" /> Find Clinic
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1A81E6] hover:bg-[#1A81E6]/90 rounded-lg shadow-[0_4px_20px_rgba(26,129,230,0.3)] transition-all"
            >
              Clinic Login <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center">

        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight max-w-4xl leading-tight font-mono">
          Real-Time Clinic Flow. <br />
          <span className="bg-gradient-to-r from-[#1A81E6] via-cyan-400 to-[#17CEA4] bg-clip-text text-transparent">
            Zero Waiting Friction.
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed">
          A minimalist patient management engine delivering sub-second sync, atomic intake, and automated wait-time estimation for modern healthcare environments.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-white bg-gradient-to-r from-[#1A81E6] to-[#17CEA4]/80 rounded-xl shadow-[0_8px_30px_rgba(26,129,230,0.25)] hover:shadow-[0_8px_30px_rgba(23,206,164,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            Launch Clinic Portal <ArrowRight size={18} />
          </Link>
          <Link
            href="/find-clinic"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 font-semibold text-gray-300 bg-gray-900/50 hover:bg-gray-900 border border-gray-800 rounded-xl transition-all text-sm"
          >
            Find Your Clinic Queue <Search size={18} className="text-[#1A81E6]" />
          </Link>
        </div>

        {/* Live Interface Preview Mockup */}
        <div id="preview" className="mt-16 w-full max-w-4xl relative rounded-2xl border border-gray-800 bg-[#0d1012]/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          {/* Top Bar Window Decorations */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="text-xs text-gray-500 font-mono">live-dashboard.pulsequeue.local</div>
            <div className="w-12 h-2" />
          </div>

          {/* Grid Layout Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Stats Neumorphic Card */}
            <div className="bg-[#111618] border border-gray-800/80 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between mb-3 text-xs text-gray-500 font-mono">
                <span>CLINIC STATS</span>
                <Activity size={14} className="text-[#17CEA4]" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">12 Mins</div>
              <p className="text-xs text-gray-400 mt-1">Avg. Patient Wait Time</p>
              
              <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center text-xs text-gray-400">
                <span>Active Doctors: 4</span>
                <span className="text-[#17CEA4] font-semibold">98.2% Load</span>
              </div>
            </div>

            {/* Serving Now Neumorphic Card */}
            <div className="bg-[#111618] border border-[#1A81E6]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(26,129,230,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#1A81E6]/10 rounded-full blur-xl -mr-8 -mt-8" />
              <div className="flex items-center justify-between mb-3 text-xs text-[#1A81E6] font-mono font-bold">
                <span>NOW SERVING</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2 font-mono">
                Token <span className="text-[#17CEA4]">#042</span>
              </div>
              <p className="text-xs text-gray-300 mt-1">Sarah Jenkins (Room 4)</p>
              
              <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center text-xs text-gray-400">
                <span>Called 2 mins ago</span>
                <span className="text-[#1A81E6] font-semibold">Dr. A. Carter</span>
              </div>
            </div>

            {/* Waiting Queue Neumorphic Card */}
            <div className="bg-[#111618] border border-gray-800/80 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between mb-3 text-xs text-gray-500 font-mono">
                <span>UPCOMING QUEUE</span>
                <Clock size={14} className="text-gray-400" />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50">
                  <span className="font-mono text-white">#043 - Robert C.</span>
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400">Waiting</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50">
                  <span className="font-mono text-white">#044 - Marcus K.</span>
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400">Waiting</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="font-mono text-white">#045 - Elena R.</span>
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400">Waiting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-800/40 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-mono">
            Architected for Operational Integrity
          </h2>
          <p className="mt-4 text-gray-400 text-sm md:text-base">
            Engineered to handle high patient volumes with zero latency and robust failure protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-[#111618] border border-gray-800 hover:border-[#1A81E6]/50 p-6 rounded-xl transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#1A81E6]/10 border border-[#1A81E6]/30 flex items-center justify-center text-[#1A81E6] mb-4 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sub-Second Sync</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Powered by Firebase Realtime Database for instantaneous state synchronization across doctor desks, reception hubs, and lobby displays.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#111618] border border-gray-800 hover:border-[#17CEA4]/50 p-6 rounded-xl transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#17CEA4]/10 border border-[#17CEA4]/30 flex items-center justify-center text-[#17CEA4] mb-4 group-hover:scale-110 transition-transform">
              <Monitor size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">One-Tap Rapid Intake</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              No complex forms. An optimized UI dashboard lets receptionists check-in and queue new patients in a single tap, reducing lobby buildup.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#111618] border border-gray-800 hover:border-red-500/50 p-6 rounded-xl transition-all group">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform">
              <RotateCcw size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">30-Second Safety Undo</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Accidents happen. Receptionists can rollback wrong token triggers instantly within a 30-second window, preserving database sequence.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-800/40 text-center">
        <div className="text-xs text-gray-500 font-mono tracking-wider mb-6">BUILT WITH ENTERPRISE-GRADE TECH</div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-semibold text-gray-400">
          <div className="flex items-center gap-2 border border-gray-800 px-4 py-2 rounded-lg bg-gray-900/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A81E6]" /> Next.js 15
          </div>
          <div className="flex items-center gap-2 border border-gray-800 px-4 py-2 rounded-lg bg-gray-900/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#17CEA4]" /> React 19
          </div>
          <div className="flex items-center gap-2 border border-gray-800 px-4 py-2 rounded-lg bg-gray-900/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Firebase RTDB
          </div>
          <div className="flex items-center gap-2 border border-gray-800 px-4 py-2 rounded-lg bg-gray-900/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Tailwind CSS
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-[#07090a] py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} PulseQueue. Developed with a focus on Backend Excellence.</div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-gray-300">Features</a>
            <a href="#preview" className="hover:text-gray-300">Preview</a>
            <Link href="/login" className="hover:text-gray-300">Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

