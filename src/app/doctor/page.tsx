
"use client";

import { useMemo, useState } from "react";
import { ref, update } from "firebase/database";
import { 
  Stethoscope, 
  CheckCircle2, 
  SkipForward, 
  Users, 
  Clock, 
  UserCircle,
  Activity,
  LogOut,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          room: "Exam Room 1",
          updated_at: now
        };
        
        toast({ title: "Next Patient Called", description: `Serving ${nextPatient.name}` });
      } else {
        updates[`live_status`] = null;
        toast({ title: "Queue Finished", description: "You have served all waiting patients." });
      }

      await update(ref(rtdb), updates);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center justify-center">
      <ConnectionSentry />
      
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-3xl bg-accent/10 text-accent neumorphic">
              <Stethoscope size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-bold">Clinician Workspace</h1>
              <p className="text-muted-foreground flex items-center gap-2 text-lg italic">
                Room 1 • Dr. House
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="neumorphic py-4 px-8 rounded-3xl flex items-center gap-4">
              <Timer className="text-accent" size={24} />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Session Pace</p>
                <p className="font-headline font-bold text-2xl text-accent">
                  {Math.round((stats?.avg_consult_duration || 600000) / 60000)}m
                </p>
              </div>
            </div>
            <div className="neumorphic py-4 px-8 rounded-3xl flex items-center gap-4">
              <Users className="text-primary" size={24} />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">In Queue</p>
                <p className="font-headline font-bold text-2xl text-primary">{waitingPatients.length}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Action Area - Tablet Friendly Large Buttons */}
          <div className="lg:col-span-8">
            <section className="neumorphic p-10 md:p-16 rounded-[3rem] bg-gradient-to-br from-card via-card to-accent/5 relative overflow-hidden min-h-[500px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Activity size={240} className="text-accent" />
              </div>
              
              <div className="relative z-10 space-y-12">
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground font-bold text-center">Active Patient</p>
                  {activePatient ? (
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent font-headline font-bold text-5xl glow-cyan">
                        #{activePatient.token_number}
                      </div>
                      <div className="text-center">
                        <h2 className="text-5xl md:text-7xl font-headline font-bold">{activePatient.name}</h2>
                        <div className="flex items-center justify-center gap-3 mt-4 text-muted-foreground text-xl">
                          <Clock size={24} /> 
                          Started {activePatient.called_at ? new Date(activePatient.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-6">
                      <div className="w-24 h-24 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground/30">
                        <UserCircle size={64} />
                      </div>
                      <p className="text-muted-foreground italic text-2xl">Room 1 is currently empty.</p>
                    </div>
                  )}
                </div>

                <div className="pt-8">
                  <Button 
                    onClick={handleCompleteAndNext}
                    disabled={loading || (waitingPatients.length === 0 && !activePatient)}
                    className="w-full h-32 rounded-[2.5rem] font-headline font-bold text-3xl bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-6 glow-cyan neumorphic-button shadow-2xl"
                  >
                    <SkipForward size={40} />
                    {activePatient ? "Complete & Call Next" : "Call Next Patient"}
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Up Next List */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <section className="neumorphic p-8 rounded-[3rem] flex-1">
              <h3 className="font-headline font-bold text-xl mb-6 flex items-center gap-3">
                <Users size={24} className="text-primary" />
                Next Up
              </h3>
              <div className="space-y-4">
                {waitingPatients.slice(0, 5).map((p, idx) => (
                  <div key={p.id} className="p-5 rounded-[1.5rem] bg-secondary/30 border border-border/50 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="text-lg font-black text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">#{p.token_number}</div>
                      <div className="font-headline font-bold text-xl">{p.name}</div>
                    </div>
                    {idx === 0 && <Badge className="bg-primary text-primary-foreground border-none font-bold py-1 px-3">NEXT</Badge>}
                  </div>
                ))}
                {waitingPatients.length === 0 && (
                  <div className="py-20 text-center space-y-4 opacity-30">
                    <CheckCircle2 size={48} className="mx-auto" />
                    <p className="italic font-bold tracking-widest uppercase text-sm">Clear Queue</p>
                  </div>
                )}
                {waitingPatients.length > 5 && (
                  <p className="text-center text-xs font-bold text-muted-foreground uppercase py-4 border-t border-dashed mt-4">
                    + {waitingPatients.length - 5} More Pending
                  </p>
                )}
              </div>
            </section>

            <Button variant="outline" className="h-20 rounded-[2rem] border-2 font-headline font-bold text-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut size={24} />
              End Clinical Shift
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
