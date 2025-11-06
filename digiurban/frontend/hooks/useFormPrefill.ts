/**
 * ============================================================================
 * HOOK DE PRÉ-PREENCHIMENTO DE FORMULÁRIOS
 * ============================================================================
 *
 * Hook React customizado que automatiza o pré-preenchimento de formulários
 * de serviços com dados do cidadão autenticado.
 *
 * Features:
 * - Pré-preenchimento automático baseado nos dados do cidadão
 * - Detecção de campos preenchidos para feedback visual
 * - Validação de dados desatualizados
 * - Type-safe com TypeScript
 * - Integrado com CitizenAuthContext
 */

import { useState, useEffect, useMemo } from 'react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import {
  prefillFormData,
  getPrefilledFields,
  getPrefilledMessage,
  validatePrefilledData
} from '@/lib/form-prefill-mapper';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface UseFormPrefillOptions {
  fields: FormField[];
  onPrefillComplete?: (prefilledCount: number) => void;
  validateOnMount?: boolean;
}

interface UseFormPrefillReturn {
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  updateField: (fieldId: string, value: any) => void;
  prefilledFields: string[];
  prefilledCount: number;
  totalFields: number;
  prefilledMessage: string;
  isFieldPrefilled: (fieldId: string) => boolean;
  hasPrefilledData: boolean;
  isValid: boolean;
  outdatedFields: string[];
  refreshPrefill: () => void;
}

/**
 * Hook customizado para pré-preenchimento de formulários
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   updateField,
 *   prefilledMessage,
 *   isFieldPrefilled
 * } = useFormPrefill({
 *   fields: service.formSchema.fields
 * });
 * ```
 */
export function useFormPrefill(options: UseFormPrefillOptions): UseFormPrefillReturn {
  const { fields, onPrefillComplete, validateOnMount = true } = options;
  const { citizen } = useCitizenAuth();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar formulário com dados pré-preenchidos
  useEffect(() => {
    if (!fields || fields.length === 0) return;

    const initialData = prefillFormData(fields, citizen);
    setFormData(initialData);
    setIsInitialized(true);

    // Notificar callback sobre campos preenchidos
    if (onPrefillComplete) {
      const prefilled = getPrefilledFields(fields, initialData);
      onPrefillComplete(prefilled.length);
    }
  }, [fields, citizen?.id]); // Reexecutar se o cidadão mudar

  // Calcular campos pré-preenchidos (memoizado para performance)
  const prefilledFields = useMemo(() => {
    if (!isInitialized) return [];
    return getPrefilledFields(fields, formData);
  }, [formData, fields, isInitialized]);

  // Estatísticas de preenchimento
  const prefilledCount = prefilledFields.length;
  const totalFields = fields.length;
  const hasPrefilledData = prefilledCount > 0;

  // Mensagem de feedback
  const prefilledMessage = useMemo(() => {
    return getPrefilledMessage(prefilledCount, totalFields);
  }, [prefilledCount, totalFields]);

  // Validar dados pré-preenchidos
  const validation = useMemo(() => {
    if (!citizen || !isInitialized) {
      return { isValid: true, outdatedFields: [] };
    }

    if (validateOnMount) {
      return validatePrefilledData(formData, citizen);
    }

    return { isValid: true, outdatedFields: [] };
  }, [formData, citizen, validateOnMount, isInitialized]);

  // Função para atualizar campo individual
  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Verificar se campo foi pré-preenchido
  const isFieldPrefilled = (fieldId: string): boolean => {
    return prefilledFields.includes(fieldId);
  };

  // Função para recarregar pré-preenchimento (útil se dados do cidadão mudarem)
  const refreshPrefill = () => {
    const refreshedData = prefillFormData(fields, citizen);
    setFormData(refreshedData);
  };

  return {
    formData,
    setFormData,
    updateField,
    prefilledFields,
    prefilledCount,
    totalFields,
    prefilledMessage,
    isFieldPrefilled,
    hasPrefilledData,
    isValid: validation.isValid,
    outdatedFields: validation.outdatedFields,
    refreshPrefill
  };
}

/**
 * Hook simplificado para casos básicos
 * Retorna apenas formData e updateField
 */
export function useSimpleFormPrefill(fields: FormField[]) {
  const { formData, updateField } = useFormPrefill({ fields });
  return { formData, updateField };
}

/**
 * Hook para verificar se há dados desatualizados
 * Útil para mostrar avisos ao usuário
 */
export function useFormPrefillValidation(
  formData: Record<string, any>,
  citizen: any
): { hasOutdatedData: boolean; outdatedFields: string[] } {
  const validation = useMemo(() => {
    if (!citizen) {
      return { hasOutdatedData: false, outdatedFields: [] };
    }

    const result = validatePrefilledData(formData, citizen);

    return {
      hasOutdatedData: !result.isValid,
      outdatedFields: result.outdatedFields
    };
  }, [formData, citizen]);

  return validation;
}
