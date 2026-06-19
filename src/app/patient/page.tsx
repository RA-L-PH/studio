
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
    <div className="min-h-screen bg-background flex flex-col text-foreground select-none overflow-hidden text-sm">
      <ConnectionSentry />
      
      <header className="p-6 lg:p-8 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="text-primary w-8 h-8" />
          <h1 className="text-2xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</h1>
        </div>
        <div className="flex gap-6 items-end">
          <div className="text-right hidden sm:block">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary mb-0.5">Estimated Wait</p>
            <p className="text-3xl font-headline font-bold">~{totalWait}m</p>
          </div>
          <div className="px-4 py-1.5 border border-border rounded-lg">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Queue</p>
            <p className="text-xl font-headline font-bold">{waitingPatients.length}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Main "Now Serving" Area - Scaled Down */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center p-8 text-center border-r border-border bg-card/5">
          <div className="max-w-2xl w-full space-y-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-accent/20 text-accent font-bold uppercase tracking-[0.4em] text-sm animate-pulse">
              <BellRing size={16} />
              Serving
            </div>

            {liveStatus ? (
              <div className="space-y-6 animate-in zoom-in-95 duration-1000">
                <span className="text-[12rem] md:text-[16rem] font-headline font-bold leading-none text-accent block">
                  #{liveStatus.token}
                </span>
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-6xl font-headline font-bold tracking-tight">{liveStatus.name}</h2>
                  <div className="inline-block px-10 py-4 border-2 border-accent rounded-lg text-accent">
                    <p className="text-sm font-bold uppercase tracking-widest mb-0.5 opacity-70">Proceed To</p>
                    <p className="text-4xl md:text-5xl font-headline font-bold uppercase">{liveStatus.room}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 space-y-4 opacity-10">
                <Activity size={80} className="mx-auto" />
                <p className="text-3xl font-headline font-bold italic uppercase tracking-widest">Standing By</p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Queue List - Compact */}
        <section className="lg:col-span-5 flex flex-col bg-card/10">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest">
              Upcoming
            </h3>
            <Badge variant="outline" className="text-[8px] px-2 py-0.5 font-bold text-primary border-primary/40">LIVE</Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {waitingPatients.map((p, idx) => (
              <div 
                key={p.id} 
                className={`p-4 border border-border rounded-lg flex items-center justify-between transition-all ${idx === 0 ? 'bg-primary/5 border-primary/30' : 'opacity-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center font-headline font-bold text-xl ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    #{p.token_number}
                  </div>
                  <div>
                    <p className="text-lg font-headline font-bold">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Clock size={10} />
                      {idx === 0 ? "Next" : `~${ (idx + 1) * Math.round(avgDur / 60000) }m`}
                    </div>
                  </div>
                </div>
                {idx === 0 && (
                  <ChevronRight size={24} className="text-primary animate-bounce-x" />
                )}
              </div>
            ))}

            {waitingPatients.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 py-24">
                <Users size={60} />
                <p className="text-sm font-bold uppercase mt-3 tracking-widest">Empty</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="p-4 border-t border-border flex justify-between items-center bg-card/5 text-[8px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
        <p>Live predictive analytics</p>
        <p>v1.6.0</p>
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
