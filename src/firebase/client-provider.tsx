
'use client';

import React, { useMemo, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { app, db, auth, rtdb } = useMemo(() => initializeFirebase(), []);

  useEffect(() => {
    // Ensure we have an anonymous session for writes
    signInAnonymously(auth).catch(err => {
      console.error("Anonymous Auth Failed:", err);
    });
  }, [auth]);

  return (
    <FirebaseProvider app={app} db={db} auth={auth} rtdb={rtdb}>
      {children}
    </FirebaseProvider>
  );
}
