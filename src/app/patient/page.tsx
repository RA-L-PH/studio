
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
      
      <header className="p-8 lg:p-12 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Activity className="text-primary w-10 h-10" />
          <h1 className="text-4xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</h1>
        </div>
        <div className="flex gap-8 items-end">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-1">Estimated Wait</p>
            <p className="text-5xl font-headline font-bold">~{totalWait} MINS</p>
          </div>
          <div className="px-6 py-2 border border-border rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Waiting</p>
            <p className="text-3xl font-headline font-bold">{waitingPatients.length}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Main "Now Serving" Area */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center p-12 text-center border-r border-border bg-card/10">
          <div className="max-w-4xl w-full space-y-16">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-accent/30 text-accent font-bold uppercase tracking-[0.5em] text-lg animate-pulse">
              <BellRing size={24} />
              Now Serving
            </div>

            {liveStatus ? (
              <div className="space-y-8 animate-in zoom-in-95 duration-1000">
                <span className="text-[18rem] md:text-[24rem] font-headline font-bold leading-none text-accent">
                  #{liveStatus.token}
                </span>
                <div className="space-y-6">
                  <h2 className="text-6xl md:text-8xl font-headline font-bold tracking-tight">{liveStatus.name}</h2>
                  <div className="inline-block px-12 py-6 border-2 border-accent rounded-xl text-accent">
                    <p className="text-xl font-bold uppercase tracking-widest mb-1 opacity-70">Proceed To</p>
                    <p className="text-5xl md:text-7xl font-headline font-bold uppercase">{liveStatus.room}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 space-y-6 opacity-20">
                <Activity size={120} className="mx-auto" />
                <p className="text-4xl font-headline font-bold italic uppercase tracking-widest">Standing By</p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Queue List */}
        <section className="lg:col-span-5 flex flex-col bg-card/20">
          <div className="p-8 border-b border-border flex justify-between items-center">
            <h3 className="text-xl font-headline font-bold flex items-center gap-3 uppercase tracking-widest">
              Upcoming
            </h3>
            <Badge variant="outline" className="px-3 py-1 font-bold text-primary border-primary/40">LIVE</Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            {waitingPatients.map((p, idx) => (
              <div 
                key={p.id} 
                className={`p-6 border border-border rounded-xl flex items-center justify-between transition-all ${idx === 0 ? 'bg-primary/5 border-primary/40' : 'opacity-60'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-headline font-bold text-2xl ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    #{p.token_number}
                  </div>
                  <div>
                    <p className="text-2xl font-headline font-bold">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Clock size={12} />
                      {idx === 0 ? "Next in line" : `Est. ${ (idx + 1) * Math.round(avgDur / 60000) } mins`}
                    </div>
                  </div>
                </div>
                {idx === 0 && (
                  <ChevronRight size={32} className="text-primary animate-bounce-x" />
                )}
              </div>
            ))}

            {waitingPatients.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 py-32">
                <Users size={80} />
                <p className="text-xl font-bold uppercase mt-4 tracking-widest">Queue Empty</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="p-6 border-t border-border flex justify-between items-center bg-card/5 text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
        <p>Live predictive analytics based on clinical throughput</p>
        <p>Pulse Protocol v1.5.0</p>
      </footer>

      <style jsx global>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
}
