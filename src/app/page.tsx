
import Link from "next/link";
import { Activity, UserRound, LayoutDashboard, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-12 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="text-center space-y-4 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="text-primary w-8 h-8" />
          <span className="text-2xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-headline font-bold text-foreground">
          The Future of <br/><span className="text-primary">Clinic Flow.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Predictive wait times, atomic transitions, and real-time patient alerts for high-volume healthcare.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        <Link href="/reception" className="group">
          <div className="neumorphic p-8 rounded-[2rem] h-full flex flex-col gap-6 neumorphic-button hover:border-primary/20 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary glow-blue">
              <LayoutDashboard size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-headline font-bold mb-2">Reception Portal</h3>
              <p className="text-muted-foreground">Manage incoming patients, call next, and resolve no-shows with rapid intake.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
              Launch Portal <ArrowRight size={18} />
            </div>
          </div>
        </Link>

        <Link href="/patient" className="group">
          <div className="neumorphic p-8 rounded-[2rem] h-full flex flex-col gap-6 neumorphic-button hover:border-accent/20 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-accent glow-cyan">
              <UserRound size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-headline font-bold mb-2">Patient Monitor</h3>
              <p className="text-muted-foreground">Live real-time updates for patients on their mobile devices or clinic screens.</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all">
              Open Monitor <ArrowRight size={18} />
            </div>
          </div>
        </Link>
      </div>
      
      <footer className="mt-12 text-muted-foreground text-sm opacity-50">
        PulseQueue v1.0.0 &copy; 2025 Professional Clinic Solutions
      </footer>
    </div>
  );
}
