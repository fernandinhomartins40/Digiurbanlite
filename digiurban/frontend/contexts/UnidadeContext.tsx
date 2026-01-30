'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  cnes?: string;
}

interface UnidadeContextType {
  unidadeSelecionada: Unidade | null;
  unidades: Unidade[];
  loading: boolean;
  selecionarUnidade: (unidade: Unidade) => void;
  recarregarUnidades: () => Promise<void>;
}

const UnidadeContext = createContext<UnidadeContextType | undefined>(undefined);

export function UnidadeProvider({ children }: { children: ReactNode }) {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar unidades ao montar
  useEffect(() => {
    carregarUnidades();
  }, []);

  // Carregar unidade salva do localStorage
  useEffect(() => {
    if (unidades.length > 0 && !unidadeSelecionada) {
      const unidadeSalva = localStorage.getItem('unidade_atendimento_id');

      if (unidadeSalva) {
        const unidade = unidades.find(u => u.id === unidadeSalva);
        if (unidade) {
          setUnidadeSelecionada(unidade);
          return;
        }
      }

      // Se não tem salva, seleciona a primeira
      if (unidades[0]) {
        setUnidadeSelecionada(unidades[0]);
        localStorage.setItem('unidade_atendimento_id', unidades[0].id);
      }
    }
  }, [unidades, unidadeSelecionada]);

  const carregarUnidades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/unidades?isActive=true', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUnidades(data);
      } else {
        console.error('Erro ao carregar unidades');
        setUnidades([]);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      setUnidades([]);
    } finally {
      setLoading(false);
    }
  };

  const selecionarUnidade = (unidade: Unidade) => {
    setUnidadeSelecionada(unidade);
    localStorage.setItem('unidade_atendimento_id', unidade.id);

    // Disparar evento customizado para notificar outras partes da aplicação
    window.dispatchEvent(new CustomEvent('unidade-changed', { detail: unidade }));
  };

  const recarregarUnidades = async () => {
    await carregarUnidades();
  };

  return (
    <UnidadeContext.Provider
      value={{
        unidadeSelecionada,
        unidades,
        loading,
        selecionarUnidade,
        recarregarUnidades,
      }}
    >
      {children}
    </UnidadeContext.Provider>
  );
}

export function useUnidade() {
  const context = useContext(UnidadeContext);
  if (context === undefined) {
    throw new Error('useUnidade must be used within a UnidadeProvider');
  }
  return context;
}
