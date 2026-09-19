import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ServiceRequestForm } from '@/components/service-request-form';

export default function NewRequestScreen() {
  const params = useLocalSearchParams<{ category?: string; type?: string }>();

  return (
    <>
      <Stack.Screen options={{ title: 'Talep Oluştur' }} />
      <ServiceRequestForm categorySlug={params.category} serviceTypeSlug={params.type} />
    </>
  );
}
