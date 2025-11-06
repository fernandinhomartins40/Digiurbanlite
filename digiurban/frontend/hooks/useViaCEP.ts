import { useState, useCallback } from 'react';
import axios from 'axios';

export interface ViaCEPAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressData {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

export function useViaCEP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByCEP = useCallback(async (cep: string): Promise<AddressData | null> => {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');

    // Valida o CEP
    if (cleanCEP.length !== 8) {
      setError('CEP deve conter 8 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<ViaCEPAddress>(
        `https://viacep.com.br/ws/${cleanCEP}/json/`,
        { timeout: 5000 }
      );

      if (response.data.erro) {
        setError('CEP não encontrado');
        return null;
      }

      return {
        zipCode: formatCEP(response.data.cep),
        street: response.data.logradouro,
        neighborhood: response.data.bairro,
        city: response.data.localidade,
        state: response.data.uf,
        complement: response.data.complemento
      };
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setError('Erro ao buscar CEP. Tente novamente.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByAddress = useCallback(async (
    state: string,
    city: string,
    street: string
  ): Promise<ViaCEPAddress[]> => {
    if (!state || !city || !street || street.length < 3) {
      setError('Preencha estado, cidade e pelo menos 3 caracteres do logradouro');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<ViaCEPAddress[]>(
        `https://viacep.com.br/ws/${state}/${city}/${street}/json/`,
        { timeout: 10000 }
      );

      if (!response.data || response.data.length === 0) {
        setError('Nenhum endereço encontrado');
        return [];
      }

      return response.data;
    } catch (err) {
      console.error('Erro ao buscar endereço:', err);
      setError('Erro ao buscar endereço. Tente novamente.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchByCEP,
    searchByAddress,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Função auxiliar para formatar CEP
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) return cep;
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Função auxiliar para validar CEP
export function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}
