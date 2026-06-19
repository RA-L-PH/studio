
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  db 
} from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  runTransaction, 
  getDoc,
  limit,
  updateDoc
} from "firebase/firestore";
import { 
  Plus, 
  User, 
  Clock, 
  Users, 
  SkipForward, 
  Undo, 
  Volume2, 
  AlertCircle,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConnectionSentry } from "@/components/ConnectionSentry";

interface Patient {
  id: string;
  name: string;
  token_number: number;
  status: "waiting" | "active" | "completed" | "no-show";
  created_at: any;
  called_at?: any;
}

export default function ReceptionPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [stats, setStats] = useState({ avg_consult_duration: 600000, total_patients_today: 0 });
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial audio setup for "Ping"
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

    // Real-time listener for waiting patients
    const q = query(
      collection(db, "queues"), 
      where("status", "==", "waiting"), 
      orderBy("token_number", "asc")
    );
    const unsubscribeWaiting = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    });

    // Real-time listener for active patient
    const activeQ = query(
      collection(db, "queues"), 
      where("status", "==", "active"),
      limit(1)
    );
    const unsubscribeActive = onSnapshot(activeQ, (snapshot) => {
      if (!snapshot.empty) {
        setActivePatient({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Patient);
      } else {
        setActivePatient(null);
      }
    });

    // Metrics listener
    const metricsRef = doc(db, "metrics", "clinic_stats");
    const unsubscribeMetrics = onSnapshot(metricsRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.data() as any);
      }
    });

    return () => {
      unsubscribeWaiting();
      unsubscribeActive();
      unsubscribeMetrics();
    };
  }, []);

  const playPing = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    try {
      setLoading(true);
      const metricsRef = doc(db, "metrics", "clinic_stats");
      
      await runTransaction(db, async (transaction) => {
        const metricsDoc = await transaction.get(metricsRef);
        let nextToken = 1;
        
        if (metricsDoc.exists()) {
          nextToken = (metricsDoc.data().total_patients_today || 0) + 1;
        }

        const newPatientRef = doc(collection(db, "queues"));
        transaction.set(newPatientRef, {
          name: nameInput,
          token_number: nextToken,
          status: "waiting",
          created_at: serverTimestamp()
        });

        transaction.set(metricsRef, {
          ...metricsDoc.data(),
          total_patients_today: nextToken
        }, { merge: true });
      });

      setNameInput("");
      toast({ title: "Patient Added", description: `${nameInput} is in the queue.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Intake Error", description: "Could not add patient." });
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      setLoading(true);
      const metricsRef = doc(db, "metrics", "clinic_stats");
      
      await runTransaction(db, async (transaction) => {
        // 1. Complete current active patient
        if (activePatient) {
          const currentActiveRef = doc(db, "queues", activePatient.id);
          const now = Date.now();
          const startTime = activePatient.called_at?.toMillis() || activePatient.created_at.toMillis();
          const duration = now - startTime;

          transaction.update(currentActiveRef, { 
            status: "completed",
            completed_at: serverTimestamp() 
          });

          // 2. Update metrics (Rolling Average)
          const metricsDoc = await transaction.get(metricsRef);
          if (metricsDoc.exists()) {
            const currentAvg = metricsDoc.data().avg_consult_duration || 600000;
            const updatedAvg = (currentAvg * 0.7) + (duration * 0.3);
            transaction.update(metricsRef, { avg_consult_duration: updatedAvg });
          }
        }

        // 3. Find and activate next waiting patient
        const waitingQ = query(
          collection(db, "queues"), 
          where("status", "==", "waiting"), 
          orderBy("token_number", "asc"),
          limit(1)
        );
        const waitingSnapshot = await getDoc(doc(db, "queues", patients[0]?.id || "dummy"));
        
        if (patients.length > 0) {
          const nextPatient = patients[0];
          const nextRef = doc(db, "queues", nextPatient.id);
          transaction.update(nextRef, { 
            status: "active",
            called_at: serverTimestamp()
          });
          playPing();
          
          if (activePatient) {
            setLastCompletedId(activePatient.id);
            setShowUndo(true);
            setTimeout(() => setShowUndo(false), 30000);
          }
        }
      });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!activePatient) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, "queues", activePatient.id), { status: "no-show" });
      handleCallNext();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to skip patient." });
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!lastCompletedId) return;
    try {
      setLoading(true);
      await runTransaction(db, async (transaction) => {
        const currentActive = activePatient ? doc(db, "queues", activePatient.id) : null;
        const lastCompleted = doc(db, "queues", lastCompletedId);

        if (currentActive) {
          transaction.update(currentActive, { status: "waiting", called_at: null });
        }
        transaction.update(lastCompleted, { status: "active", completed_at: null });
      });
      setShowUndo(false);
      setLastCompletedId(null);
      toast({ title: "Action Undone", description: "Previous patient state restored." });
    } catch (e) {
      toast({ variant: "destructive", title: "Undo Failed" });
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
            <p className="text-muted-foreground">Managing {patients.length} patients waiting</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="neumorphic py-3 px-6 rounded-2xl flex items-center gap-3">
            <Clock className="text-accent" size={20} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Avg Consult</p>
              <p className="font-headline font-bold text-accent">
                {Math.round(stats.avg_consult_duration / 60000)}m
              </p>
            </div>
          </div>
          <div className="neumorphic py-3 px-6 rounded-2xl flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Today Total</p>
              <p className="font-headline font-bold text-primary">{stats.total_patients_today}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Actions & Input */}
        <div className="lg:col-span-4 space-y-8">
          {/* Intake Portal */}
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
                  className="pl-12 h-14 bg-secondary/50 border-none rounded-2xl neumorphic-inset focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-headline font-bold text-lg bg-primary hover:bg-primary/90 glow-blue">
                Add to Queue
              </Button>
            </form>
          </section>

          {/* Call Next Action */}
          <section className="neumorphic p-8 rounded-[2rem] bg-gradient-to-br from-card to-secondary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={120} />
            </div>
            
            <div className="space-y-6 relative z-10">
              <h2 className="text-2xl font-headline font-bold">Transition Control</h2>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleCallNext} 
                  disabled={loading || patients.length === 0}
                  className="w-full h-20 rounded-2xl font-headline font-bold text-xl bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-3 glow-cyan neumorphic-button"
                >
                  <SkipForward size={24} />
                  Call Next
                </Button>
                
                {showUndo && (
                  <Button 
                    onClick={handleUndo}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2"
                  >
                    <Undo size={16} />
                    Undo (Safety Buffer)
                  </Button>
                )}
              </div>

              {activePatient && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Now Serving</span>
                    <Button onClick={handleNoShow} variant="ghost" size="sm" className="text-destructive h-8 px-2 hover:bg-destructive/10">
                      No-Show
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                      #{activePatient.token_number}
                    </div>
                    <div>
                      <p className="font-headline font-bold text-lg">{activePatient.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> Called at {activePatient.called_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Queue List */}
        <div className="lg:col-span-8">
          <section className="neumorphic rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card/50">
              <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Live Waiting List
              </h2>
              <Badge variant="outline" className="rounded-full px-3 py-1 font-medium border-primary/20 text-primary">
                {patients.length} Pending
              </Badge>
            </div>
            
            <div className="divide-y divide-border/30">
              {patients.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    <Activity size={32} className="opacity-20" />
                  </div>
                  <p className="text-muted-foreground italic">No patients are currently waiting.</p>
                </div>
              ) : (
                patients.map((p, idx) => (
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
                    
                    <div className="flex items-center gap-8">
                      <div className="hidden md:block text-right">
                        <p className="text-xs uppercase tracking-tighter text-muted-foreground font-bold">Check-in</p>
                        <p className="text-sm font-medium">{p.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none rounded-lg px-3 py-1 font-bold">
                        WAITING
                      </Badge>
                    </div>
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
