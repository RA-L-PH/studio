"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function ConnectionSentry() {
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted || isOnline) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="neumorphic p-8 rounded-3xl flex flex-col items-center gap-4 max-w-sm text-center border border-destructive/20 shadow-2xl">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive animate-pulse">
          <WifiOff size={48} />
        </div>
        <h2 className="text-2xl font-headline text-destructive font-bold">Connection Lost</h2>
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