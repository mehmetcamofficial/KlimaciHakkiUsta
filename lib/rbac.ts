import { USER_ROLES, type UserRole } from "@/types/auth";

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as string[]).includes(value);
}

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Müşteri",
  professional: "Profesyonel",
  admin: "Admin",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export type AccessDecision = "loading" | "signed-out" | "forbidden" | "ok";

/**
 * Pure route-access decision, kept separate from any component so it can be
 * unit tested without rendering. UI (auth-guard.tsx) only maps this result
 * to what to show — it never re-derives the decision itself.
 */
export function decideAccess(params: {
  isLoading: boolean;
  hasSession: boolean;
  role: UserRole | null;
  requiredRole?: UserRole;
}): AccessDecision {
  if (params.isLoading) return "loading";
  if (!params.hasSession) return "signed-out";
  if (params.requiredRole && params.role !== params.requiredRole) {
    return "forbidden";
  }
  return "ok";
}
