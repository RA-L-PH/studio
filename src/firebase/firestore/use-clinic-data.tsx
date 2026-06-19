
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useAuth } from '../auth-provider'; // Adjust the import path as needed
import { initializeFirebase } from '../';

interface ClinicData {
  name: string;
  // Add other clinic data fields as needed
}

export const useClinicData = () => {
  const { user } = useAuth();
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const { db } = initializeFirebase();

  useEffect(() => {
    if (user) {
      const clinicDocRef = doc(db, 'clinics', user.uid);

      getDoc(clinicDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            setClinicData(docSnap.data() as ClinicData);
          } else {
            console.log('No such clinic document!');
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching clinic data:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user, db]);

  return { clinicData, loading };
};
