import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import * as Linking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";

import { mapAuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/services/profiles";
import type { Profile, UserRole } from "@/types/auth";

interface SignUpResult {
  error: string | null;
  needsEmailConfirmation: boolean;
}

/**
 * Both signup confirmation and password recovery emails redirect here.
 * expo-linking builds the right URL for the current environment (the
 * `ustayanimda://` custom scheme in a dev client/standalone build, an
 * `exp://` proxy URL in Expo Go) instead of falling back to Supabase's
 * default Site URL (which is a web-oriented localhost address and is
 * exactly what produced the ERR_CONNECTION_REFUSED bug this fixes).
 */
const AUTH_CALLBACK_URL = Linking.createURL("/auth/callback");

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
  /** Sends a password-recovery email pointing back at the app. */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Sets a new password for the currently active (recovery) session. */
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  /**
   * Establishes a session from the tokens found in an auth callback deep
   * link (app/auth/callback.tsx). Centralized here, like every other
   * `supabase.auth.*` call, rather than letting the screen touch the
   * client directly.
   */
  establishSessionFromTokens: (
    accessToken: string,
    refreshToken: string,
  ) => Promise<{ error: string | null }>;
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
          options: {
            emailRedirectTo: AUTH_CALLBACK_URL,
            // full_name is not privileged — the server-side trigger that
            // creates the profile always hardcodes role="customer" and
            // never reads a role from this metadata (see
            // supabase/migrations).
            ...(fullName?.trim() ? { data: { full_name: fullName.trim() } } : {}),
          },
        });
        if (error) {
          return { error: mapAuthError(error), needsEmailConfirmation: false };
        }
        return { error: null, needsEmailConfirmation: !data.session };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async requestPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: AUTH_CALLBACK_URL,
        });
        return { error: error ? mapAuthError(error) : null };
      },
      async updatePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error ? mapAuthError(error) : null };
      },
      async establishSessionFromTokens(accessToken, refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return { error: error ? mapAuthError(error) : null };
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
