
'use client';

import { useEffect, useState } from 'react';
import { DatabaseReference, onValue, DataSnapshot } from 'firebase/database';

export function useRTList<T = any>(ref: DatabaseReference | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) return;

    const unsubscribe = onValue(
      ref,
      (snapshot: DataSnapshot) => {
        const val = snapshot.val();
        if (val) {
          const list = Object.entries(val).map(([id, data]) => ({
            id,
            ...(data as any),
          })) as T[];
          setData(list);
        } else {
          setData([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("RTDB List Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
