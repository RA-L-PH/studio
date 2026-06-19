
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
  RefreshCcw,
  Search
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  const statsRef = useMemo(() => ref(rtdb, "metrics"), [rtdb]);
  const { data: stats, loading: statsLoading } = useRTValue<{ avg_consult_duration: number; total_patients_today: number }>(statsRef);

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
      toast({ title: "Reset Complete", description: "All queues cleared for new session." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Reset Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8" suppressHydrationWarning>
      <ConnectionSentry />
      
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 neu-glass p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 glow-blue">
              <Activity size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Reception Console</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2 font-bold uppercase tracking-widest mt-1">
                {queueLoading ? <RefreshCcw size={14} className="animate-spin" /> : <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                {waitingPatients.length} Active in Queue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="glass-card py-4 px-6 rounded-2xl flex items-center gap-4">
              <Clock className="text-accent" size={24} />
              <div>
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Avg Session</p>
                <p className="font-headline font-bold text-2xl text-accent">
                  {Math.round((stats?.avg_consult_duration || 600000) / 60000)}m
                </p>
              </div>
            </div>
            <div className="glass-card py-4 px-6 rounded-2xl flex items-center gap-4">
              <Users className="text-primary" size={24} />
              <div>
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Total Daily</p>
                <p className="font-headline font-bold text-2xl text-primary">{stats?.total_patients_today || 0}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearQueue} className="rounded-2xl h-14 w-14 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all">
              <Trash2 size={24} />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls - Mobile First Column */}
          <div className="lg:col-span-4 space-y-8">
            <section className="neu-glass p-10 rounded-[3rem] space-y-8">
              <div className="flex items-center gap-3">
                <Plus size={24} className="text-primary" />
                <h2 className="text-2xl font-headline font-bold">New Intake</h2>
              </div>
              <form onSubmit={handleIntake} className="space-y-6">
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                  <Input 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Patient Legal Name"
                    className="pl-14 h-20 bg-secondary/30 border-white/5 rounded-[1.5rem] neumorphic-inset text-xl focus:ring-primary/50"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-20 rounded-[1.5rem] font-headline font-bold text-2xl bg-primary hover:bg-primary/90 glow-blue shadow-2xl transition-all active:scale-95">
                  Add to Queue
                </Button>
              </form>
            </section>

            {/* Current Session Summary */}
            <section className="neu-glass p-10 rounded-[3rem] bg-gradient-to-br from-card via-card to-accent/10">
              <h2 className="text-2xl font-headline font-bold mb-8">Now Serving</h2>
              <div className="space-y-6">
                {activePatient ? (
                  <div className="p-8 rounded-[2rem] glass-card border-accent/20 animate-in zoom-in-95 duration-500">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-6 text-center">Room 1 • Clinical Status</p>
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-accent text-accent-foreground flex items-center justify-center font-black text-4xl shadow-xl">
                        #{activePatient.token_number}
                      </div>
                      <div>
                        <p className="font-headline font-bold text-3xl">{activePatient.name}</p>
                        <p className="text-sm text-muted-foreground font-bold uppercase mt-2">Started {new Date(activePatient.called_at || activePatient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/10 rounded-[2rem]">
                    <Clock size={48} className="mx-auto mb-4" />
                    <p className="text-lg font-bold uppercase tracking-widest italic">Room Currently Idle</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* List - Desktop/Full View Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <section className="neu-glass rounded-[3rem] flex-1 flex flex-col overflow-hidden">
              <div className="p-10 border-b border-white/5 flex flex-col md:flex-row gap-8 md:items-center justify-between bg-white/[0.02]">
                <div>
                  <h2 className="text-3xl font-headline font-bold">Waiting Repository</h2>
                  <p className="text-muted-foreground text-base font-bold uppercase tracking-widest mt-1">{waitingPatients.length} Active Records</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients..."
                    className="pl-14 h-14 bg-secondary/50 border-white/5 rounded-[1.25rem] neumorphic-inset text-lg"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[600px] custom-scrollbar">
                {waitingPatients.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 py-48 opacity-20">
                    <Users size={80} />
                    <p className="text-2xl font-headline font-bold italic tracking-[0.4em] uppercase">No Patients Pending</p>
                  </div>
                ) : (
                  <div className="p-10 grid grid-cols-1 gap-6">
                    {waitingPatients.map((p, idx) => (
                      <div key={p.id} className="glass-card p-8 rounded-[2rem] flex items-center justify-between group hover:bg-primary/10 transition-all duration-300 border-white/5 hover:border-primary/30">
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 rounded-[1.25rem] bg-secondary border border-white/5 flex items-center justify-center font-headline font-bold text-2xl text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all">
                            #{p.token_number}
                          </div>
                          <div>
                            <p className="font-headline font-bold text-3xl group-hover:translate-x-1 transition-transform">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mt-2 italic">Intake Time: {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <Badge variant="outline" className="rounded-xl px-5 py-2 font-black border-primary/30 text-primary uppercase tracking-widest glass">
                            PENDING
                          </Badge>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Position #{idx + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
