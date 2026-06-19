
'use client';

import React from 'react';
import { app, db, auth, rtdb } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const services = { app, db, auth, rtdb };
  return <FirebaseProvider services={services}>{children}</FirebaseProvider>;
}
