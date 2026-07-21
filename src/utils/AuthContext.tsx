import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  name: string;
  email: string;
  country: string;
  avatar_text: string;
  avatar_url: string;
  bio: string;
  favorite_movie: string;
  contact: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; user?: User }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      const { data: { user } } = await supabase.auth.getUser();
      const userMeta = user?.user_metadata || {};
      setProfile({
        ...data,
        bio: userMeta.bio || '',
        favorite_movie: userMeta.favorite_movie || '',
        contact: userMeta.contact || '',
        avatar_url: userMeta.avatar_url || '',
      } as Profile);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
        await fetchProfile(existingSession.user.id);
      }
      setLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: undefined,
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Registration failed. Please try again.' };

    // Create profile row immediately (upsert to handle trigger race)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      country: 'Global',
      role: 'user',
    });
    if (profileError) {
      console.warn('Profile creation warning:', profileError.message);
    }

    // Fetch the profile so it's available immediately
    await fetchProfile(data.user.id);

    return { user: data.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.avatar_text !== undefined) dbUpdates.avatar_text = updates.avatar_text;
      dbUpdates.updated_at = new Date().toISOString();

      if (Object.keys(dbUpdates).length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id)
          .select('*')
          .single();
        if (error) return { error: error.message };
        if (data) {
          const userMeta = (await supabase.auth.getUser()).data.user?.user_metadata || {};
          setProfile({
            ...data,
            bio: updates.bio ?? userMeta.bio ?? '',
            favorite_movie: updates.favorite_movie ?? userMeta.favorite_movie ?? '',
            contact: updates.contact ?? userMeta.contact ?? '',
            avatar_url: userMeta.avatar_url ?? '',
          });
        }
      }

      // Store extra fields in auth user_metadata
      const metaUpdates: any = {};
      if (updates.bio !== undefined) metaUpdates.bio = updates.bio;
      if (updates.favorite_movie !== undefined) metaUpdates.favorite_movie = updates.favorite_movie;
      if (updates.contact !== undefined) metaUpdates.contact = updates.contact;
      if (Object.keys(metaUpdates).length > 0) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const existing = currentUser?.user_metadata || {};
        await supabase.auth.updateUser({
          data: { ...existing, ...metaUpdates }
        });
      }

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
