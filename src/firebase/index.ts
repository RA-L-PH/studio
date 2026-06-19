
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  // Explicitly passing the databaseURL ensures the client connects to the correct RTDB instance
  const rtdb = getDatabase(app, firebaseConfig.databaseURL);
  return { app, db, auth, rtdb };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './database/use-rt-value';
export * from './database/use-rt-list';
