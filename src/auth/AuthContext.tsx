import type {Session, User} from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {supabase} from '../lib/supabase';
import type {Profile, Role} from '../types';

interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  ackVersion: number;
  ackAt: string;
}

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{needsVerification: boolean}>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export function AuthProvider({children}: {children: ReactNode}) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string | null) => {
    if (!userId) {
      setProfile(null);
      setProfileUserId(null);
      return;
    }
    try {
      const row = await fetchProfile(userId);
      setProfile(row);
      setProfileUserId(userId);
    } catch {
      setProfile(null);
      setProfileUserId(userId);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({data}) => {
        if (!active) return;
        setSession(data.session);
        await loadProfile(data.session?.user.id ?? null);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const uid = nextSession?.user.id ?? null;
      if (uid !== profileUserId) {
        void loadProfile(uid);
      } else if (!uid) {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, profileUserId]);

  const signIn = useCallback(async (email: string, password: string) => {
    const {error} = await supabase.auth.signInWithPassword({email, password});
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const {data, error} = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
          full_name: input.fullName,
          ack_version: String(input.ackVersion),
          ack_at: input.ackAt,
          user_agent: navigator.userAgent.slice(0, 500),
        },
      },
    });
    if (error) throw error;
    return {needsVerification: data.session === null};
  }, []);

  const signOut = useCallback(async () => {
    const {error} = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
    setProfileUserId(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id ?? null);
  }, [loadProfile, session?.user.id]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return {
      loading,
      session,
      user,
      profile,
      role: profile?.role ?? null,
      isAuthenticated: session !== null,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    };
  }, [loading, session, profile, signIn, signUp, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
