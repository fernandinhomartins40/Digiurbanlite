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
  // Formatadores
  const formatValue = (key: string, value: any): string => {
    if (!value) return '-';

    // Data
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('data')) {
      try {
        return new Date(value).toLocaleDateString('pt-BR');
      } catch {
        return value;
      }
    }

    // Horário
    if (key.toLowerCase().includes('time') || key.toLowerCase().includes('hora')) {
      return value;
    }

    // Objeto com address
    if (typeof value === 'object' && value.formattedAddress) {
      return value.formattedAddress;
    }

    // Array
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    // Objeto genérico
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Formata label
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
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-3">
        {fields.map(([key, value]) => (
          <div key={key} className="flex justify-between items-start border-b border-gray-100 pb-2">
            <span className="text-sm font-medium text-gray-600 capitalize">
              {formatLabel(key)}:
            </span>
            <span className="text-sm text-gray-900 font-semibold text-right ml-4">
              {formatValue(key, value)}
            </span>
          </div>
        ))}

        {/* Attachments indicator */}
        {data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0 && (
          <div className="flex justify-between items-start border-b border-gray-100 pb-2">
            <span className="text-sm font-medium text-gray-600">Anexos:</span>
            <span className="text-sm text-gray-900 font-semibold">
              {data.attachments.length} arquivo(s)
            </span>
          </div>
        )}

        {/* Document indicator */}
        {data.document && (
          <div className="flex justify-between items-start border-b border-gray-100 pb-2">
            <span className="text-sm font-medium text-gray-600">Documento:</span>
            <span className="text-sm text-gray-900 font-semibold">
              {data.document.fileName || '1 arquivo'}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <XCircle className="w-4 h-4" />
            Cancelar
          </button>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
        )}

        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Confirmar
        </button>
      </div>
    </div>
  );
}

export default ConfirmationCard;
