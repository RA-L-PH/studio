
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc 
} from "firebase/firestore";
import { 
  Activity, 
  Clock, 
  Users, 
  BellRing, 
  Zap,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { explainWaitTimeFactors } from "@/ai/flows/explain-wait-time-factors";
import { ConnectionSentry } from "@/components/ConnectionSentry";

interface Patient {
  id: string;
  name: string;
  token_number: number;
  status: "waiting" | "active" | "completed";
}

export default function PatientPage() {
  const [waitingCount, setWaitingCount] = useState(0);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [upNext, setUpNext] = useState<Patient[]>([]);
  const [stats, setStats] = useState({ avg_consult_duration: 600000 });
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    // Waiting count
    const qCount = query(collection(db, "queues"), where("status", "==", "waiting"));
    const unsubCount = onSnapshot(qCount, (snap) => setWaitingCount(snap.size));

    // Active patient
    const qActive = query(collection(db, "queues"), where("status", "==", "active"), limit(1));
    const unsubActive = onSnapshot(qActive, (snap) => {
      if (!snap.empty) {
        setActivePatient({ id: snap.docs[0].id, ...snap.docs[0].data() } as Patient);
      } else {
        setActivePatient(null);
      }
    });

    // Up next list (top 3)
    const qNext = query(collection(db, "queues"), where("status", "==", "waiting"), orderBy("token_number", "asc"), limit(3));
    const unsubNext = onSnapshot(qNext, (snap) => {
      setUpNext(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    });

    // Metrics
    const unsubMetrics = onSnapshot(doc(db, "metrics", "clinic_stats"), (snap) => {
      if (snap.exists()) setStats(snap.data() as any);
    });

    return () => {
      unsubCount();
      unsubActive();
      unsubNext();
      unsubMetrics();
    };
  }, []);

  // AI Prediction Trigger
  useEffect(() => {
    async function getPrediction() {
      if (waitingCount === 0) {
        setAiExplanation("No current wait time. Walk-ins available.");
        return;
      }
      setLoadingAi(true);
      try {
        const result = await explainWaitTimeFactors({
          numPatientsInQueue: waitingCount,
          averageConsultationDurationMs: stats.avg_consult_duration
        });
        setAiExplanation(result.explanation);
      } catch (e) {
        setAiExplanation("Unable to calculate dynamic wait time.");
      } finally {
        setLoadingAi(false);
      }
    }
    const timer = setTimeout(getPrediction, 1000);
    return () => clearTimeout(timer);
  }, [waitingCount, stats.avg_consult_duration]);

  const totalEstimatedWait = Math.round((waitingCount * stats.avg_consult_duration) / 60000);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ConnectionSentry />
      
      {/* Header */}
      <header className="p-6 border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-primary w-6 h-6" />
            <span className="text-xl font-headline font-bold tracking-tighter uppercase italic">PulseQueue</span>
          </div>
          <Badge className="bg-primary/10 text-primary border-none font-bold">LIVE</Badge>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-xl mx-auto w-full">
        
        {/* Active Patient Hero Card */}
        <section className="neumorphic p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-4 animate-pulse">
            <BellRing size={24} className="text-accent" />
          </div>
          
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-6">Currently Serving</p>
          
          {activePatient ? (
            <div className="space-y-4">
              <h2 className="text-6xl font-headline font-bold text-accent glow-cyan-text drop-shadow-[0_0_10px_rgba(23,206,164,0.3)]">
                #{activePatient.token_number}
              </h2>
              <p className="text-2xl font-headline font-bold">{activePatient.name}</p>
              <div className="pt-4">
                <Badge className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-xs font-bold animate-bounce">
                  PLEASE PROCEED TO ROOM 1
                </Badge>
              </div>
            </div>
          ) : (
            <div className="py-8 text-muted-foreground italic">
              Clinician is preparing for the next patient...
            </div>
          )}
        </section>

        {/* Predictive Wait Time Tool */}
        <section className="neumorphic p-6 rounded-[2rem] space-y-4 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-headline font-bold">
              <Zap size={18} />
              AI ESTIMATE
            </div>
            <div className="text-2xl font-headline font-bold">
              ~{totalEstimatedWait} <span className="text-sm text-muted-foreground font-normal">MINS</span>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-secondary/30 text-sm leading-relaxed text-muted-foreground relative">
            {loadingAi ? (
              <div className="flex items-center gap-2 animate-pulse">
                <div className="w-4 h-4 rounded-full bg-primary/20" />
                <span>Analyzing clinic flow...</span>
              </div>
            ) : (
              <p>{aiExplanation}</p>
            )}
            <Info size={14} className="absolute bottom-2 right-2 opacity-20" />
          </div>
        </section>

        {/* Up Next List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline font-bold text-lg flex items-center gap-2">
              <Users size={18} className="text-muted-foreground" />
              Up Next
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
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      {idx === 0 ? "STAY NEARBY" : "EST. " + (idx + 1) * Math.round(stats.avg_consult_duration / 60000) + " MINS"}
                    </p>
                  </div>
                </div>
                {idx === 0 && <Badge className="bg-primary/20 text-primary border-none rounded-lg">NEXT</Badge>}
              </div>
            ))}
            
            {waitingCount > 3 && (
              <div className="text-center py-4 text-xs text-muted-foreground font-bold tracking-widest bg-secondary/20 rounded-2xl border border-dashed border-border">
                + {waitingCount - 3} MORE PATIENTS IN QUEUE
              </div>
            )}
            
            {upNext.length === 0 && (
              <div className="text-center py-12 text-muted-foreground italic neumorphic rounded-2xl">
                Queue is empty.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Branding */}
      <footer className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 opacity-40">
          <Activity size={14} />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">PulseQueue Monitoring System</span>
        </div>
      </footer>
    </div>
  );
}
