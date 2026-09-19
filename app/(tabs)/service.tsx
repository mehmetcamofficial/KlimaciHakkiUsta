import React from 'react';

import { ServiceRequestForm } from '@/components/service-request-form';

// The "Servis" tab keeps working as a direct shortcut to the Klima request
// flow (backward compatibility with the original prototype). The full
// marketplace flow (Ana Sayfa -> kategori -> hizmet tipi) opens the same
// shared form at /request/new with a different category/service type.
export default function ServiceScreen() {
  return <ServiceRequestForm categorySlug="klima" serviceTypeSlug="klima-arizasi" />;
}
