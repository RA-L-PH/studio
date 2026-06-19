
"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc 
} from "firebase/firestore";
import { ref } from "firebase/database";
import { 
  Activity, 
  Clock, 
  Users, 
  BellRing, 
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConnectionSentry } from "@/components/ConnectionSentry";
import { useFirestore, useRTDB, useCollection, useDoc, useRTValue } from "@/firebase";
import { explainWaitTimeFactors } from "@/ai/flows/explain-wait-time-factors";

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
  const db = useFirestore();
  const rtdb = useRTDB();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);

  // RTDB for ultra-low latency "Now Serving"
  const liveStatusRef = useMemo(() => ref(rtdb, "live_status"), [rtdb]);
  const { data: liveStatus, loading: liveLoading } = useRTValue<LiveStatus>(liveStatusRef);

  // Firestore for the full queue list and stats
  const waitingQuery = useMemo(() => query(
    collection(db, "queues"), 
    where("status", "==", "waiting")
  ), [db]);
  const { data: waitingData } = useCollection(waitingQuery);
  const waitingCount = waitingData.length;

  const nextQuery = useMemo(() => query(
    collection(db, "queues"), 
    where("status", "==", "waiting"), 
    orderBy("token_number", "asc"), 
    limit(3)
  ), [db]);
  const { data: upNext } = useCollection<Patient>(nextQuery);

  const statsRef = useMemo(() => doc(db, "metrics", "clinic_stats"), [db]);
  const { data: stats } = useDoc<{ avg_consult_duration: number }>(statsRef);

  const avgDur = stats?.avg_consult_duration || 600000;
  const totalEstimatedWait = Math.round((waitingCount * avgDur) / 60000);

  useEffect(() => {
    async function getExplanation() {
      if (waitingCount === 0) {
        setExplanation("No current wait time. Walk-ins available.");
        return;
      }
      setLoadingExpl(true);
      try {
        const result = await explainWaitTimeFactors({
          numPatientsInQueue: waitingCount,
          averageConsultationDurationMs: avgDur
        });
        setExplanation(result.explanation);
      } catch (e) {
        setExplanation("Analyzing clinic flow factors...");
      } finally {
        setLoadingExpl(false);
      }
    }
    const timer = setTimeout(getExplanation, 500);
    return () => clearTimeout(timer);
  }, [waitingCount, avgDur]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ConnectionSentry />
      
      <header className="p-6 border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-primary w-6 h-6" />
            <span className="text-xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</span>
          </div>
          <Badge className="bg-primary/10 text-primary border-none font-bold">LIVE TICKER</Badge>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-xl mx-auto w-full">
        {/* High Performance "Now Serving" Section */}
        <section className="neumorphic p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-4 animate-pulse">
            <BellRing size={24} className="text-accent" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-6">Currently Serving</p>
          
          {liveLoading ? (
            <div className="py-8 animate-pulse text-muted-foreground">Syncing live ticker...</div>
          ) : liveStatus ? (
            <div className="space-y-4">
              <h2 className="text-6xl font-headline font-bold text-accent drop-shadow-[0_0_10px_rgba(23,206,164,0.3)]">
                #{liveStatus.token}
              </h2>
              <p className="text-2xl font-headline font-bold">{liveStatus.name}</p>
              <div className="pt-4">
                <Badge className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-xs font-bold animate-bounce uppercase">
                  PROCEED TO {liveStatus.room}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="py-8 text-muted-foreground italic">
              Clinician is preparing for the next patient...
            </div>
          )}
        </section>

        <section className="neumorphic p-6 rounded-[2rem] space-y-4 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-headline font-bold">
              <Clock size={18} /> ESTIMATED WAIT
            </div>
            <div className="text-2xl font-headline font-bold">
              ~{totalEstimatedWait} <span className="text-sm text-muted-foreground font-normal">MINS</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 text-sm leading-relaxed text-muted-foreground relative">
            {loadingExpl ? <span className="animate-pulse">Analyzing flow...</span> : <p>{explanation}</p>}
            <Info size={14} className="absolute bottom-2 right-2 opacity-20" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline font-bold text-lg flex items-center gap-2">
              <Users size={18} className="text-muted-foreground" /> Up Next
            </h3>
            <span className="text-xs font-bold text-muted-foreground">{waitingCount} Waiting</span>
          </div>
          <div className="space-y-3">
            {upNext.map((p, idx) => (
              <div key={p.id} className="neumorphic p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-muted-foreground">
                    #{p.token_number}
                  </div>
                  <div>
                    <p className="font-headline font-bold">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      {idx === 0 ? "STAY NEARBY" : "EST. " + (idx + 1) * Math.round(avgDur / 60000) + " MINS"}
                    </p>
                  </div>
                </div>
                {idx === 0 && <Badge className="bg-primary/20 text-primary border-none rounded-lg">NEXT</Badge>}
              </div>
            ))}
            {waitingCount > 3 && (
              <div className="text-center py-4 text-xs text-muted-foreground font-bold bg-secondary/20 rounded-2xl border border-dashed">
                + {waitingCount - 3} MORE PATIENTS IN QUEUE
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
