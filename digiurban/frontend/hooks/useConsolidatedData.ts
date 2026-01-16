/**
 * Hook para buscar e processar dados consolidados
 * Filtra apenas protocolos CONCLUÍDOS e transforma em registros consultáveis
 */

import { useMemo, useState } from 'react';
import {
  type ConsolidatedRecord,
  type ConsolidatedModeConfig,
  protocolToConsolidatedRecord,
  calculateConsolidatedStats,
} from '@/lib/consolidated-data-intelligence';

interface UseConsolidatedDataProps {
  protocols: any[];
  config: ConsolidatedModeConfig;
}

export function useConsolidatedData({ protocols, config }: UseConsolidatedDataProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 1. Filtrar apenas protocolos CONCLUÍDOS
  const concludedProtocols = useMemo(() => {
    return protocols.filter(p => p.status === 'CONCLUIDO');
  }, [protocols]);

  // 2. Converter para registros consolidados
  const allRecords = useMemo(() => {
    return concludedProtocols.map(p => protocolToConsolidatedRecord(p, config));
  }, [concludedProtocols, config]);

  // 3. Aplicar filtros
  const filteredRecords = useMemo(() => {
    let filtered = allRecords;

    // Filtro de status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filtro de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        // Buscar no nome do cidadão
        if (r.citizenName.toLowerCase().includes(term)) return true;

        // Buscar no CPF
        if (r.citizenCpf?.toLowerCase().includes(term)) return true;

        // Buscar no número do protocolo
        if (r.protocolNumber.toLowerCase().includes(term)) return true;

        // Buscar no campo principal
        const keyValue = r.data[config.keyField];
        if (keyValue && String(keyValue).toLowerCase().includes(term)) return true;

        // Buscar nos campos secundários
        for (const field of config.secondaryFields) {
          const value = r.data[field];
          if (value && String(value).toLowerCase().includes(term)) return true;
        }

        return false;
      });
    }

    return filtered;
  }, [allRecords, searchTerm, statusFilter, config]);

  // 4. Calcular estatísticas
  const stats = useMemo(() => {
    return calculateConsolidatedStats(allRecords);
  }, [allRecords]);

  // 5. Funções de ação
  const actions = {
    handleViewProtocol: (record: ConsolidatedRecord) => {
      // Redireciona para página do protocolo
      window.location.href = `/admin/protocolos/${record.id}`;
    },

    handleExportCard: async (record: ConsolidatedRecord) => {
      // TODO: Implementar exportação de ficha individual (PDF)
      console.log('Exportar ficha:', record);
      alert('Funcionalidade de exportação será implementada em breve');
    },

    handleExportAll: async () => {
      // Exportar todos os registros para Excel
      const XLSX = await import('xlsx');

      const data = filteredRecords.map(r => ({
        'Protocolo': r.protocolNumber,
        'Cidadão': r.citizenName,
        'CPF': r.citizenCpf || '—',
        'Status': r.status,
        'Data Aprovação': new Date(r.approvedAt).toLocaleDateString('pt-BR'),
        ...Object.fromEntries(
          config.secondaryFields.map(field => [
            config.keyField === field ? 'Campo Principal' : field,
            r.data[field] || '—'
          ])
        ),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');

      const fileName = `${config.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    },

    handleExportAttendance: async () => {
      // TODO: Exportar lista de presença (PDF formatado)
      console.log('Exportar lista de presença');
      alert('Funcionalidade será implementada em breve');
    },

    handleSendBulkEmail: async (records: ConsolidatedRecord[]) => {
      // TODO: Enviar email em massa
      console.log('Enviar email para:', records);
      alert(`Enviar email para ${records.length} inscritos?`);
    },

    handleGenerateCertificates: async (records: ConsolidatedRecord[]) => {
      // TODO: Gerar certificados
      console.log('Gerar certificados para:', records);
      alert(`Gerar certificados para ${records.length} aprovados?`);
    },

    handleFilterStatus: (status: string) => {
      setStatusFilter(status);
    },

    handleExportMap: async () => {
      // TODO: Exportar mapa com marcadores
      console.log('Exportar mapa');
      alert('Funcionalidade será implementada em breve');
    },

    handleGenerateReport: async () => {
      // TODO: Gerar relatório consolidado
      console.log('Gerar relatório');
      alert('Funcionalidade será implementada em breve');
    },

    handleFilterExpiry: (filter: string) => {
      setStatusFilter(filter);
    },

    handleSendExpiryNotification: async (records: ConsolidatedRecord[]) => {
      // TODO: Enviar notificação de vencimento
      console.log('Notificar vencimento:', records);
      alert(`Notificar ${records.length} licenças próximas ao vencimento?`);
    },

    handleRenewLicense: async (record: ConsolidatedRecord) => {
      // TODO: Criar novo protocolo para renovação
      console.log('Renovar licença:', record);
      alert('Criar novo protocolo de renovação?');
    },

    handleExportCalendar: async () => {
      // TODO: Exportar agenda
      console.log('Exportar agenda');
      alert('Funcionalidade será implementada em breve');
    },

    handleSendReminder: async (records: ConsolidatedRecord[]) => {
      // TODO: Enviar lembrete de agendamento
      console.log('Enviar lembrete:', records);
      alert(`Enviar lembrete para ${records.length} agendamentos?`);
    },

    handleExport: async () => {
      // Exportação genérica
      await actions.handleExportAll();
    },
  };

  return {
    records: filteredRecords,
    allRecords,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    actions,
  };
}
