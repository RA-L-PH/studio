
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
      setExplanation("No current wait time. Walk-ins available.");
    } else {
      const avgMins = Math.round(avgDur / 60000);
      setExplanation(`Processing ~${avgMins} mins per patient.`);
    }
  }, [waitingPatients.length, avgDur]);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden select-none" suppressHydrationWarning>
      <ConnectionSentry />
      
      {/* Header - Optimized for large displays */}
      <header className="p-8 md:p-12 border-b border-border/50 bg-card/30 backdrop-blur-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Activity className="text-primary w-12 h-12" />
          <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right hidden md:block">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Estimated Wait</p>
            <p className="text-4xl font-headline font-bold text-primary">~{totalEstimatedWait} MINS</p>
          </div>
          <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20">
            <p className="text-xs uppercase font-bold text-primary mb-1">Queue Size</p>
            <p className="text-3xl font-headline font-bold">{waitingPatients.length}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* NOW SERVING - The Main Attraction */}
        <section className="lg:col-span-7 p-8 md:p-16 flex flex-col justify-center items-center text-center bg-gradient-to-br from-background via-background to-primary/5 border-r border-border/30">
          <div className="space-y-12 w-full max-w-4xl">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-accent/10 text-accent border border-accent/20 animate-pulse mb-8">
              <BellRing size={24} />
              <span className="text-xl font-bold uppercase tracking-[0.4em]">Now Serving</span>
            </div>

            {liveLoading ? (
              <div className="py-20 animate-pulse text-muted-foreground text-3xl">Synchronizing Live Feed...</div>
            ) : liveStatus ? (
              <div className="space-y-10 animate-in fade-in zoom-in duration-700">
                <div className="relative inline-block">
                  <span className="text-[12rem] md:text-[20rem] font-headline font-black leading-none text-accent drop-shadow-[0_0_50px_rgba(23,206,164,0.4)]">
                    #{liveStatus.token}
                  </span>
                </div>
                <div>
                  <h2 className="text-5xl md:text-8xl font-headline font-bold mb-6">{liveStatus.name}</h2>
                  <div className="inline-block px-12 py-6 rounded-[2rem] bg-accent text-accent-foreground shadow-2xl shadow-accent/20">
                    <p className="text-xl uppercase tracking-widest font-bold opacity-80 mb-2">Proceed To</p>
                    <p className="text-4xl md:text-6xl font-headline font-bold uppercase">{liveStatus.room}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 space-y-6 opacity-40">
                <Activity size={120} className="mx-auto text-muted-foreground" />
                <p className="text-3xl md:text-5xl font-headline font-bold italic">Waiting for next patient...</p>
              </div>
            )}
          </div>
        </section>

        {/* FULL QUEUE LIST - High Visibility Ticker */}
        <section className="lg:col-span-5 flex flex-col bg-card/20 overflow-hidden">
          <div className="p-8 border-b border-border/30 bg-card/50 flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-headline font-bold flex items-center gap-3">
                <Users className="text-primary" size={28} />
                Upcoming Queue
              </h3>
              <p className="text-muted-foreground font-medium mt-1">{explanation}</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1 rounded-xl border-primary/30 text-primary">
              LIVE
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            {waitingPatients.map((p, idx) => (
              <div 
                key={p.id} 
                className={`neumorphic p-6 md:p-8 rounded-[2rem] flex items-center justify-between transition-all duration-500 border-l-8 ${idx === 0 ? 'border-primary scale-105 shadow-2xl' : 'border-transparent opacity-80'}`}
              >
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-headline font-bold text-2xl ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    #{p.token_number}
                  </div>
                  <div>
                    <p className="text-2xl md:text-4xl font-headline font-bold">{p.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        {idx === 0 ? "Next in line" : "Estimated " + (idx + 1) * Math.round(avgDur / 60000) + " mins"}
                      </p>
                    </div>
                  </div>
                </div>
                {idx === 0 ? (
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                    <span className="font-bold">UP NEXT</span>
                    <ChevronRight size={20} />
                  </div>
                ) : (
                  <span className="text-muted-foreground font-bold opacity-30">#{idx + 1}</span>
                )}
              </div>
            ))}

            {waitingPatients.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 text-center">
                <Users size={80} />
                <p className="text-2xl font-headline font-bold italic uppercase tracking-widest">Queue Clear</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="p-6 bg-card/50 border-t border-border/30 flex justify-between items-center">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Info size={18} />
          <p className="text-sm font-medium">Estimated wait times are based on real-time clinic movement.</p>
        </div>
        <p className="text-xs font-bold text-primary/50 tracking-widest">SYSTEM VERSION 1.2.0 • SYNCING AT 60FPS</p>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--secondary));
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
