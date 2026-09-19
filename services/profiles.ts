import { supabase } from "@/lib/supabase";
import { isUserRole } from "@/lib/rbac";
import type { Profile } from "@/types/auth";

interface ProfileRow {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  avatar_path: string | null;
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    // A profile row's role always comes from the server (never from client
    // input), but if it's ever an unexpected value, fail closed to the
    // least-privileged role rather than trusting it.
    role: isUserRole(row.role) ? row.role : "customer",
    fullName: row.full_name,
    phone: row.phone,
    avatarPath: row.avatar_path,
  };
}

/**
 * Reads the given user's profile. RLS restricts this to the caller's own
 * row unless the caller is an admin; the explicit `.eq` below is a second,
 * client-side expression of that same ownership rule (see README/Phase 2
 * docs — both the query and RLS are expected to reflect ownership).
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, avatar_path")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfileRow(data) : null;
}

export async function updateOwnProfile(
  userId: string,
  changes: { fullName?: string | null; phone?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
      ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
