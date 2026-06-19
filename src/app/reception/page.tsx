"use client";

import { useState, useMemo } from "react";
import { 
  ref, 
  push, 
  set, 
  runTransaction, 
  update
} from "firebase/database";
import { 
  Plus, 
  User, 
  Clock, 
  Users, 
  SkipForward, 
  Activity,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ReceptionPage() {
  const rtdb = useRTDB();
  const { toast } = useToast();
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const statsRef = useMemo(() => ref(rtdb, "metrics"), [rtdb]);
  const { data: stats } = useRTValue<{ avg_consult_duration: number; total_patients_today: number }>(statsRef);

  const queueRef = useMemo(() => ref(rtdb, "queues"), [rtdb]);
  const { data: allPatients } = useRTList<Patient>(queueRef);

  const waitingPatients = useMemo(() => 
    allPatients
      .filter(p => p.status === "waiting")
      .sort((a, b) => a.token_number - b.token_number)
  , [allPatients]);

  const activePatient = useMemo(() => 
    allPatients.find(p => p.status === "active") || null
  , [allPatients]);

  const handleIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientName = nameInput.trim();
    if (!patientName) return;

    setLoading(true);
    try {
      const { snapshot } = await runTransaction(statsRef, (currentData) => {
        if (!currentData) {
          return { total_patients_today: 1, avg_consult_duration: 600000 };
        }
        return {
          ...currentData,
          total_patients_today: (currentData.total_patients_today || 0) + 1
        };
      });

      const nextToken = snapshot.val().total_patients_today;
      const newPatientRef = push(ref(rtdb, "queues"));
      
      await set(newPatientRef, {
        name: patientName,
        token_number: nextToken,
        status: "waiting",
        created_at: Date.now()
      });

      setNameInput("");
      toast({ title: "Patient Added", description: `${patientName} is Token #${nextToken}` });
    } catch (err: any) {
      console.error("Intake Failed:", err);
      toast({ variant: "destructive", title: "Intake Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (waitingPatients.length === 0) return;
    setLoading(true);

    const nextPatient = waitingPatients[0];
    const now = Date.now();

    try {
      const updates: any = {};
      
      if (activePatient) {
        updates[`queues/${activePatient.id}/status`] = "completed";
        updates[`queues/${activePatient.id}/completed_at`] = now;
        
        const startTime = activePatient.called_at || activePatient.created_at;
        const duration = now - startTime;
        const currentAvg = stats?.avg_consult_duration || 600000;
        const updatedAvg = (currentAvg * 0.7) + (duration * 0.3);
        updates[`metrics/avg_consult_duration`] = updatedAvg;
      }

      updates[`queues/${nextPatient.id}/status`] = "active";
      updates[`queues/${nextPatient.id}/called_at`] = now;

      updates[`live_status`] = {
        token: nextPatient.token_number,
        name: nextPatient.name,
        room: "Room 1",
        updated_at: now
      };

      await update(ref(rtdb), updates);
      toast({ title: "Patient Called", description: `Serving ${nextPatient.name} in Room 1` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const updates: any = {};
      updates[`queues/${activePatient.id}/status`] = "no-show";
      updates[`live_status`] = null;
      await update(ref(rtdb), updates);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async () => {
    if (!confirm("Are you sure? This will reset the clinic for the day.")) return;
    setLoading(true);
    try {
      await update(ref(rtdb), {
        queues: null,
        metrics: { total_patients_today: 0, avg_consult_duration: 600000 },
        live_status: null
      });
      toast({ title: "Reset Complete", description: "All data cleared." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Reset Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <ConnectionSentry />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary neumorphic">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold">Reception Portal</h1>
            <p className="text-muted-foreground">Managing {waitingPatients.length} patients waiting</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="neumorphic py-3 px-6 rounded-2xl flex items-center gap-3">
            <Clock className="text-accent" size={20} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Avg Consult</p>
              <p className="font-headline font-bold text-accent">
                {Math.round((stats?.avg_consult_duration || 600000) / 60000)}m
              </p>
            </div>
          </div>
          <div className="neumorphic py-3 px-6 rounded-2xl flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Today Total</p>
              <p className="font-headline font-bold text-primary">{stats?.total_patients_today || 0}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearQueue} className="rounded-2xl h-full aspect-square text-muted-foreground hover:text-destructive">
            <Trash2 size={20} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <section className="neumorphic p-6 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus size={20} className="text-primary" />
              <h2 className="text-xl font-headline font-bold">Rapid Intake</h2>
            </div>
            <form onSubmit={handleIntake} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Patient Name"
                  className="pl-12 h-14 bg-secondary/50 border-none rounded-2xl neumorphic-inset"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-headline font-bold text-lg bg-primary hover:bg-primary/90 glow-blue">
                Add to Queue
              </Button>
            </form>
          </section>

          <section className="neumorphic p-8 rounded-[2rem] bg-gradient-to-br from-card to-secondary/30 relative overflow-hidden group">
            <div className="space-y-6 relative z-10">
              <h2 className="text-2xl font-headline font-bold">Transition Control</h2>
              <div className="space-y-3">
                <Button 
                  onClick={handleCallNext} 
                  disabled={loading || waitingPatients.length === 0}
                  className="w-full h-20 rounded-2xl font-headline font-bold text-xl bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-3 glow-cyan neumorphic-button"
                >
                  <SkipForward size={24} />
                  Call Next
                </Button>
              </div>

              {activePatient && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Now Serving</span>
                    <Button onClick={handleNoShow} variant="ghost" size="sm" className="text-destructive h-8 px-2">No-Show</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                      #{activePatient.token_number}
                    </div>
                    <div>
                      <p className="font-headline font-bold text-lg">{activePatient.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <section className="neumorphic rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card/50">
              <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Live Waiting List
              </h2>
              <Badge variant="outline" className="rounded-full px-3 py-1 font-medium border-primary/20 text-primary">
                {waitingPatients.length} Pending
              </Badge>
            </div>
            <div className="divide-y divide-border/30">
              {waitingPatients.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <p className="text-muted-foreground italic">No patients are currently waiting.</p>
                </div>
              ) : (
                waitingPatients.map((p, idx) => (
                  <div key={p.id} className="p-6 flex items-center justify-between group hover:bg-primary/[0.02] transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-headline font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-headline font-bold text-lg">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Token #{p.token_number}</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none rounded-lg px-3 py-1 font-bold">WAITING</Badge>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}