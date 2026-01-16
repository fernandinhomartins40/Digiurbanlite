/**
 * ============================================================================
 * HOOK: useProtocolDataFields
 * ============================================================================
 *
 * Hook para gerenciar campos de dados de um protocolo
 * Conecta com o sistema de aprovação granular do backend
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface DataField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
  isRequired: boolean;
  fieldType: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CORRECTED';
  validatedBy: string | null;
  validatedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  version: number;
  previousValue: string | null;
}

export interface FieldsStats {
  total: number;
  required: number;
  optional: number;
  pending: number;
  approved: number;
  rejected: number;
  corrected: number;
  underReview: number;
  allRequiredApproved: boolean;
  percentageApproved: number;
}

export function useProtocolDataFields(protocolId: string) {
  const [fields, setFields] = useState<DataField[]>([]);
  const [stats, setStats] = useState<FieldsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/data-fields`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar campos: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setFields(data.data.fields || []);
        setStats(data.data.stats || null);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar campos:', err);
    } finally {
      setLoading(false);
    }
  }, [protocolId, backendUrl]);

  useEffect(() => {
    if (protocolId) {
      fetchFields();
    }
  }, [protocolId, fetchFields]);

  const approveField = useCallback(async (fieldId: string, comment?: string) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/data-fields/${fieldId}/approve`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ comment })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aprovar campo');
      }

      toast.success('Campo aprovado com sucesso!');
      await fetchFields();
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  }, [protocolId, backendUrl, fetchFields]);

  const rejectField = useCallback(async (fieldId: string, rejectionReason: string) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/data-fields/${fieldId}/reject`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ rejectionReason })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao rejeitar campo');
      }

      toast.success('Campo rejeitado');
      await fetchFields();
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  }, [protocolId, backendUrl, fetchFields]);

  const approveAllFields = useCallback(async () => {
    try {
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/data-fields/approve-all`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aprovar todos os campos');
      }

      const data = await response.json();
      toast.success(data.message || 'Campos aprovados com sucesso!');
      await fetchFields();
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  }, [protocolId, backendUrl, fetchFields]);

  return {
    fields,
    stats,
    loading,
    error,
    refetch: fetchFields,
    approveField,
    rejectField,
    approveAllFields,
  };
}
