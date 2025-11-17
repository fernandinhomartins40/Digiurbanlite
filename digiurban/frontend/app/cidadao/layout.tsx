'use client';

import { CitizenAuthProvider } from '@/contexts/CitizenAuthContext';

export default function CidadaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CitizenAuthProvider>
      {children}
    </CitizenAuthProvider>
  );
}