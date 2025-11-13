'use client';

import { useParams } from 'next/navigation';
import { DynamicModuleView } from '@/components/core/DynamicModuleView';

/**
 * 🎯 ROTA CATCH-ALL DINÂMICA PARA TODOS OS MÓDULOS
 *
 * Esta página única substitui 91 arquivos hardcoded de módulos.
 * Funciona para TODAS as secretarias e TODOS os módulos automaticamente.
 *
 * Exemplos de rotas suportadas:
 * - /admin/secretarias/agricultura/cadastro-produtor
 * - /admin/secretarias/saude/agendamento-consultas
 * - /admin/secretarias/educacao/matriculas
 *
 * O DynamicModuleView busca o service do backend via:
 * GET /api/services/:department/:module
 *
 * E renderiza automaticamente:
 * - Tabela com colunas do formSchema
 * - Modal de criar protocolo com DynamicForm
 * - Modal de detalhes com ApprovalActions
 * - Features condicionais (calendário, mapa, documentos)
 */
export default function ModulePage() {
  const params = useParams();

  return (
    <DynamicModuleView
      department={params.department as string}
      module={params.module as string}
    />
  );
}
