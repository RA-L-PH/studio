
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
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12">
      <ConnectionSentry />
      
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded bg-accent/10 text-accent border border-accent/20">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold">Clinical Hub</h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5">Dr. Sterling • Room 1</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-1.5 rounded-md bg-muted/30 border border-border text-center min-w-[80px]">
              <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Avg Visit</p>
              <p className="text-lg font-headline font-bold text-accent">{Math.round((stats?.avg_consult_duration || 600000) / 60000)}m</p>
            </div>
            <div className="px-4 py-1.5 rounded-md bg-muted/30 border border-border text-center min-w-[80px]">
              <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Waiting</p>
              <p className="text-lg font-headline font-bold text-primary">{waitingPatients.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <section className="minimal-card p-10 min-h-[400px] flex flex-col justify-center text-center">
              <div className="space-y-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Now Serving</p>
                  {activePatient ? (
                    <div className="space-y-4 animate-in zoom-in-95 duration-500">
                      <div className="inline-block text-[6rem] font-headline font-bold leading-none text-accent">
                        #{activePatient.token_number}
                      </div>
                      <h2 className="text-4xl font-headline font-bold text-foreground">{activePatient.name}</h2>
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-bold">
                        <Clock size={14} /> 
                        Started {activePatient.called_at ? new Date(activePatient.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 space-y-3">
                      <CheckCircle2 size={48} className="mx-auto text-muted-foreground/20" />
                      <p className="text-xl font-headline font-bold italic text-muted-foreground">Ready for intake</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCompleteAndNext}
                  disabled={loading || (waitingPatients.length === 0 && !activePatient)}
                  className="w-full max-w-xs mx-auto h-14 rounded-lg font-headline font-bold text-lg uppercase tracking-widest"
                >
                  <SkipForward className="mr-3" size={20} />
                  {activePatient ? "Complete" : "Call Next"}
                </Button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
            <section className="minimal-card p-6 flex flex-col h-full">
              <h3 className="text-sm font-headline font-bold mb-4 flex items-center gap-2">
                <Users size={16} className="text-primary" /> Up Next
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-[350px] custom-scrollbar">
                {waitingPatients.slice(0, 10).map((p, idx) => (
                  <div key={p.id} className="p-3 border border-border rounded-md flex items-center justify-between bg-muted/10">
                    <span className="font-bold text-muted-foreground text-[10px] w-6">#{p.token_number}</span>
                    <span className="font-bold text-xs flex-1">{p.name}</span>
                    {idx === 0 && <Badge variant="outline" className="text-[8px] h-4 px-1 text-primary border-primary/20">NEXT</Badge>}
                  </div>
                ))}
                {waitingPatients.length === 0 && (
                  <p className="text-center py-8 text-xs italic text-muted-foreground">Empty</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
