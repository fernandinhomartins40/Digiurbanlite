/**
 * ============================================================================
 * HOOK: useModuleExport
 * ============================================================================
 *
 * Hook para exportação de dados do módulo em diversos formatos
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ExportFormat = 'xlsx' | 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  selectedFields?: string[];
  filterStatus?: string;
  includeStats?: boolean;
}

export function useModuleExport(protocols: any[], service: any) {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Formata valor para exportação
   */
  const formatValue = useCallback((value: any, field: any): string => {
    if (value === null || value === undefined) return '';

    if (field?.type === 'boolean') {
      return value ? 'Sim' : 'Não';
    }

    if (field?.format === 'date' || field?.format === 'date-time') {
      try {
        return format(
          new Date(value),
          field.format === 'date-time' ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy',
          { locale: ptBR }
        );
      } catch {
        return String(value);
      }
    }

    if (field?.enum && field?.enumNames) {
      const index = field.enum.indexOf(value);
      return field.enumNames[index] || String(value);
    }

    return String(value);
  }, []);

  /**
   * Prepara dados para exportação
   */
  const prepareData = useCallback((options: ExportOptions) => {
    const schema = service?.formSchema;
    const selectedFields = options.selectedFields || Object.keys(schema?.properties || {});

    return protocols.map(protocol => {
      const row: Record<string, any> = {
        'Número do Protocolo': protocol.number || protocol.protocolNumber,
        'Status': protocol.status,
        'Data de Criação': format(new Date(protocol.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      };

      // Adicionar campos selecionados
      selectedFields.forEach(fieldKey => {
        const fieldSchema = schema?.properties?.[fieldKey];
        const fieldLabel = fieldSchema?.title || fieldKey;
        const fieldValue = protocol.customData?.[fieldKey];

        row[fieldLabel] = formatValue(fieldValue, fieldSchema);
      });

      // Adicionar campos extras
      if (protocol.citizen) {
        row['Cidadão'] = protocol.citizen.name;
        row['CPF do Cidadão'] = protocol.citizen.cpf;
      }

      return row;
    });
  }, [protocols, service, formatValue]);

  /**
   * Exportar para Excel (XLSX)
   */
  const exportToExcel = useCallback(async (options: ExportOptions) => {
    try {
      setIsExporting(true);

      const data = prepareData(options);

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajustar largura das colunas
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;

      // Adicionar worksheet
      XLSX.utils.book_append_sheet(wb, ws, 'Protocolos');

      // Gerar arquivo
      const fileName = `${service.name} - ${format(new Date(), 'dd-MM-yyyy HHmm', { locale: ptBR })}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Arquivo Excel gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast.error('Erro ao gerar arquivo Excel');
    } finally {
      setIsExporting(false);
    }
  }, [prepareData, service]);

  /**
   * Exportar para CSV
   */
  const exportToCSV = useCallback(async (options: ExportOptions) => {
    try {
      setIsExporting(true);

      const data = prepareData(options);

      // Converter para CSV
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);

      // Criar blob e download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${service.name} - ${format(new Date(), 'dd-MM-yyyy HHmm', { locale: ptBR })}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Arquivo CSV gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
      toast.error('Erro ao gerar arquivo CSV');
    } finally {
      setIsExporting(false);
    }
  }, [prepareData, service]);

  /**
   * Exportar para JSON
   */
  const exportToJSON = useCallback(async (options: ExportOptions) => {
    try {
      setIsExporting(true);

      const data = protocols.map(p => ({
        id: p.id,
        number: p.number || p.protocolNumber,
        status: p.status,
        createdAt: p.createdAt,
        customData: p.customData,
        citizen: p.citizen ? {
          id: p.citizen.id,
          name: p.citizen.name,
          cpf: p.citizen.cpf,
          email: p.citizen.email
        } : null
      }));

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${service.name} - ${format(new Date(), 'dd-MM-yyyy HHmm', { locale: ptBR })}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Arquivo JSON gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para JSON:', error);
      toast.error('Erro ao gerar arquivo JSON');
    } finally {
      setIsExporting(false);
    }
  }, [protocols, service]);

  /**
   * Função principal de exportação
   */
  const exportData = useCallback(async (options: ExportOptions) => {
    switch (options.format) {
      case 'xlsx':
        await exportToExcel(options);
        break;
      case 'csv':
        await exportToCSV(options);
        break;
      case 'json':
        await exportToJSON(options);
        break;
      default:
        toast.error('Formato de exportação não suportado');
    }
  }, [exportToExcel, exportToCSV, exportToJSON]);

  return {
    exportData,
    isExporting,
  };
}
