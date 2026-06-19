
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
    <div className="full-viewport-layout bg-background">
      <ConnectionSentry />
      
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card h-20 shrink-0">
        <div className="flex items-center gap-4">
          <Activity className="text-primary w-6 h-6" />
          <div>
            <h1 className="text-lg font-headline font-bold uppercase tracking-tight">Reception Console</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              {queueLoading ? <RefreshCcw size={12} className="animate-spin" /> : <span className="w-2 h-2 rounded-full bg-accent" />}
              {waitingPatients.length} Active in Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-8 px-6 border-x border-border">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Avg Pace</span>
              <span className="font-bold text-xl text-accent leading-none">{Math.round((stats?.avg_consult_duration || 600000) / 60000)}m</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Today</span>
              <span className="font-bold text-xl text-primary leading-none">{stats?.total_patients_today || 0}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearQueue} className="h-10 w-10 text-muted-foreground hover:text-destructive">
            <Trash2 size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Control Column */}
        <aside className="w-80 border-r border-border bg-muted/5 p-6 flex flex-col gap-8 shrink-0">
          <section className="space-y-4">
            <h2 className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Plus size={14} className="text-primary" /> Registration
            </h2>
            <form onSubmit={handleIntake} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Patient Name"
                  className="pl-10 h-12 text-sm rounded-none border-border"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 text-xs font-bold uppercase tracking-[0.2em] rounded-none">
                Issue Token
              </Button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] text-muted-foreground">Currently Serving</h2>
            {activePatient ? (
              <div className="p-4 border border-accent/20 bg-accent/5 rounded-none flex items-center gap-4">
                <div className="w-14 h-14 rounded-none bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl">
                  #{activePatient.token_number}
                </div>
                <div>
                  <p className="font-bold text-sm truncate w-40">{activePatient.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Started {new Date(activePatient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-border text-muted-foreground italic text-xs">
                No active session
              </div>
            )}
          </section>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/10 h-16 shrink-0">
            <h2 className="text-[10px] font-headline font-bold uppercase tracking-[0.3em]">Active Waiting List</h2>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name..."
                className="pl-10 h-10 bg-white text-xs rounded-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {waitingPatients.length === 0 ? (
                <div className="col-span-full h-96 flex flex-col items-center justify-center opacity-20">
                  <Users size={64} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-[0.4em]">Queue Empty</p>
                </div>
              ) : (
                waitingPatients.map((p, idx) => (
                  <div key={p.id} className="p-4 border border-border flex items-center justify-between bg-white hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-muted-foreground w-8 text-center">#{p.token_number}</span>
                      <p className="font-bold text-sm truncate max-w-[160px]">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-2 py-1 border border-border">POS {idx + 1}</span>
                      <Badge variant="outline" className="text-[10px] h-6 px-3 font-bold rounded-none border-primary/20 text-primary uppercase tracking-widest">Waiting</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
