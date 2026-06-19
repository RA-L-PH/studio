
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
    <div className="min-h-screen bg-background p-2">
      <ConnectionSentry />
      
      <div className="w-full space-y-2">
        <header className="flex items-center justify-between p-3 border border-border rounded-sm bg-card">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-accent/10 text-accent border border-accent/20">
              <Stethoscope size={20} />
            </div>
            <div>
              <h1 className="text-sm font-headline font-bold tracking-tight">Clinical Console</h1>
              <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest mt-0.5">Dr. Sterling • Examination Room 1</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="px-3 py-0.5 rounded-sm bg-muted/30 border border-border text-center">
              <p className="text-[7px] uppercase font-bold text-muted-foreground">Avg Duration</p>
              <p className="text-sm font-headline font-bold text-accent">{Math.round((stats?.avg_consult_duration || 600000) / 60000)}m</p>
            </div>
            <div className="px-3 py-0.5 rounded-sm bg-muted/30 border border-border text-center">
              <p className="text-[7px] uppercase font-bold text-muted-foreground">Queued</p>
              <p className="text-sm font-headline font-bold text-primary">{waitingPatients.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <div className="lg:col-span-9">
            <section className="minimal-card p-8 min-h-[500px] flex flex-col justify-center text-center bg-card/30">
              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Active Session</p>
                  {activePatient ? (
                    <div className="space-y-4 animate-in zoom-in-95 duration-500">
                      <div className="inline-block text-[10rem] font-headline font-bold leading-none text-accent">
                        #{activePatient.token_number}
                      </div>
                      <h2 className="text-4xl font-headline font-bold text-foreground tracking-tight">{activePatient.name}</h2>
                      <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        <Clock size={12} /> 
                        Started {activePatient.called_at ? new Date(activePatient.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 space-y-3">
                      <CheckCircle2 size={40} className="mx-auto text-muted-foreground/10" />
                      <p className="text-lg font-headline font-bold italic text-muted-foreground uppercase tracking-widest">Ready for next patient</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCompleteAndNext}
                  disabled={loading || (waitingPatients.length === 0 && !activePatient)}
                  className="w-full max-w-xs mx-auto h-12 rounded-sm font-headline font-bold text-sm uppercase tracking-widest"
                >
                  <SkipForward className="mr-2" size={16} />
                  {activePatient ? "Mark Complete" : "Call First Patient"}
                </Button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-3">
            <section className="minimal-card p-4 flex flex-col h-full bg-muted/5">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Users size={12} className="text-primary" /> Upcoming Patients
              </h3>
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
                {waitingPatients.slice(0, 15).map((p, idx) => (
                  <div key={p.id} className="p-2 border border-border rounded-sm flex items-center justify-between bg-white hover:bg-muted/30 transition-colors">
                    <span className="font-bold text-muted-foreground text-[9px] w-6">#{p.token_number}</span>
                    <span className="font-bold text-[10px] flex-1 truncate mr-2">{p.name}</span>
                    {idx === 0 && <Badge variant="outline" className="text-[7px] h-3 px-1 text-primary border-primary/20">NEXT</Badge>}
                  </div>
                ))}
                {waitingPatients.length === 0 && (
                  <p className="text-center py-10 text-[10px] italic text-muted-foreground">No pending patients</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
