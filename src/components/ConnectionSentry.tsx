
"use client";

import { useState, useEffect } from "react";
import { WifiOff, Database } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { useRTDB } from "@/firebase";

export function ConnectionSentry() {
  const [isOnline, setIsOnline] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [mounted, setMounted] = useState(false);
  const rtdb = useRTDB();

  useEffect(() => {
    setMounted(true);
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const connectedRef = ref(rtdb, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      setIsFirebaseConnected(snap.val() === true);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, [rtdb]);

  if (!mounted) return null;

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="p-8 border border-destructive/20 bg-card rounded-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <WifiOff size={48} className="text-destructive animate-pulse" />
          <h2 className="text-xl font-headline font-bold text-destructive uppercase tracking-widest">Offline</h2>
          <p className="text-muted-foreground text-sm">
            Network connection lost. Attempting to reconnect...
          </p>
        </div>
      </div>
    );
  }

  if (!isFirebaseConnected) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-destructive px-4 py-2 rounded-lg text-destructive-foreground animate-in slide-in-from-right-4">
        <Database size={16} className="animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Sync Lost</span>
      </div>
    );
  }

  return null;
}
