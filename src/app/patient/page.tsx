
"use client";

import { useMemo, useState, useEffect } from "react";
import { ref } from "firebase/database";
import { 
  Activity, 
  Clock, 
  Users, 
  BellRing, 
  Info,
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
  const [explanation, setExplanation] = useState<string | null>(null);

  // RTDB for ultra-low latency "Now Serving"
  const liveStatusRef = useMemo(() => ref(rtdb, "live_status"), [rtdb]);
  const { data: liveStatus, loading: liveLoading } = useRTValue<LiveStatus>(liveStatusRef);

  // RTDB for full queue
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
  const totalEstimatedWait = Math.round((waitingPatients.length * avgDur) / 60000);

  useEffect(() => {
    if (waitingPatients.length === 0) {
      setExplanation("Queue clear. Open for check-in.");
    } else {
      const avgMins = Math.round(avgDur / 60000);
      setExplanation(`Avg workflow: ${avgMins} mins / patient.`);
    }
  }, [waitingPatients.length, avgDur]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col overflow-hidden select-none" suppressHydrationWarning>
      <ConnectionSentry />
      
      {/* Header - High Visibility Glass */}
      <header className="p-10 md:p-16 glass border-b border-white/5 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[1.5rem] bg-primary/20 border border-primary/30 glow-blue animate-pulse">
            <Activity className="text-primary w-14 h-14" />
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">PulseQueue</h1>
        </div>
        <div className="flex items-center gap-12">
          <div className="text-right hidden lg:block">
            <p className="text-sm uppercase tracking-[0.4em] text-primary font-black mb-2">Estimated Wait</p>
            <p className="text-6xl font-headline font-bold text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">~{totalEstimatedWait} MINS</p>
          </div>
          <div className="glass-card px-10 py-6 rounded-[2rem] border-primary/20">
            <p className="text-xs uppercase font-black text-primary tracking-[0.2em] mb-2">Pending Patients</p>
            <p className="text-5xl font-headline font-bold">{waitingPatients.length}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10">
        {/* NOW SERVING - Visual Centerpiece */}
        <section className="lg:col-span-7 p-12 md:p-24 flex flex-col justify-center items-center text-center bg-gradient-to-br from-background via-background/80 to-primary/10 border-r border-white/5">
          <div className="space-y-16 w-full max-w-5xl">
            <div className="inline-flex items-center gap-4 px-10 py-4 rounded-full glass border-accent/30 text-accent animate-pulse mb-12 shadow-[0_0_30px_rgba(20,184,164,0.2)]">
              <BellRing size={32} />
              <span className="text-2xl font-black uppercase tracking-[0.6em]">Now Serving</span>
            </div>

            {liveLoading ? (
              <div className="py-32 animate-pulse text-muted-foreground text-4xl font-headline">Awaiting Real-Time Broadcast...</div>
            ) : liveStatus ? (
              <div className="space-y-12 animate-in fade-in zoom-in duration-1000">
                <div className="relative inline-block">
                  <span className="text-[16rem] md:text-[24rem] font-headline font-black leading-none text-accent drop-shadow-[0_0_80px_rgba(20,184,164,0.6)]">
                    #{liveStatus.token}
                  </span>
                </div>
                <div className="space-y-10">
                  <h2 className="text-7xl md:text-[10rem] font-headline font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{liveStatus.name}</h2>
                  <div className="inline-block px-16 py-8 rounded-[3rem] bg-accent text-accent-foreground shadow-[0_20px_60px_rgba(20,184,164,0.4)] border border-white/20">
                    <p className="text-2xl uppercase tracking-[0.4em] font-black opacity-80 mb-4">Proceed To</p>
                    <p className="text-5xl md:text-8xl font-headline font-bold uppercase tracking-tight">{liveStatus.room}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-32 space-y-10 opacity-30 animate-in fade-in duration-1000">
                <Activity size={160} className="mx-auto text-muted-foreground" />
                <p className="text-4xl md:text-6xl font-headline font-bold italic tracking-wider">Standing by for next update...</p>
              </div>
            )}
          </div>
        </section>

        {/* FULL QUEUE LIST - High Visibility Side Ticker */}
        <section className="lg:col-span-5 flex flex-col bg-card/30 backdrop-blur-md overflow-hidden">
          <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-end">
            <div>
              <h3 className="text-3xl font-headline font-bold flex items-center gap-4 text-primary">
                <Users size={36} />
                Upcoming Stream
              </h3>
              <p className="text-muted-foreground font-bold uppercase tracking-widest mt-2 italic">{explanation}</p>
            </div>
            <Badge variant="outline" className="text-xl px-6 py-2 rounded-2xl border-primary/40 text-primary font-black glass">
              LIVE
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
            {waitingPatients.map((p, idx) => (
              <div 
                key={p.id} 
                className={`glass-card p-8 md:p-10 rounded-[3rem] flex items-center justify-between transition-all duration-700 border-l-[12px] ${idx === 0 ? 'border-primary scale-[1.03] shadow-[0_30px_70px_rgba(59,130,246,0.3)] bg-primary/5' : 'border-transparent opacity-60'}`}
              >
                <div className="flex items-center gap-10">
                  <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-headline font-bold text-3xl shadow-xl transition-colors ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-white/5'}`}>
                    #{p.token_number}
                  </div>
                  <div>
                    <p className="text-3xl md:text-5xl font-headline font-bold tracking-tight">{p.name}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <Clock size={20} className="text-primary/60" />
                      <p className="text-lg font-black text-muted-foreground uppercase tracking-[0.2em]">
                        {idx === 0 ? "Next priority" : "Est. " + (idx + 1) * Math.round(avgDur / 60000) + " mins"}
                      </p>
                    </div>
                  </div>
                </div>
                {idx === 0 ? (
                  <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse border border-primary/20">
                    <span className="font-black text-xl tracking-widest">NEXT</span>
                    <ChevronRight size={28} />
                  </div>
                ) : (
                  <span className="text-muted-foreground font-black text-2xl opacity-20 tracking-tighter">#{idx + 1}</span>
                )}
              </div>
            ))}

            {waitingPatients.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-10 text-center py-40">
                <Users size={120} />
                <p className="text-3xl font-headline font-bold italic uppercase tracking-[0.6em]">Registry Clear</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="p-8 glass border-t border-white/5 flex justify-between items-center z-20">
        <div className="flex items-center gap-6 text-muted-foreground">
          <div className="p-2 rounded-lg bg-white/5">
            <Info size={24} />
          </div>
          <p className="text-lg font-bold uppercase tracking-widest">Predictive data is updated live based on clinical throughput.</p>
        </div>
        <p className="text-sm font-black text-primary/40 tracking-[0.5em] uppercase">Pulse Protocol v1.5.0 • Syncing @ 120Hz</p>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
