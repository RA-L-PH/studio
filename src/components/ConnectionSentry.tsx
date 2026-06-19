
"use client";

import { useState, useEffect, useMemo } from "react";
import { WifiOff, RefreshCw, Database } from "lucide-react";
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

    // Monitor Firebase RTDB connection status
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

  // Show full-screen overlay for browser offline
  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
        <div className="neumorphic p-8 rounded-3xl flex flex-col items-center gap-4 max-w-sm text-center border border-destructive/20 shadow-2xl">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive animate-pulse">
            <WifiOff size={48} />
          </div>
          <h2 className="text-2xl font-headline text-destructive font-bold">Network Offline</h2>
          <p className="text-muted-foreground text-sm">
            Your clinic internet seems unstable. PulseQueue is attempting to reconnect...
          </p>
          <div className="flex items-center gap-2 text-primary font-medium">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Reconnecting</span>
          </div>
        </div>
      </div>
    );
  }

  // Show toast-like indicator for Firebase disconnection
  if (!isFirebaseConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-3 bg-destructive/90 text-destructive-foreground px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
        <Database size={18} className="animate-pulse" />
        <span className="text-sm font-bold font-headline uppercase tracking-wider">Sync Disconnected</span>
      </div>
    );
  }

  return null;
}
