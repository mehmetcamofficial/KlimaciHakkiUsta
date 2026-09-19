import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { mapAuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/services/profiles";
import type { Profile, UserRole } from "@/types/auth";

interface SignUpResult {
  error: string | null;
  needsEmailConfirmation: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  /** True only while the initial session is being restored on app start. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Guards against a stale profile fetch (for a since-signed-out or
  // since-switched user) overwriting the current state after it resolves.
  const profileRequestId = useRef(0);

  async function loadProfile(userId: string) {
    const requestId = ++profileRequestId.current;
    try {
      const result = await fetchProfile(userId);
      if (profileRequestId.current === requestId) setProfile(result);
    } catch {
      if (profileRequestId.current === requestId) setProfile(null);
    }
  }

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        void loadProfile(data.session.user.id).finally(() => {
          if (active) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        if (nextSession) {
          void loadProfile(nextSession.user.id);
        } else {
          profileRequestId.current++;
          setProfile(null);
        }
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      isLoading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { error: error ? mapAuthError(error) : null };
      },
      async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          // full_name is not privileged — the server-side trigger that
          // creates the profile always hardcodes role="customer" and never
          // reads a role from this metadata (see supabase/migrations).
          options: fullName?.trim() ? { data: { full_name: fullName.trim() } } : undefined,
        });
        if (error) {
          return { error: mapAuthError(error), needsEmailConfirmation: false };
        }
        return { error: null, needsEmailConfirmation: !data.session };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async refreshProfile() {
        if (session?.user.id) await loadProfile(session.user.id);
      },
    }),
    [session, profile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
