
import Link from "next/link";
import { Activity, UserRound, LayoutDashboard, ArrowRight, Stethoscope, Code2 } from "lucide-react";

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="text-center space-y-4 max-w-2xl animate-in fade-in duration-700">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="text-primary w-5 h-5" />
          <span className="text-sm font-headline font-bold tracking-[0.2em] uppercase">PulseQueue</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground leading-tight tracking-tight">
          Intelligent <br/><span className="text-primary">Clinic Flow.</span>
        </h1>
        <p className="text-muted-foreground text-base font-medium">
          A minimalist patient management engine built for real-time clarity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-5xl mt-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Link href="/reception" className="group">
          <div className="minimal-card p-6 h-full flex flex-col gap-4 hover:bg-muted/30">
            <LayoutDashboard className="text-primary" size={24} />
            <div>
              <h3 className="text-lg font-headline font-bold mb-1">Reception</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">Fast intake and real-time oversight.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
              Enter Console <ArrowRight size={12} />
            </div>
          </div>
        </Link>

        <Link href="/doctor" className="group">
          <div className="minimal-card p-6 h-full flex flex-col gap-4 hover:bg-muted/30">
            <Stethoscope className="text-accent" size={24} />
            <div>
              <h3 className="text-lg font-headline font-bold mb-1">Clinician</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">Manage sessions and call patients.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-widest">
              Open Hub <ArrowRight size={12} />
            </div>
          </div>
        </Link>

        <Link href="/patient" className="group">
          <div className="minimal-card p-6 h-full flex flex-col gap-4 hover:bg-muted/30">
            <UserRound className="text-foreground/70" size={24} />
            <div>
              <h3 className="text-lg font-headline font-bold mb-1">Display</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">High-visibility waiting area monitor.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest group-hover:text-foreground">
              Launch Monitor <ArrowRight size={12} />
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-10 animate-in fade-in duration-1000 delay-500">
        <Link href="/about" className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-border hover:bg-muted transition-colors group">
          <Code2 size={12} className="text-primary" />
          <span className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Architecture Specs</span>
        </Link>
      </div>
      
      <footer className="absolute bottom-6 text-muted-foreground text-[8px] font-bold opacity-40 uppercase tracking-[0.4em]">
        Django • Express • MongoDB • RTDB Full Stack Engine
      </footer>
    </div>
  );
}
