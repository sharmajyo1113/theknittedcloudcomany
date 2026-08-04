'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const NOT_CONFIGURED_ERROR = new Error(
  'Sign-in is not set up yet — Firebase Auth credentials have not been configured for this site.'
);

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    async signIn(email, password) {
      if (!auth) throw NOT_CONFIGURED_ERROR;
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(name, email, password) {
      if (!auth) throw NOT_CONFIGURED_ERROR;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
    },
    async signOut() {
      if (!auth) return;
      await firebaseSignOut(auth);
    },
    async getToken() {
      return auth?.currentUser ? auth.currentUser.getIdToken() : null;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
