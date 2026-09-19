import React, { type PropsWithChildren } from "react";
import { useRouter } from "expo-router";

import { Button, Screen, State } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import { decideAccess } from "@/lib/rbac";
import type { UserRole } from "@/types/auth";

/**
 * UI-level gate only — a convenience so screens don't render content the
 * user isn't meant to see. It is NOT the security boundary: the database
 * (RLS + the service_requests update trigger) is what actually enforces who
 * can read or write what, regardless of what this component renders.
 */
export function RequireAuth({ children }: PropsWithChildren) {
  const { isLoading, session } = useAuth();
  const router = useRouter();
  const decision = decideAccess({ isLoading, hasSession: !!session, role: null });

  if (decision === "loading") {
    return (
      <Screen width="narrow">
        <State loading title="Yükleniyor…" />
      </Screen>
    );
  }

  if (decision === "signed-out") {
    return (
      <Screen width="narrow">
        <State title="Devam etmek için giriş yapmalısınız." />
        <Button title="Giriş yap" onPress={() => router.push("/sign-in")} />
      </Screen>
    );
  }

  return <>{children}</>;
}

export function RequireRole({
  role: requiredRole,
  children,
}: PropsWithChildren<{ role: UserRole }>) {
  const { isLoading, session, role } = useAuth();
  const router = useRouter();
  const decision = decideAccess({
    isLoading,
    hasSession: !!session,
    role,
    requiredRole,
  });

  if (decision === "loading") {
    return (
      <Screen width="narrow">
        <State loading title="Yükleniyor…" />
      </Screen>
    );
  }

  if (decision === "signed-out") {
    return (
      <Screen width="narrow">
        <State title="Devam etmek için giriş yapmalısınız." />
        <Button title="Giriş yap" onPress={() => router.push("/sign-in")} />
      </Screen>
    );
  }

  if (decision === "forbidden") {
    return (
      <Screen width="narrow">
        <State title="Bu sayfaya erişim yetkiniz yok." />
        <Button title="Ana sayfaya dön" secondary onPress={() => router.push("/")} />
      </Screen>
    );
  }

  return <>{children}</>;
}
