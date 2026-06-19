
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
  LogOut
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

  // Real-time queue
  const queueRef = useMemo(() => ref(rtdb, "queues"), [rtdb]);
  const { data: allPatients } = useRTList<Patient>(queueRef);

  // Real-time metrics for duration calculations
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
      // 1. Complete Current Patient
      if (activePatient) {
        updates[`queues/${activePatient.id}/status`] = "completed";
        updates[`queues/${activePatient.id}/completed_at`] = now;
        
        // Calculate duration and update moving average (70/30 split)
        const startTime = activePatient.called_at || activePatient.created_at;
        const duration = now - startTime;
        const currentAvg = stats?.avg_consult_duration || 600000;
        const updatedAvg = (currentAvg * 0.7) + (duration * 0.3);
        updates[`metrics/avg_consult_duration`] = updatedAvg;
      }

      // 2. Call Next if available
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
        
        toast({ title: "Next Patient Called", description: `Now serving ${nextPatient.name}` });
      } else {
        updates[`live_status`] = null;
        toast({ title: "Queue Empty", description: "All patients have been served." });
      }

      await update(ref(rtdb), updates);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnly = async () => {
    if (!activePatient) return;
    setLoading(true);
    const now = Date.now();
    try {
      const updates: any = {};
      updates[`queues/${activePatient.id}/status`] = "completed";
      updates[`queues/${activePatient.id}/completed_at`] = now;
      updates[`live_status`] = null;

      const startTime = activePatient.called_at || activePatient.created_at;
      const duration = now - startTime;
      const currentAvg = stats?.avg_consult_duration || 600000;
      const updatedAvg = (currentAvg * 0.7) + (duration * 0.3);
      updates[`metrics/avg_consult_duration`] = updatedAvg;

      await update(ref(rtdb), updates);
      toast({ title: "Consultation Ended", description: `${activePatient.name} marked as completed.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <ConnectionSentry />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-accent/10 text-accent neumorphic">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold">Doctor Portal</h1>
            <p className="text-muted-foreground flex items-center gap-2 italic">
              Exam Room 1 • Dr. House
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="neumorphic py-3 px-6 rounded-2xl flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Remaining</p>
              <p className="font-headline font-bold text-primary">{waitingPatients.length}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-2xl h-full aspect-square text-muted-foreground hover:text-destructive">
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
        {/* Main Workspace */}
        <div className="lg:col-span-7 space-y-8">
          <section className="neumorphic p-10 rounded-[2.5rem] bg-gradient-to-br from-card via-card to-accent/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity size={120} className="text-accent" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold">Current Consultation</p>
                {activePatient ? (
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-accent/20 flex items-center justify-center text-accent font-headline font-bold text-3xl glow-cyan">
                      #{activePatient.token_number}
                    </div>
                    <div>
                      <h2 className="text-4xl font-headline font-bold">{activePatient.name}</h2>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock size={16} /> 
                        Started {activePatient.called_at ? new Date(activePatient.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <UserCircle size={48} className="mx-auto text-muted-foreground/30" />
                    <p className="text-muted-foreground italic text-lg">No patient currently in the exam room.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={handleCompleteAndNext}
                  disabled={loading || (waitingPatients.length === 0 && !activePatient)}
                  className="h-20 rounded-3xl font-headline font-bold text-xl bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-3 glow-cyan neumorphic-button"
                >
                  <SkipForward size={24} />
                  Finish & Call Next
                </Button>
                <Button 
                  onClick={handleCompleteOnly}
                  disabled={loading || !activePatient}
                  variant="outline"
                  className="h-20 rounded-3xl font-headline font-bold text-xl border-2 hover:bg-secondary flex items-center justify-center gap-3 neumorphic-button"
                >
                  <CheckCircle2 size={24} />
                  End Consult
                </Button>
              </div>
            </div>
          </section>

          {/* Up Next Preview */}
          <section className="neumorphic p-6 rounded-[2rem]">
            <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Upcoming Queue
            </h3>
            <div className="space-y-3">
              {waitingPatients.slice(0, 3).map((p, idx) => (
                <div key={p.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-muted-foreground">#{p.token_number}</div>
                    <div className="font-headline font-bold">{p.name}</div>
                  </div>
                  {idx === 0 && <Badge className="bg-primary/20 text-primary border-none">UP NEXT</Badge>}
                </div>
              ))}
              {waitingPatients.length === 0 && (
                <p className="text-center py-6 text-muted-foreground italic text-sm">No patients waiting in queue.</p>
              )}
            </div>
          </section>
        </div>

        {/* Side Panel / Analytics */}
        <div className="lg:col-span-5 space-y-8">
          <div className="neumorphic p-8 rounded-[2rem] space-y-6">
            <h3 className="font-headline font-bold text-xl">Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/50 space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Avg Time</p>
                <p className="text-2xl font-headline font-bold text-accent">
                  {Math.round((stats?.avg_consult_duration || 600000) / 60000)}m
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/50 space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Completed</p>
                <p className="text-2xl font-headline font-bold text-primary">
                  {allPatients.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Consultation durations are tracked to provide patients with accurate real-time wait estimates. 
                <span className="text-accent font-medium ml-1">The system is currently syncing at 120ms latency.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
