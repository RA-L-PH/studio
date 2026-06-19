
'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { app, db, auth, rtdb } = useMemo(() => initializeFirebase(), []);

  // Removed automatic anonymous sign-in to avoid auth/admin-restricted-operation errors 
  // on projects where Anonymous Auth is not yet enabled in the console.

  return (
    <FirebaseProvider app={app} db={db} auth={auth} rtdb={rtdb}>
      {children}
    </FirebaseProvider>
  );
}
