'use client';

import {
  OrganizationStructuredData,
  WebsiteStructuredData,
  GovernmentServiceStructuredData,
  FAQStructuredData,
} from '@/src/components/seo/StructuredData';
import { useTenant } from '@/components/providers/TenantProvider';
import { MunicipioLanding } from '@/components/landing/MunicipioLanding';
import { DigiurbanLanding } from '@/components/landing/DigiurbanLanding';

export default function LandingPage() {
  const { config } = useTenant();

  // Subdomínio de município (host resolveu slug != 'default') → landing
  // white-label da prefeitura. Domínio raiz → landing institucional DigiUrban.
  if (config.slug && config.slug !== 'default') {
    return <MunicipioLanding />;
  }

  return (
    <>
      {/* Structured Data - Schema.org JSON-LD */}
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      <GovernmentServiceStructuredData />
      <FAQStructuredData />
      <DigiurbanLanding />
    </>
  );
}
