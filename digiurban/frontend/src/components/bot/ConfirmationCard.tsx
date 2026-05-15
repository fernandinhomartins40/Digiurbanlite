'use client';

import React from 'react';
import { CheckCircle, Edit, XCircle } from 'lucide-react';

interface ConfirmationCardProps {
  data: Record<string, any>;
  onConfirm: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  title?: string;
}

export function ConfirmationCard({
  data,
  onConfirm,
  onEdit,
  onCancel,
  title = 'Confirme os dados',
}: ConfirmationCardProps) {
  const formatValue = (key: string, value: any): string => {
    if (!value) return '-';
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('data')) {
      try { return new Date(value).toLocaleDateString('pt-BR'); } catch { return value; }
    }
    if (typeof value === 'object' && value.formattedAddress) return value.formattedAddress;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatLabel = (key: string): string => {
    const labels: Record<string, string> = {
      specialty: 'Especialidade',
      healthUnitId: 'Unidade de Saúde',
      appointmentDate: 'Data',
      appointmentTime: 'Horário',
      serviceId: 'Serviço',
      location: 'Localização',
      description: 'Descrição',
      documentType: 'Tipo de Documento',
      notes: 'Observações',
      phone: 'Telefone',
      address: 'Endereço',
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  };

  const fields = Object.entries(data).filter(
    ([key]) => !key.startsWith('_') && key !== 'attachments' && key !== 'document'
  );

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
        <h3 className="text-sm font-semibold text-white break-words">{title}</h3>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        {fields.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-0.5 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              {formatLabel(key)}
            </span>
            <span className="text-sm text-gray-900 font-medium break-words [overflow-wrap:anywhere]">
              {formatValue(key, value)}
            </span>
          </div>
        ))}

        {data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0 && (
          <div className="flex flex-col gap-0.5 border-b border-gray-100 pb-2">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Anexos</span>
            <span className="text-sm text-gray-900 font-medium">{data.attachments.length} arquivo(s)</span>
          </div>
        )}

        {data.document && (
          <div className="flex flex-col gap-0.5 border-b border-gray-100 pb-2">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Documento</span>
            <span className="text-sm text-gray-900 font-medium break-all">
              {data.document.fileName || '1 arquivo'}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            Cancelar
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            <Edit className="w-4 h-4 shrink-0" />
            Editar
          </button>
        )}
        <button
          onClick={onConfirm}
          className="min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm min-[380px]:col-span-2"
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          Confirmar
        </button>
      </div>
    </div>
  );
}

export default ConfirmationCard;
