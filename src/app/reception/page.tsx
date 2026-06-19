
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
    if (!confirm("Confirm Reset?")) return;
    setLoading(true);
    try {
      await update(ref(rtdb), {
        queues: null,
        metrics: { total_patients_today: 0, avg_consult_duration: 600000 },
        live_status: null
      });
      toast({ title: "Reset Complete" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Reset Error", description: err.message });
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
            <Activity className="text-primary w-5 h-5" />
            <div>
              <h1 className="text-sm font-headline font-bold">Reception Portal</h1>
              <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest flex items-center gap-2">
                {queueLoading ? <RefreshCcw size={8} className="animate-spin" /> : <span className="w-1 h-1 rounded-full bg-accent" />}
                {waitingPatients.length} Active in Queue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-sm bg-muted/50 border border-border flex flex-col items-center">
              <span className="text-[7px] uppercase font-bold text-muted-foreground">Pace</span>
              <span className="font-bold text-xs text-accent">{Math.round((stats?.avg_consult_duration || 600000) / 60000)}m</span>
            </div>
            <div className="px-2 py-0.5 rounded-sm bg-muted/50 border border-border flex flex-col items-center">
              <span className="text-[7px] uppercase font-bold text-muted-foreground">Total</span>
              <span className="font-bold text-xs text-primary">{stats?.total_patients_today || 0}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={clearQueue} className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <Trash2 size={14} />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <div className="lg:col-span-3 space-y-2">
            <section className="minimal-card p-4 space-y-3">
              <h2 className="text-[10px] font-headline font-bold uppercase tracking-wider flex items-center gap-2">
                <Plus size={12} className="text-primary" /> New Registration
              </h2>
              <form onSubmit={handleIntake} className="space-y-2">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                  <Input 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Full Name"
                    className="pl-8 h-8 text-[11px]"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-8 text-[10px] font-bold uppercase tracking-widest">
                  Generate Token
                </Button>
              </form>
            </section>

            <section className="minimal-card p-4">
              <h2 className="text-[10px] font-headline font-bold uppercase tracking-wider mb-2">Currently Serving</h2>
              {activePatient ? (
                <div className="p-2 rounded-sm bg-accent/5 border border-accent/10 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                    #{activePatient.token_number}
                  </div>
                  <div>
                    <p className="font-bold text-[11px]">{activePatient.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">{new Date(activePatient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center border border-dashed border-border rounded-sm text-muted-foreground italic text-[10px]">
                  Doctor Idle
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-9 flex flex-col">
            <section className="minimal-card flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
                <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest">Active Waiting List</h2>
                <div className="relative w-40">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={10} />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients..."
                    className="pl-7 h-7 bg-white text-[10px]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-[calc(100vh-160px)]">
                {waitingPatients.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center opacity-30">
                    <Users size={24} className="mb-2" />
                    <p className="text-[8px] font-bold uppercase tracking-widest">No Waiting Patients</p>
                  </div>
                ) : (
                  waitingPatients.map((p, idx) => (
                    <div key={p.id} className="p-2 border border-border rounded-sm flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground w-5">#{p.token_number}</span>
                        <p className="font-bold text-[11px]">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] font-bold text-muted-foreground uppercase bg-muted px-1 py-0.5 rounded-sm">Pos {idx + 1}</span>
                        <Badge variant="outline" className="text-[7px] h-4 px-1 font-bold">WAITING</Badge>
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
