'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { UnidadeSaudeSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

export default function ConfiguracoesAtendimentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [unidadeId, setUnidadeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('senhas');
  const [formData, setFormData] = useState({
    // Senhas e Filas
    senhaHabilitada: true,
    prefixoSenha: 'A',
    reiniciarSenhaDiariamente: true,
    tempoMedioAtendimento: 15,

    // Horários
    horarioAbertura: '07:00',
    horarioFechamento: '17:00',
    horarioAlmoco: '12:00-13:00',
    atendeSabado: false,
    atendeDomingo: false,

    // Triagem
    triagemObrigatoria: false,
    classificacaoRisco: true,
    sinaisVitais: true,

    // Agendamento
    agendamentoOnline: true,
    agendamentoMinDias: 1,
    agendamentoMaxDias: 30,
    cancelamentoMinHoras: 24,

    // Atendimento
    fichaAtendimentoObrigatoria: true,
    prescricaoObrigatoria: false,
    atestadoObrigatorio: false,

    // Notificações
    smsLembrete: true,
    smsAntecedencia: 24,
    emailConfirmacao: true,

    // Prioridades
    idosoIdadeMinima: 60,
    gestantePrioridade: true,
    deficientePrioridade: true,
    criancaIdadeMaxima: 12,
  });

  useEffect(() => {
    if (unidadeId) {
      fetchConfiguracao();
    }
  }, [unidadeId]);

  const fetchConfiguracao = async () => {
    if (!unidadeId) return;

    setLoadingData(true);
    try {
      const response = await fetch(`/api/apps/saude/cadastros/configuracoes?unidadeId=${unidadeId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setFormData({
            senhaHabilitada: data.senhaHabilitada ?? true,
            prefixoSenha: data.prefixoSenha || 'A',
            reiniciarSenhaDiariamente: data.reiniciarSenhaDiariamente ?? true,
            tempoMedioAtendimento: data.tempoMedioAtendimento || 15,
            horarioAbertura: data.horarioAbertura || '07:00',
            horarioFechamento: data.horarioFechamento || '17:00',
            horarioAlmoco: data.horarioAlmoco || '12:00-13:00',
            atendeSabado: data.atendeSabado ?? false,
            atendeDomingo: data.atendeDomingo ?? false,
            triagemObrigatoria: data.triagemObrigatoria ?? false,
            classificacaoRisco: data.classificacaoRisco ?? true,
            sinaisVitais: data.sinaisVitais ?? true,
            agendamentoOnline: data.agendamentoOnline ?? true,
            agendamentoMinDias: data.agendamentoMinDias || 1,
            agendamentoMaxDias: data.agendamentoMaxDias || 30,
            cancelamentoMinHoras: data.cancelamentoMinHoras || 24,
            fichaAtendimentoObrigatoria: data.fichaAtendimentoObrigatoria ?? true,
            prescricaoObrigatoria: data.prescricaoObrigatoria ?? false,
            atestadoObrigatorio: data.atestadoObrigatorio ?? false,
            smsLembrete: data.smsLembrete ?? true,
            smsAntecedencia: data.smsAntecedencia || 24,
            emailConfirmacao: data.emailConfirmacao ?? true,
            idosoIdadeMinima: data.idosoIdadeMinima || 60,
            gestantePrioridade: data.gestantePrioridade ?? true,
            deficientePrioridade: data.deficientePrioridade ?? true,
            criancaIdadeMaxima: data.criancaIdadeMaxima || 12,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unidadeId) {
      toast.error('Selecione uma unidade de saúde');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/apps/saude/cadastros/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          unidadeId,
          ...formData,
        }),
      });

      if (response.ok) {
        toast.success('Configuração salva com sucesso');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'senhas', label: 'Senhas e Filas' },
    { id: 'horarios', label: 'Horários' },
    { id: 'triagem', label: 'Triagem' },
    { id: 'agendamento', label: 'Agendamento' },
    { id: 'atendimento', label: 'Atendimento' },
    { id: 'notificacoes', label: 'Notificações' },
    { id: 'prioridades', label: 'Prioridades' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/apps/saude/cadastros')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configurações de Atendimento</h1>
          <p className="text-gray-600">Configurar parâmetros de atendimento por unidade</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Unidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2">Unidade de Saúde *</label>
            <UnidadeSaudeSelector
              value={unidadeId}
              onChange={(id) => setUnidadeId(id)}
            />
          </div>
        </CardContent>
      </Card>

      {unidadeId && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    onClick={() => setActiveTab(tab.id)}
                    className="whitespace-nowrap"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'senhas' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="senhaHabilitada"
                          checked={formData.senhaHabilitada}
                          onChange={(e) => setFormData({ ...formData, senhaHabilitada: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="senhaHabilitada">Habilitar sistema de senhas</label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Prefixo da senha</label>
                          <Input
                            value={formData.prefixoSenha}
                            onChange={(e) => setFormData({ ...formData, prefixoSenha: e.target.value })}
                            placeholder="A"
                            maxLength={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Tempo médio atendimento (min)</label>
                          <Input
                            type="number"
                            value={formData.tempoMedioAtendimento}
                            onChange={(e) => setFormData({ ...formData, tempoMedioAtendimento: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="reiniciarSenhaDiariamente"
                          checked={formData.reiniciarSenhaDiariamente}
                          onChange={(e) => setFormData({ ...formData, reiniciarSenhaDiariamente: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="reiniciarSenhaDiariamente">Reiniciar numeração diariamente</label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'horarios' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Horário de abertura</label>
                          <Input
                            type="time"
                            value={formData.horarioAbertura}
                            onChange={(e) => setFormData({ ...formData, horarioAbertura: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Horário de fechamento</label>
                          <Input
                            type="time"
                            value={formData.horarioFechamento}
                            onChange={(e) => setFormData({ ...formData, horarioFechamento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Horário de almoço</label>
                        <Input
                          value={formData.horarioAlmoco}
                          onChange={(e) => setFormData({ ...formData, horarioAlmoco: e.target.value })}
                          placeholder="12:00-13:00"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="atendeSabado"
                            checked={formData.atendeSabado}
                            onChange={(e) => setFormData({ ...formData, atendeSabado: e.target.checked })}
                            className="rounded"
                          />
                          <label htmlFor="atendeSabado">Atende aos sábados</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="atendeDomingo"
                            checked={formData.atendeDomingo}
                            onChange={(e) => setFormData({ ...formData, atendeDomingo: e.target.checked })}
                            className="rounded"
                          />
                          <label htmlFor="atendeDomingo">Atende aos domingos</label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'triagem' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="triagemObrigatoria"
                          checked={formData.triagemObrigatoria}
                          onChange={(e) => setFormData({ ...formData, triagemObrigatoria: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="triagemObrigatoria">Triagem obrigatória</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="classificacaoRisco"
                          checked={formData.classificacaoRisco}
                          onChange={(e) => setFormData({ ...formData, classificacaoRisco: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="classificacaoRisco">Usar classificação de risco</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sinaisVitais"
                          checked={formData.sinaisVitais}
                          onChange={(e) => setFormData({ ...formData, sinaisVitais: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="sinaisVitais">Coletar sinais vitais</label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'agendamento' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="agendamentoOnline"
                          checked={formData.agendamentoOnline}
                          onChange={(e) => setFormData({ ...formData, agendamentoOnline: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="agendamentoOnline">Permitir agendamento online</label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Agendamento mínimo (dias)</label>
                          <Input
                            type="number"
                            value={formData.agendamentoMinDias}
                            onChange={(e) => setFormData({ ...formData, agendamentoMinDias: parseInt(e.target.value) })}
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Agendamento máximo (dias)</label>
                          <Input
                            type="number"
                            value={formData.agendamentoMaxDias}
                            onChange={(e) => setFormData({ ...formData, agendamentoMaxDias: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Cancelamento mínimo (horas)</label>
                          <Input
                            type="number"
                            value={formData.cancelamentoMinHoras}
                            onChange={(e) => setFormData({ ...formData, cancelamentoMinHoras: parseInt(e.target.value) })}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'atendimento' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="fichaAtendimentoObrigatoria"
                          checked={formData.fichaAtendimentoObrigatoria}
                          onChange={(e) => setFormData({ ...formData, fichaAtendimentoObrigatoria: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="fichaAtendimentoObrigatoria">Ficha de atendimento obrigatória</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="prescricaoObrigatoria"
                          checked={formData.prescricaoObrigatoria}
                          onChange={(e) => setFormData({ ...formData, prescricaoObrigatoria: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="prescricaoObrigatoria">Prescrição obrigatória</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="atestadoObrigatorio"
                          checked={formData.atestadoObrigatorio}
                          onChange={(e) => setFormData({ ...formData, atestadoObrigatorio: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="atestadoObrigatorio">Atestado obrigatório</label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notificacoes' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="smsLembrete"
                          checked={formData.smsLembrete}
                          onChange={(e) => setFormData({ ...formData, smsLembrete: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="smsLembrete">Enviar SMS de lembrete</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Antecedência do SMS (horas)</label>
                        <Input
                          type="number"
                          value={formData.smsAntecedencia}
                          onChange={(e) => setFormData({ ...formData, smsAntecedencia: parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="emailConfirmacao"
                          checked={formData.emailConfirmacao}
                          onChange={(e) => setFormData({ ...formData, emailConfirmacao: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="emailConfirmacao">Enviar email de confirmação</label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'prioridades' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Idade mínima idoso</label>
                          <Input
                            type="number"
                            value={formData.idosoIdadeMinima}
                            onChange={(e) => setFormData({ ...formData, idosoIdadeMinima: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Idade máxima criança</label>
                          <Input
                            type="number"
                            value={formData.criancaIdadeMaxima}
                            onChange={(e) => setFormData({ ...formData, criancaIdadeMaxima: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="gestantePrioridade"
                            checked={formData.gestantePrioridade}
                            onChange={(e) => setFormData({ ...formData, gestantePrioridade: e.target.checked })}
                            className="rounded"
                          />
                          <label htmlFor="gestantePrioridade">Gestante tem prioridade</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="deficientePrioridade"
                            checked={formData.deficientePrioridade}
                            onChange={(e) => setFormData({ ...formData, deficientePrioridade: e.target.checked })}
                            className="rounded"
                          />
                          <label htmlFor="deficientePrioridade">Deficiente tem prioridade</label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/apps/saude/cadastros')}
            >
              Voltar
            </Button>
            <Button type="submit" disabled={loading || loadingData}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
