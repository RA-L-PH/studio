
import Link from "next/link";
import { Activity, UserRound, LayoutDashboard, ArrowRight, Stethoscope } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-12 bg-[#020617] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/15 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="text-center space-y-6 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
            <Activity className="text-primary w-8 h-8" />
          </div>
          <span className="text-3xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-headline font-bold text-foreground leading-[1.1]">
          Modern <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-accent">Clinic Flow.</span>
        </h1>
        <p className="text-muted-foreground text-xl max-w-lg mx-auto font-medium">
          The ultimate fusion of real-time synchronization and predictive healthcare management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Link href="/reception" className="group">
          <div className="neu-glass p-8 rounded-[2.5rem] h-full flex flex-col gap-6 neumorphic-button hover:border-primary/40 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-white/5 flex items-center justify-center text-primary glow-blue">
              <LayoutDashboard size={36} />
            </div>
            <div>
              <h3 className="text-2xl font-headline font-bold mb-3">Reception Desk</h3>
              <p className="text-muted-foreground text-base leading-relaxed">High-speed intake and administrative oversight for clinic staff.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-primary font-bold text-lg group-hover:gap-4 transition-all">
              Launch Console <ArrowRight size={20} />
            </div>
          </div>
        </Link>

        <Link href="/doctor" className="group">
          <div className="neu-glass p-8 rounded-[2.5rem] h-full flex flex-col gap-6 neumorphic-button hover:border-accent/40 transition-all border-accent/10">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-white/5 flex items-center justify-center text-accent glow-cyan">
              <Stethoscope size={36} />
            </div>
            <div>
              <h3 className="text-2xl font-headline font-bold mb-3">Clinician Hub</h3>
              <p className="text-muted-foreground text-base leading-relaxed">Instant patient calling and session management for exam rooms.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-accent font-bold text-lg group-hover:gap-4 transition-all">
              Clinician Login <ArrowRight size={20} />
            </div>
          </div>
        </Link>

        <Link href="/patient" className="group">
          <div className="neu-glass p-8 rounded-[2.5rem] h-full flex flex-col gap-6 neumorphic-button hover:border-white/20 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-white/5 flex items-center justify-center text-foreground/70">
              <UserRound size={36} />
            </div>
            <div>
              <h3 className="text-2xl font-headline font-bold mb-3">Patient Display</h3>
              <p className="text-muted-foreground text-base leading-relaxed">Big-screen "Now Serving" monitor for waiting rooms and mobiles.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-muted-foreground font-bold text-lg group-hover:gap-4 transition-all group-hover:text-foreground">
              Open Display <ArrowRight size={20} />
            </div>
          </div>
        </Link>
      </div>
      
      <footer className="mt-12 text-muted-foreground text-sm font-bold opacity-40 uppercase tracking-[0.2em] relative z-10">
        System Protocol v1.5.0 • &copy; 2025
      </footer>
    </div>
  );
}
