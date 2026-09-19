import React from "react";
import { useLocalSearchParams } from "expo-router";

import { State } from "@/components/ui/marketplace";
import { PlaceholderModule } from "@/components/admin/admin-ui";
import { adminModuleLabel } from "@/lib/admin";

/**
 * Catch-all for every sidebar item that isn't built yet (see
 * lib/admin.ts's ADMIN_NAV_ITEMS `implemented: false` entries). Literal
 * sibling routes (requests/, operations.tsx) take precedence over this
 * dynamic segment, so this only ever matches planned-but-unbuilt modules.
 */
export default function AdminModulePlaceholder() {
  const { module } = useLocalSearchParams<{ module: string }>();
  const label = adminModuleLabel(module);

  if (!label) {
    return <State title="Sayfa bulunamadı." />;
  }

  return <PlaceholderModule title={label} />;
}
