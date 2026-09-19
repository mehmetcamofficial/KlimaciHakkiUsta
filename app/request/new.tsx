import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";

import { RequireAuth } from "@/components/auth-guard";
import { ServiceRequestForm } from "@/components/service-request-form";

export default function NewRequestScreen() {
  const params = useLocalSearchParams<{ category?: string; type?: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Talep Oluştur" }} />
      <RequireAuth>
        <ServiceRequestForm
          categorySlug={params.category}
          serviceTypeSlug={params.type}
        />
      </RequireAuth>
    </>
  );
}
