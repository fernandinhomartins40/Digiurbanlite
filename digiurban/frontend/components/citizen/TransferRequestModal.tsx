'use client';

import { useState, useEffect } from 'react';
import { X, Search, AlertCircle, CheckCircle2, Loader2, MapPin, Upload, FileText } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';

interface Municipality {
  id: string;
  name: string;
  nomeMunicipio: string;
  ufMunicipio: string;
  codigoIbge?: string;
}

interface TransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransferRequestModal({ isOpen, onClose }: TransferRequestModalProps) {
  const { tenant, apiRequest } = useCitizenAuth();
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<Municipality[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar municípios disponíveis ao abrir modal
  useEffect(() => {
    if (isOpen) {
      fetchMunicipalities();
    }
  }, [isOpen]);

  // Filtrar municípios baseado na busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMunicipalities(municipalities);
    } else {
      const filtered = municipalities.filter(
        (m) =>
          m.nomeMunicipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.ufMunicipio.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMunicipalities(filtered);
    }
  }, [searchTerm, municipalities]);

  const fetchMunicipalities = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/citizen/municipalities/active');
      // Filtrar município atual
      const filtered = data.municipalities.filter((m: Municipality) => m.id !== tenant?.id);
      setMunicipalities(filtered);
      setFilteredMunicipalities(filtered);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar municípios');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMunicipality = (municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!selectedMunicipality || reason.trim().length < 20) {
      setError('Por favor, forneça uma justificativa com pelo menos 20 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiRequest('/citizen/transfer-request', {
        method: 'POST',
        body: JSON.stringify({
          toTenantId: selectedMunicipality.id,
          reason: reason.trim(),
        }),
      });

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedMunicipality(null);
    setReason('');
    setSearchTerm('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Solicitar Transferência de Município
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Município atual: <span className="font-medium">{tenant?.nomeMunicipio || tenant?.name} - {tenant?.ufMunicipio}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' && (
            <div className="space-y-4">
              {/* Alerta Informativo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Importante:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>A transferência precisa ser aprovada pelo novo município</li>
                      <li>Tempo médio de análise: 2-5 dias úteis</li>
                      <li>Você será notificado sobre o status da solicitação</li>
                      <li>Após aprovação, seus dados serão transferidos automaticamente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar município ou UF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Lista de municípios */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredMunicipalities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum município encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredMunicipalities.map((municipality) => (
                    <button
                      key={municipality.id}
                      onClick={() => handleSelectMunicipality(municipality)}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{municipality.nomeMunicipio}</p>
                          <p className="text-sm text-gray-500">{municipality.ufMunicipio}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">Selecionar</div>
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && selectedMunicipality && (
            <div className="space-y-6">
              {/* Município selecionado */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Município de destino:</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {selectedMunicipality.nomeMunicipio}
                    </p>
                    <p className="text-gray-600">{selectedMunicipality.ufMunicipio}</p>
                  </div>
                </div>
              </div>

              {/* Justificativa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justificativa da transferência *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explique o motivo da solicitação de transferência (ex: mudança de endereço, trabalho, etc.)"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo de 20 caracteres ({reason.length}/20)
                </p>
              </div>

              {/* Alertas */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-2">Antes de enviar:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Certifique-se de que realmente se mudou para o novo município</li>
                      <li>Tenha em mãos um comprovante de residência atualizado</li>
                      <li>Após a aprovação, você perderá acesso ao município atual</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Solicitação Enviada com Sucesso!
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Sua solicitação de transferência para <strong>{selectedMunicipality?.nomeMunicipio} - {selectedMunicipality?.ufMunicipio}</strong> foi enviada
                e está aguardando análise do município de destino.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Próximos passos:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700 list-disc list-inside">
                  <li>Aguarde a análise (2-5 dias úteis)</li>
                  <li>Você será notificado por email</li>
                  <li>Acompanhe o status em "Meu Perfil"</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            {step === 'confirm' && (
              <button
                onClick={() => setStep('select')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Voltar
              </button>
            )}
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            {step === 'confirm' && (
              <button
                onClick={handleSubmit}
                disabled={loading || reason.trim().length < 20}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </button>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="flex items-center justify-center gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
