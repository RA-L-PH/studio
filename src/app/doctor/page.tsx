
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
    <div className="min-h-screen bg-[#020617] p-4 md:p-12 flex flex-col items-center justify-center">
      <ConnectionSentry />
      
      <div className="w-full max-w-7xl space-y-12 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 neu-glass p-10 rounded-[3rem]">
          <div className="flex items-center gap-6">
            <div className="p-5 rounded-[2rem] bg-accent/10 text-accent border border-accent/20 glow-cyan shadow-xl">
              <Stethoscope size={44} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Clinical Hub</h1>
              <p className="text-muted-foreground flex items-center gap-3 text-lg font-bold uppercase tracking-[0.2em] mt-2">
                <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                Dr. Sterling • Room 1
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="glass-card py-5 px-10 rounded-[1.5rem] flex items-center gap-5">
              <Timer className="text-accent" size={32} />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-black">Pace (Avg)</p>
                <p className="font-headline font-bold text-3xl text-accent">
                  {Math.round((stats?.avg_consult_duration || 600000) / 60000)}m
                </p>
              </div>
            </div>
            <div className="glass-card py-5 px-10 rounded-[1.5rem] flex items-center gap-5">
              <Users className="text-primary" size={32} />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-black">Pending</p>
                <p className="font-headline font-bold text-3xl text-primary">{waitingPatients.length}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Action Area */}
          <div className="lg:col-span-8">
            <section className="neu-glass p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-card via-card to-accent/10 relative overflow-hidden min-h-[600px] flex flex-col justify-center border-accent/5">
              <div className="absolute top-[-10%] right-[-10%] opacity-5 pointer-events-none">
                <Activity size={400} className="text-accent" />
              </div>
              
              <div className="relative z-10 space-y-16">
                <div className="space-y-6">
                  <p className="text-sm uppercase tracking-[0.6em] text-accent/60 font-black text-center mb-10">Active Consultation Profile</p>
                  {activePatient ? (
                    <div className="flex flex-col items-center gap-10 animate-in zoom-in-95 duration-700">
                      <div className="w-40 h-40 rounded-[3rem] glass-card flex items-center justify-center text-accent font-headline font-bold text-7xl glow-cyan shadow-2xl border-accent/40">
                        #{activePatient.token_number}
                      </div>
                      <div className="text-center space-y-4">
                        <h2 className="text-6xl md:text-8xl font-headline font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{activePatient.name}</h2>
                        <div className="flex items-center justify-center gap-4 text-muted-foreground text-2xl font-bold italic">
                          <Clock size={28} className="text-accent" /> 
                          Started {activePatient.called_at ? new Date(activePatient.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center space-y-8 animate-in fade-in duration-1000">
                      <div className="w-32 h-32 rounded-full glass-card mx-auto flex items-center justify-center text-muted-foreground/20 border-white/5">
                        <UserCircle size={80} />
                      </div>
                      <p className="text-muted-foreground italic text-3xl font-headline">Clinical Space Available</p>
                    </div>
                  )}
                </div>

                <div className="pt-10">
                  <Button 
                    onClick={handleCompleteAndNext}
                    disabled={loading || (waitingPatients.length === 0 && !activePatient)}
                    className="w-full h-36 rounded-[3rem] font-headline font-bold text-4xl bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-8 glow-cyan shadow-2xl active:scale-95 transition-all"
                  >
                    <SkipForward size={48} />
                    {activePatient ? "Complete Session" : "Call Next Patient"}
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Up Next List */}
          <div className="lg:col-span-4 flex flex-col gap-10">
            <section className="neu-glass p-10 rounded-[3.5rem] flex-1 border-white/5">
              <h3 className="font-headline font-bold text-2xl mb-10 flex items-center gap-4 text-primary">
                <Users size={32} />
                Next Up
              </h3>
              <div className="space-y-6">
                {waitingPatients.slice(0, 6).map((p, idx) => (
                  <div key={p.id} className="p-7 rounded-[2rem] glass-card border-white/5 flex items-center justify-between group hover:border-primary/40 transition-all duration-300">
                    <div className="flex items-center gap-6">
                      <div className="text-xl font-black text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">#{p.token_number}</div>
                      <div className="font-headline font-bold text-2xl">{p.name}</div>
                    </div>
                    {idx === 0 && <Badge className="bg-primary text-primary-foreground border-none font-black py-2 px-5 rounded-full shadow-lg">NEXT</Badge>}
                  </div>
                ))}
                {waitingPatients.length === 0 && (
                  <div className="py-24 text-center space-y-6 opacity-20">
                    <CheckCircle2 size={64} className="mx-auto" />
                    <p className="italic font-black tracking-[0.3em] uppercase text-sm">Flow Clear</p>
                  </div>
                )}
                {waitingPatients.length > 6 && (
                  <div className="pt-6 border-t border-dashed border-white/10 mt-6 text-center">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      + {waitingPatients.length - 6} Additional Pending
                    </p>
                  </div>
                )}
              </div>
            </section>

            <Button variant="outline" className="h-24 rounded-[2.5rem] border-2 border-white/5 glass-card font-headline font-bold text-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all active:scale-95">
              <LogOut size={28} className="mr-4" />
              Sign Off
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
