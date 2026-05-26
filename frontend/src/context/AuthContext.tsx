'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { setApiAccessToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialResolved = false;

    const applySession = (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setApiAccessToken(nextSession?.access_token ?? null, nextSession?.expires_at);
    };

    const finishInitialLoad = () => {
      if (!initialResolved) {
        initialResolved = true;
        setLoading(false);
      }
    };

    // INITIAL_SESSION uses the cached session immediately; avoid blocking on getSession()
    // which may wait for a refresh-token round trip to Supabase Auth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);

      if (event === 'INITIAL_SESSION') {
        finishInitialLoad();
      }
    });

    const fallbackTimer = window.setTimeout(async () => {
      if (initialResolved) return;
      try {
        const { data: { session: fallbackSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Auth session fallback error:', error.message);
          if (
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('Refresh Token Not Found')
          ) {
            await supabase.auth.signOut();
          }
        }
        applySession(fallbackSession);
      } catch (e) {
        console.error('Unexpected auth fallback error:', e);
      } finally {
        finishInitialLoad();
      }
    }, 2500);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setApiAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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
