
import Link from "next/link";
import { Activity, ArrowRight, Code2, Search } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <AnimatedBackground />
      <div className="text-center space-y-4 max-w-2xl animate-in fade-in duration-700 z-10">
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

      <div className="mt-10 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 z-10">
        <Link href="/login" className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
            Get Started <ArrowRight size={16} />
        </Link>
        <Link href="/find-clinic" className="bg-secondary text-secondary-foreground font-bold py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors inline-flex items-center gap-2">
            View Clinic Queues <Search size={16} />
        </Link>
      </div>
      
      <footer className="absolute bottom-6 text-muted-foreground text-[8px] font-bold opacity-40 uppercase tracking-[0.4em] z-10">
        Django • Express • MongoDB • RTDB Full Stack Engine
      </footer>
    </div>
  );
}
