
'use client';

import { useEffect, useState } from 'react';
import { DatabaseReference, onValue, DataSnapshot } from 'firebase/database';

export function useRTValue<T = any>(ref: DatabaseReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) return;

    const unsubscribe = onValue(
      ref,
      (snapshot: DataSnapshot) => {
        setData(snapshot.val());
        setLoading(false);
      },
      (err) => {
        console.error("RTDB Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
