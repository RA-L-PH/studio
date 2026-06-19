
import Link from "next/link";
import { Activity, UserRound, LayoutDashboard, ArrowRight, Stethoscope, Code2 } from "lucide-react";

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 gap-6 bg-[#020617] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/15 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="text-center space-y-4 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <span className="text-2xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-headline font-bold text-foreground leading-tight">
          Modern <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-accent">Clinic Flow.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto font-medium">
          A high-performance Full Stack solution for real-time patient management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Link href="/reception" className="group">
          <div className="neu-glass p-6 rounded-[2rem] h-full flex flex-col gap-4 neumorphic-button hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-white/5 flex items-center justify-center text-primary glow-blue">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold mb-2">Reception Desk</h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">High-speed intake and administrative oversight for clinic staff.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-primary font-bold text-base group-hover:gap-4 transition-all">
              Launch Console <ArrowRight size={18} />
            </div>
          </div>
        </Link>

        <Link href="/doctor" className="group">
          <div className="neu-glass p-6 rounded-[2rem] h-full flex flex-col gap-4 neumorphic-button hover:border-accent/40 transition-all border-accent/10">
            <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-white/5 flex items-center justify-center text-accent glow-cyan">
              <Stethoscope size={28} />
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold mb-2">Clinician Hub</h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">Instant patient calling and session management for exam rooms.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-accent font-bold text-base group-hover:gap-4 transition-all">
              Clinician Login <ArrowRight size={18} />
            </div>
          </div>
        </Link>

        <Link href="/patient" className="group">
          <div className="neu-glass p-6 rounded-[2rem] h-full flex flex-col gap-4 neumorphic-button hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-white/5 flex items-center justify-center text-foreground/70">
              <UserRound size={28} />
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold mb-2">Patient Display</h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">Big-screen "Now Serving" monitor for waiting rooms.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-muted-foreground font-bold text-base group-hover:gap-4 transition-all group-hover:text-foreground">
              Open Display <ArrowRight size={18} />
            </div>
          </div>
        </Link>
      </div>

      <div className="relative z-10 animate-in fade-in duration-1000 delay-500">
        <Link href="/about" className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border-white/10 hover:bg-white/5 transition-all group">
          <Code2 size={18} className="text-primary" />
          <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Developer & Architecture Specs</span>
          <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
      
      <footer className="mt-4 text-muted-foreground text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] relative z-10">
        Full Stack Engine • Django • Express.js • MongoDB • RTDB
      </footer>
    </div>
  );
}
