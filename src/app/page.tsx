
import Link from "next/link";
import { Activity, UserRound, LayoutDashboard, ArrowRight, Stethoscope, Code2 } from "lucide-react";

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="text-center space-y-6 max-w-2xl animate-in fade-in duration-700">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Activity className="text-primary w-6 h-6" />
          <span className="text-xl font-headline font-bold tracking-tight uppercase">PulseQueue</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-bold text-foreground leading-tight">
          Streamlined <br/><span className="text-primary">Clinic Workflow.</span>
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          A high-performance real-time patient management system built for clarity and speed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Link href="/reception" className="group">
          <div className="minimal-card p-8 h-full flex flex-col gap-6 hover:bg-muted/30">
            <LayoutDashboard className="text-primary" size={32} />
            <div>
              <h3 className="text-xl font-headline font-bold mb-2">Reception</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Efficient patient check-in and queue oversight.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-primary font-bold text-sm">
              Enter Console <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        <Link href="/doctor" className="group">
          <div className="minimal-card p-8 h-full flex flex-col gap-6 hover:bg-muted/30">
            <Stethoscope className="text-accent" size={32} />
            <div>
              <h3 className="text-xl font-headline font-bold mb-2">Clinician</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Session management and instant patient calling.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-accent font-bold text-sm">
              Open Hub <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        <Link href="/patient" className="group">
          <div className="minimal-card p-8 h-full flex flex-col gap-6 hover:bg-muted/30">
            <UserRound className="text-foreground/70" size={32} />
            <div>
              <h3 className="text-xl font-headline font-bold mb-2">Display</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">High-visibility monitor for patient waiting areas.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-muted-foreground font-bold text-sm group-hover:text-foreground">
              View Monitor <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-12 animate-in fade-in duration-1000 delay-500">
        <Link href="/about" className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-border hover:bg-muted transition-colors group">
          <Code2 size={16} className="text-primary" />
          <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Architecture Specs</span>
        </Link>
      </div>
      
      <footer className="absolute bottom-6 text-muted-foreground text-[10px] font-bold opacity-30 uppercase tracking-widest">
        Full Stack Engine • Django • Express • MongoDB • Firebase
      </footer>
    </div>
  );
}
