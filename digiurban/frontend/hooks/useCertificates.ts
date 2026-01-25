'use client';

import { useState, useEffect } from 'react';

export interface DigitalCertificate {
  id: string;
  userId?: string;
  citizenId?: string;
  type: 'ADMIN' | 'CITIZEN' | 'SERVER' | 'SYSTEM';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  commonName: string;
  email: string;
  organization: string;
  department?: string;
  serialNumber: string;
  thumbprint: string;
  issuedAt: string;
  expiresAt: string;
  publicKey: string;
  privateKeyHash: string;
  _count?: {
    signatures: number;
  };
}

interface UseCertificatesOptions {
  userType: 'admin' | 'citizen';
  autoFetch?: boolean;
}

export function useCertificates({ userType, autoFetch = true }: UseCertificatesOptions) {
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = userType === 'admin'
        ? '/api/admin/my-certificates'
        : '/api/citizen/my-certificates';

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCertificates(data.certificates || []);
      } else {
        throw new Error(data.message || 'Erro ao buscar certificados');
      }
    } catch (err: any) {
      console.error('Erro ao buscar certificados:', err);
      setError(err.message || 'Erro ao buscar certificados');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCertificates();
    }
  }, [userType, autoFetch]);

  // Filtrar apenas certificados ativos e não expirados
  const activeCertificates = certificates.filter(
    cert => cert.status === 'ACTIVE' && new Date(cert.expiresAt) > new Date()
  );

  return {
    certificates,
    activeCertificates,
    loading,
    error,
    refetch: fetchCertificates,
  };
}
