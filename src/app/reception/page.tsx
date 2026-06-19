
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
  Activity,
  Trash2,
  Search,
  RefreshCcw
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
}

export default function ReceptionPage() {
  const rtdb = useRTDB();
  const { toast } = useToast();
  const [nameInput, setNameInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  const statsRef = useMemo(() => ref(rtdb, "metrics"), [rtdb]);
  const { data: stats } = useRTValue<{ avg_consult_duration: number; total_patients_today: number }>(statsRef);

  const queueRef = useMemo(() => ref(rtdb, "queues"), [rtdb]);
  const { data: allPatients, loading: queueLoading } = useRTList<Patient>(queueRef);

  const waitingPatients = useMemo(() => 
    allPatients
      .filter(p => p.status === "waiting")
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.token_number - b.token_number)
  , [allPatients, searchQuery]);

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
      toast({ title: "Check-in Successful", description: `${patientName} is Token #${nextToken}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Check-in Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async () => {
    if (!confirm("Confirm Reset? This wipes the daily queue data.")) return;
    setLoading(true);
    try {
      await update(ref(rtdb), {
        queues: null,
        metrics: { total_patients_today: 0, avg_consult_duration: 600000 },
        live_status: null
      });
      toast({ title: "Reset Complete", description: "Queue has been reset." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Reset Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <ConnectionSentry />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border border-border rounded-xl bg-card">
          <div className="flex items-center gap-4">
            <Activity className="text-primary w-8 h-8" />
            <div>
              <h1 className="text-2xl font-headline font-bold">Reception Console</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                {queueLoading ? <RefreshCcw size={12} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                {waitingPatients.length} Active Patients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-lg bg-muted/50 border border-border flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Pace</span>
              <span className="font-bold text-lg text-accent">{Math.round((stats?.avg_consult_duration || 600000) / 60000)}m</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-muted/50 border border-border flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Today</span>
              <span className="font-bold text-lg text-primary">{stats?.total_patients_today || 0}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={clearQueue} className="text-muted-foreground hover:text-destructive">
              <Trash2 size={20} />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <section className="minimal-card p-8 space-y-6">
              <h2 className="text-lg font-headline font-bold flex items-center gap-2">
                <Plus size={20} className="text-primary" /> New Intake
              </h2>
              <form onSubmit={handleIntake} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Patient Name"
                    className="pl-10 h-12 bg-muted/20"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-bold uppercase tracking-widest">
                  Check In
                </Button>
              </form>
            </section>

            <section className="minimal-card p-8">
              <h2 className="text-lg font-headline font-bold mb-4">Now Serving</h2>
              {activePatient ? (
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl">
                    #{activePatient.token_number}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{activePatient.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">Started: {new Date(activePatient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-border rounded-lg text-muted-foreground italic text-sm">
                  Clinical area is idle
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-8 flex flex-col">
            <section className="minimal-card flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-lg font-headline font-bold">Waiting Repository</h2>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-9 h-10 bg-muted/20"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {waitingPatients.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center opacity-30">
                    <Users size={48} className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">No active queue</p>
                  </div>
                ) : (
                  waitingPatients.map((p, idx) => (
                    <div key={p.id} className="p-4 border border-border rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-muted-foreground w-8">#{p.token_number}</span>
                        <p className="font-bold">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded">Pos {idx + 1}</span>
                        <Badge variant="outline" className="text-[10px] font-bold">WAITING</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
