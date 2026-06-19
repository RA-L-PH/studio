
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from 'firebase/auth';
import { auth } from './';

// Define the function signature for signup and login
type AuthFunction = (email: string, password: string) => Promise<UserCredential>;
type LogoutFunction = () => Promise<void>;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: AuthFunction;
  login: AuthFunction;
  logout: LogoutFunction;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Correctly typed signup function
  const signup: AuthFunction = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Correctly typed login function
  const login: AuthFunction = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout: LogoutFunction = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
