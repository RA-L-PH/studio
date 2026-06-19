
"use client";

import { useMemo } from "react";
import { ref } from "firebase/database";
import { 
  Activity, 
  Clock, 
  Users, 
  BellRing,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConnectionSentry } from "@/components/ConnectionSentry";
import { useRTDB, useRTValue, useRTList } from "@/firebase";

interface Patient {
  id: string;
  name: string;
  token_number: number;
  status: "waiting" | "active" | "completed";
}

interface LiveStatus {
  token: number;
  name: string;
  room: string;
  updated_at: number;
}

export default function PatientPage() {
  const rtdb = useRTDB();

  const liveStatusRef = useMemo(() => ref(rtdb, "live_status"), [rtdb]);
  const { data: liveStatus } = useRTValue<LiveStatus>(liveStatusRef);

  const queueRef = useMemo(() => ref(rtdb, "queues"), [rtdb]);
  const { data: allPatients } = useRTList<Patient>(queueRef);

  const waitingPatients = useMemo(() => 
    allPatients
      .filter(p => p.status === "waiting")
      .sort((a, b) => a.token_number - b.token_number)
  , [allPatients]);

  const statsRef = useMemo(() => ref(rtdb, "metrics"), [rtdb]);
  const { data: stats } = useRTValue<{ avg_consult_duration: number }>(statsRef);

  const avgDur = stats?.avg_consult_duration || 600000;
  const totalWait = Math.round((waitingPatients.length * avgDur) / 60000);

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground select-none overflow-hidden">
      <ConnectionSentry />
      
      <header className="p-4 border-b border-border flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Activity className="text-primary w-6 h-6" />
          <h1 className="text-xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</h1>
        </div>
        <div className="flex gap-4 items-end">
          <div className="text-right hidden sm:block">
            <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-primary mb-0.5">Estimated Wait Time</p>
            <p className="text-2xl font-headline font-bold">~{totalWait}m</p>
          </div>
          <div className="px-3 py-1 border border-border rounded-sm bg-muted/10">
            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Queue Size</p>
            <p className="text-lg font-headline font-bold">{waitingPatients.length}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Main "Now Serving" Area */}
        <section className="lg:col-span-8 flex flex-col items-center justify-center p-8 text-center border-r border-border bg-muted/5">
          <div className="max-w-3xl w-full space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent font-bold uppercase tracking-[0.4em] text-[10px] animate-pulse">
              <BellRing size={12} />
              Currently Serving
            </div>

            {liveStatus ? (
              <div className="space-y-4 animate-in zoom-in-95 duration-1000">
                <span className="text-[14rem] md:text-[18rem] font-headline font-bold leading-none text-accent block tracking-tighter">
                  #{liveStatus.token}
                </span>
                <div className="space-y-2">
                  <h2 className="text-5xl md:text-7xl font-headline font-bold tracking-tight text-foreground">{liveStatus.name}</h2>
                  <div className="inline-block px-12 py-3 border-2 border-accent rounded-sm text-accent bg-white mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Proceed To</p>
                    <p className="text-5xl md:text-6xl font-headline font-bold uppercase tracking-tight">{liveStatus.room}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 space-y-4 opacity-5">
                <Activity size={80} className="mx-auto" />
                <p className="text-3xl font-headline font-bold italic uppercase tracking-widest">System Ready</p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Queue List */}
        <section className="lg:col-span-4 flex flex-col bg-white">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
            <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest">
              Queue Status
            </h3>
            <Badge variant="outline" className="text-[7px] px-2 py-0.5 font-bold text-primary border-primary/40">LIVE UPDATES</Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {waitingPatients.map((p, idx) => (
              <div 
                key={p.id} 
                className={`p-3 border border-border rounded-sm flex items-center justify-between transition-all ${idx === 0 ? 'bg-primary/5 border-primary/30' : 'opacity-60 grayscale-[0.5]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-sm flex items-center justify-center font-headline font-bold text-2xl ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    #{p.token_number}
                  </div>
                  <div>
                    <p className="text-xl font-headline font-bold text-foreground">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                      <Clock size={10} />
                      {idx === 0 ? "Call Next" : `Est. ~${ (idx + 1) * Math.round(avgDur / 60000) }m`}
                    </div>
                  </div>
                </div>
                {idx === 0 && (
                  <ChevronRight size={24} className="text-primary animate-bounce-x" />
                )}
              </div>
            ))}

            {waitingPatients.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-5 py-32">
                <Users size={60} />
                <p className="text-[10px] font-bold uppercase mt-3 tracking-widest">Queue Clear</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="p-3 border-t border-border flex justify-between items-center bg-muted/5 text-[7px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
        <p>Dynamic Predictive Analytics Engine</p>
        <p>System Version 2.0.1</p>
      </footer>

      <style jsx global>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
}
