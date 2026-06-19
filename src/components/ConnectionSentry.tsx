
"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConnectionSentry() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(() => {
      setLastCheck(Date.now());
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="neumorphic p-8 rounded-3xl flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive animate-pulse">
          <WifiOff size={48} />
        </div>
        <h2 className="text-2xl font-headline text-destructive">Connection Lost</h2>
        <p className="text-muted-foreground">
          Your clinic internet seems unstable. PulseQueue is attempting to reconnect...
        </p>
        <div className="flex items-center gap-2 text-primary">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm font-medium">Reconnecting</span>
        </div>
      </div>
    </div>
  );
}
