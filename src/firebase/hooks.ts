
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db, rtdb } from './';

/**
 * Hook to get the Firestore database instance.
 */
export const useDb = () => {
  return db;
};

/**
 * Hook for listening to real-time data from a specific RTDB path.
 * @param path The path to the data in the Realtime Database.
 * @returns The data at the specified path.
 */
export const useRtdb = (path: string) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!path) return;

    const dataRef = ref(rtdb, path);
    const listener = onValue(dataRef, (snapshot) => {
      setData(snapshot.val());
    });

    // Detach the listener when the component unmounts
    return () => {
      off(dataRef, 'value', listener);
    };
  }, [path]);

  return data;
};
