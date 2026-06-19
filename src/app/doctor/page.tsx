
"use client";

import { useMemo, useState } from "react";
import { ref, update } from "firebase/database";
import { 
  Stethoscope, 
  SkipForward, 
  Users, 
  Clock, 
  Timer,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ConnectionSentry } from "@/components/ConnectionSentry";
import { useRTDB, useRTValue, useRTList } from "@/firebase";

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
        toast({ title: "Queue Complete", description: "All patients served." });
      }

      await update(ref(rtdb), updates);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <ConnectionSentry />
      
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 border border-border rounded-xl bg-card">
          <div className="flex items-center gap-6">
            <div className="p-3 rounded-lg bg-accent/10 text-accent border border-accent/20">
              <Stethoscope size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold">Clinical Hub</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Dr. Sterling • Examination Room 1</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Avg Duration</p>
              <p className="text-xl font-headline font-bold text-accent">{Math.round((stats?.avg_consult_duration || 600000) / 60000)}m</p>
            </div>
            <div className="px-6 py-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Waitlist</p>
              <p className="text-xl font-headline font-bold text-primary">{waitingPatients.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <section className="minimal-card p-12 min-h-[500px] flex flex-col justify-center text-center">
              <div className="space-y-12">
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground">Currently Serving</p>
                  {activePatient ? (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                      <div className="inline-block text-[8rem] font-headline font-bold leading-none text-accent">
                        #{activePatient.token_number}
                      </div>
                      <h2 className="text-5xl font-headline font-bold text-foreground">{activePatient.name}</h2>
                      <div className="flex items-center justify-center gap-2 text-muted-foreground font-bold">
                        <Clock size={16} /> 
                        Started {activePatient.called_at ? new Date(activePatient.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 space-y-4">
                      <CheckCircle2 size={64} className="mx-auto text-muted-foreground/20" />
                      <p className="text-2xl font-headline font-bold italic text-muted-foreground">Ready for next patient</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCompleteAndNext}
                  disabled={loading || (waitingPatients.length === 0 && !activePatient)}
                  className="w-full max-w-md mx-auto h-20 rounded-xl font-headline font-bold text-xl uppercase tracking-widest"
                >
                  <SkipForward className="mr-4" size={24} />
                  {activePatient ? "Complete & Call Next" : "Call Next Patient"}
                </Button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
            <section className="minimal-card p-8 flex flex-col h-full">
              <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-3">
                <Users size={20} className="text-primary" /> Up Next
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
                {waitingPatients.slice(0, 8).map((p, idx) => (
                  <div key={p.id} className="p-4 border border-border rounded-lg flex items-center justify-between bg-muted/20">
                    <span className="font-bold text-muted-foreground text-xs w-8">#{p.token_number}</span>
                    <span className="font-bold flex-1">{p.name}</span>
                    {idx === 0 && <span className="text-[10px] font-bold text-primary border border-primary/20 px-2 py-0.5 rounded">NEXT</span>}
                  </div>
                ))}
                {waitingPatients.length === 0 && (
                  <p className="text-center py-12 text-sm italic text-muted-foreground">Queue is empty</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
