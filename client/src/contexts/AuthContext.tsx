import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  company: string;
  phone?: string;
  business_phone?: string;
  onboarding_complete: boolean;
  gmail_connected: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    setLoading(true);

    try {
      // 1. Create a promise that resolves after 1 second to prevent UI flashing
      const bufferTimeout = new Promise((resolve) => setTimeout(resolve, 1000));

      // 2. Start the Supabase fetch
      const fetchPromise = supabase
        .from('profiles')
        .select('*, onboarding_complete')
        .eq('id', userId)
        .single();

      // 3. Wait for BOTH the data and the 1-second timer to finish
      const [profileResponse] = await Promise.all([fetchPromise, bufferTimeout]);

      // Supabase returns PGRST116 if no rows are found (normal for new users before onboarding)
      if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileResponse.error);
      }

      if (profileResponse.data) {
        setProfile(profileResponse.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Unexpected error during profile fetch:', error);
    } finally {
      // CRITICAL SAFETY NET: This guarantees the loading screen drops no matter what happens
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false); // Stop loading if session check fails entirely
        return;
      }

      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false); // Stop loading if no user is found
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);

      // Ignore passive events like 'TOKEN_REFRESHED' that fire on tab switches.
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false); // Safety drop
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false); // CRITICAL: Stop loading when explicitly signed out
      } else {
        // Drop the loading state for any unhandled auth events
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        refreshProfile: () => fetchProfile(user?.id || ''),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
