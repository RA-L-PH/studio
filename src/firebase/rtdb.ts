
import { 
  getDatabase, 
  ref, 
  onValue, 
  off, 
  Database, 
  Query 
} from "firebase/database";
import { useEffect, useState, useMemo } from "react";
import { initializeFirebase } from "./index";

export const useRtdb = (): Database => {
  const { rtdb } = initializeFirebase();
  return rtdb;
};

export const useRTValue = <T,>(query: Query | null) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const listener = onValue(query, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => off(query, "value", listener);
  }, [query]);

  return { data, loading, error };
};

export const useRTList = <T,>(query: Query | null) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const listener = onValue(query, (snapshot) => {
      const list: T[] = [];
      snapshot.forEach(child => {
        list.push({ id: child.key, ...child.val() });
      });
      setData(list);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => off(query, "value", listener);
  }, [query]);

  return { data, loading, error };
};
