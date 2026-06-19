
"use client";

import { useMemo, useState } from "react";
import { ref, update } from "firebase/database";
import { 
  Stethoscope, 
  SkipForward, 
  Users, 
  Clock, 
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ConnectionSentry } from "@/components/ConnectionSentry";
import { useRTDB, useRTValue, useRTList } from "@/firebase";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: string;
  token_number: number;
  status: "waiting" | "active" | "completed" | "no-show";
  created_at: number;
  called_at?: number;
}

export default function DoctorPage() {
  const rtdb = useRTDB();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const queueRef = useMemo(() => ref(rtdb, "queues"), [rtdb]);
  const { data: allPatients } = useRTList<Patient>(queueRef);

  const statsRef = useMemo(() => ref(rtdb, "metrics"), [rtdb]);
  const { data: stats } = useRTValue<{ avg_consult_duration: number }>(statsRef);

  const activePatient = useMemo(() => 
    allPatients.find(p => p.status === "active") || null
  , [allPatients]);

  const waitingPatients = useMemo(() => 
    allPatients
      .filter(p => p.status === "waiting")
      .sort((a, b) => a.token_number - b.token_number)
  , [allPatients]);

  const handleCompleteAndNext = async () => {
    if (waitingPatients.length === 0 && !activePatient) return;
    setLoading(true);

    const now = Date.now();
    const updates: any = {};

    try {
      if (activePatient) {
        updates[`queues/${activePatient.id}/status`] = "completed";
        updates[`queues/${activePatient.id}/completed_at`] = now;
        
        const startTime = activePatient.called_at || activePatient.created_at;
        const duration = now - startTime;
        const currentAvg = stats?.avg_consult_duration || 600000;
        const updatedAvg = (currentAvg * 0.7) + (duration * 0.3);
        updates[`metrics/avg_consult_duration`] = updatedAvg;
      }

      if (waitingPatients.length > 0) {
        const nextPatient = waitingPatients[0];
        updates[`queues/${nextPatient.id}/status`] = "active";
        updates[`queues/${nextPatient.id}/called_at`] = now;
        
        updates[`live_status`] = {
          token: nextPatient.token_number,
          name: nextPatient.name,
          room: "Room 1",
          updated_at: now
        };
        
        toast({ title: "Next Patient Called", description: `Serving ${nextPatient.name}` });
      } else {
        updates[`live_status`] = null;
        toast({ title: "Queue Complete" });
      }

      await update(ref(rtdb), updates);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-viewport-layout bg-background">
      <ConnectionSentry />
      
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-card h-12 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-accent/10 text-accent border border-accent/20">
            <Stethoscope size={14} />
          </div>
          <div>
            <h1 className="text-xs font-headline font-bold uppercase tracking-tight">Clinical Console</h1>
            <p className="text-muted-foreground text-[7px] font-bold uppercase tracking-widest mt-0.5">Dr. Sterling • Room 1</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="px-3 border-x border-border flex flex-col items-center justify-center">
            <p className="text-[6px] uppercase font-bold text-muted-foreground">Avg Pace</p>
            <p className="text-[10px] font-headline font-bold text-accent">{Math.round((stats?.avg_consult_duration || 600000) / 60000)}m</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-[6px] uppercase font-bold text-muted-foreground">Pending</p>
            <p className="text-[10px] font-headline font-bold text-primary">{waitingPatients.length}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Main Session View */}
        <section className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/5">
          <div className="w-full max-w-2xl bg-card border border-border p-12 text-center space-y-12">
            <div className="space-y-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Now Serving</p>
              {activePatient ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-[12rem] font-headline font-bold leading-none text-accent tracking-tighter">
                    #{activePatient.token_number}
                  </div>
                  <h2 className="text-5xl font-headline font-bold text-foreground tracking-tight">{activePatient.name}</h2>
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-[9px] font-bold uppercase tracking-widest pt-4">
                    <Clock size={12} /> 
                    Session started at {activePatient.called_at ? new Date(activePatient.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                  </div>
                </div>
              ) : (
                <div className="py-24 space-y-6">
                  <CheckCircle2 size={64} className="mx-auto text-muted-foreground/10" />
                  <p className="text-xl font-headline font-bold text-muted-foreground uppercase tracking-[0.2em] italic">Station Available</p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleCompleteAndNext}
              disabled={loading || (waitingPatients.length === 0 && !activePatient)}
              className="w-full max-w-sm h-14 rounded-none font-headline font-bold text-xs uppercase tracking-[0.2em]"
            >
              <SkipForward className="mr-2" size={16} />
              {activePatient ? "Complete & Next" : "Call First Patient"}
            </Button>
          </div>
        </section>

        {/* Sidebar Queue View */}
        <aside className="w-72 border-l border-border bg-white flex flex-col shrink-0">
          <div className="p-3 border-b border-border bg-muted/10 h-10 flex items-center">
            <h3 className="text-[8px] font-headline font-bold uppercase tracking-widest flex items-center gap-2">
              <Users size={10} className="text-primary" /> Upcoming Queue
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {waitingPatients.length === 0 ? (
              <p className="text-center py-20 text-[9px] italic text-muted-foreground uppercase tracking-widest">Queue Clear</p>
            ) : (
              waitingPatients.map((p, idx) => (
                <div key={p.id} className="p-2.5 border border-border flex items-center justify-between bg-white hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground text-[10px] w-6">#{p.token_number}</span>
                    <span className="font-bold text-[10px] truncate max-w-[120px]">{p.name}</span>
                  </div>
                  {idx === 0 && <Badge variant="outline" className="text-[6px] h-3.5 px-1.5 text-primary border-primary/30 uppercase font-bold rounded-none">Next</Badge>}
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
      
      <footer className="h-8 border-t border-border bg-card flex items-center justify-between px-3 text-[6px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 shrink-0">
        <p>Dynamic Analytics Sync • Active</p>
        <p>Dr. Portal v2.5</p>
      </footer>
    </div>
  );
}
