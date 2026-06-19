
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
    <div className="min-h-screen bg-background p-4 md:p-8" suppressHydrationWarning>
      <ConnectionSentry />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary neumorphic">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight">Reception Desk</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                {queueLoading && <RefreshCcw size={12} className="animate-spin" />}
                {waitingPatients.length} Active Patients • Prof. Clinic Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="neumorphic py-3 px-6 rounded-2xl flex items-center gap-3 bg-card/50">
              <Clock className="text-accent" size={20} />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Flow Speed</p>
                <p className="font-headline font-bold text-accent">
                  {Math.round((stats?.avg_consult_duration || 600000) / 60000)}m
                </p>
              </div>
            </div>
            <div className="neumorphic py-3 px-6 rounded-2xl flex items-center gap-3 bg-card/50">
              <Users className="text-primary" size={20} />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Intake Total</p>
                <p className="font-headline font-bold text-primary">{stats?.total_patients_today || 0}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearQueue} className="rounded-2xl h-12 w-12 text-muted-foreground hover:text-destructive">
              <Trash2 size={20} />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls - Mobile First Column */}
          <div className="lg:col-span-4 space-y-8">
            <section className="neumorphic p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={20} className="text-primary" />
                <h2 className="text-xl font-headline font-bold">New Intake</h2>
              </div>
              <form onSubmit={handleIntake} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Patient Legal Name"
                    className="pl-12 h-16 bg-secondary/50 border-none rounded-2xl neumorphic-inset text-lg"
                    suppressHydrationWarning
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-16 rounded-2xl font-headline font-bold text-xl bg-primary hover:bg-primary/90 glow-blue shadow-lg">
                  Register & Assign Token
                </Button>
              </form>
            </section>

            {/* Current Session Summary */}
            <section className="neumorphic p-8 rounded-[2.5rem] bg-gradient-to-br from-card to-accent/5">
              <h2 className="text-xl font-headline font-bold mb-6">Clinic Live</h2>
              <div className="space-y-6">
                {activePatient ? (
                  <div className="p-6 rounded-2xl bg-accent/10 border border-accent/20">
                    <p className="text-xs font-bold uppercase tracking-widest text-accent mb-4 text-center">In Exam Room</p>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-black text-2xl">
                        #{activePatient.token_number}
                      </div>
                      <div>
                        <p className="font-headline font-bold text-2xl">{activePatient.name}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">Room 1 • Started {new Date(activePatient.called_at || activePatient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center opacity-30 border-2 border-dashed border-border/50 rounded-2xl">
                    <Clock size={40} className="mx-auto mb-2" />
                    <p className="text-sm font-bold uppercase tracking-widest">No Active Consult</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* List - Desktop/Full View Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <section className="neumorphic rounded-[2.5rem] flex-1 flex flex-col overflow-hidden bg-card/30">
              <div className="p-8 border-b border-border/50 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-headline font-bold">Waiting Repository</h2>
                  <p className="text-muted-foreground text-sm font-medium">{waitingPatients.length} patients currently tracked</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find patient..."
                    className="pl-10 h-10 bg-secondary/30 border-none rounded-xl"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[500px] custom-scrollbar">
                {waitingPatients.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 py-32 opacity-20">
                    <Users size={64} />
                    <p className="text-xl font-headline font-bold italic tracking-widest uppercase">No Records Found</p>
                  </div>
                ) : (
                  <div className="p-8 grid grid-cols-1 gap-4">
                    {waitingPatients.map((p, idx) => (
                      <div key={p.id} className="neumorphic-inset p-6 rounded-2xl flex items-center justify-between group hover:bg-primary/[0.03] transition-all border border-transparent hover:border-primary/10">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center font-headline font-bold text-xl text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            #{p.token_number}
                          </div>
                          <div>
                            <p className="font-headline font-bold text-2xl">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Checked in {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="rounded-lg px-3 py-1 font-bold border-primary/20 text-primary uppercase">
                            Waiting
                          </Badge>
                          <p className="text-[10px] text-muted-foreground font-black uppercase">Position {idx + 1}</p>
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
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--secondary));
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
