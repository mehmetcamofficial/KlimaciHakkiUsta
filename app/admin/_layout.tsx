import { Slot } from "expo-router";

import { RequireRole } from "@/components/auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Every /admin/* route renders inside this: RequireRole is the UI-level
 * gate (the database's is_admin()-backed RLS is the actual security
 * boundary, unchanged by this phase), AdminShell is the persistent
 * sidebar/topbar chrome shared by every admin screen.
 */
export default function AdminLayout() {
  return (
    <RequireRole role="admin">
      <AdminShell>
        <Slot />
      </AdminShell>
    </RequireRole>
  );
}
