'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { UserPlus, Stethoscope, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ChegadaAtendimentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCidadao, setSelectedCidadao] = useState<any>(null);
  const [formData, setFormData] = useState({
    unidadeSaudeId: '',
    tipoAtendimento: 'CONSULTA',
    motivoChegada: '',
    acompanhante: '',
    observacoes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCidadao) {
      alert('Selecione um cidadão antes de continuar');
      return;
    }

    setLoading(true);

    try {
      // Criar atendimento
      const response = await fetch('/api/apps/saude/atendimento/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cidadaoId: selectedCidadao.id,
          unidadeSaudeId: formData.unidadeSaudeId || 'unidade-default', // TODO: Usar unidade do usuário logado
          tipoAtendimento: formData.tipoAtendimento,
          motivoChegada: formData.motivoChegada,
          acompanhante: formData.acompanhante || undefined,
          observacoes: formData.observacoes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const atendimento = await response.json();

      alert('Paciente registrado com sucesso! Redirecionando para triagem...');

      // Redirecionar para triagem com o ID do atendimento
      router.push(`/admin/apps/saude/atendimento/triagem?atendimentoId=${atendimento.id}`);
    } catch (error: any) {
      console.error('Erro ao registrar chegada:', error);
      alert(`Erro ao registrar chegada: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-blue-600" />
            Chegada de Paciente
          </h1>
          <p className="text-gray-500 mt-1">
            Registre a chegada do paciente para iniciar atendimento
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      {/* Fluxo do Atendimento */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 text-white rounded-full">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-blue-900">1. Chegada</div>
                <div className="text-xs text-blue-700">Você está aqui</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="p-2 bg-gray-300 rounded-full">
                <Stethoscope className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-600">2. Triagem</div>
                <div className="text-xs text-gray-500">Próximo passo</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="p-2 bg-gray-300 rounded-full">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-600">3. Fila</div>
                <div className="text-xs text-gray-500">Aguardar médico</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Cidadão */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Paciente</CardTitle>
            <CardDescription>
              Busque o paciente por CPF, CNS ou nome completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CidadaoSelector
              onSelect={setSelectedCidadao}
              selectedCidadao={selectedCidadao}
              label="Paciente"
              required
            />
          </CardContent>
        </Card>

        {/* Dados do Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Atendimento</CardTitle>
            <CardDescription>
              Preencha as informações iniciais do atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tipoAtendimento">Tipo de Atendimento *</Label>
              <Select
                value={formData.tipoAtendimento}
                onValueChange={(value) => handleChange('tipoAtendimento', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTA">📋 Consulta Médica</SelectItem>
                  <SelectItem value="URGENCIA">🚨 Urgência/Emergência</SelectItem>
                  <SelectItem value="RETORNO">🔄 Retorno</SelectItem>
                  <SelectItem value="PREVENTIVO">✅ Consulta Preventiva</SelectItem>
                  <SelectItem value="VACINA">💉 Vacinação</SelectItem>
                  <SelectItem value="CURATIVO">🩹 Curativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="motivoChegada">Motivo da Chegada *</Label>
              <Textarea
                id="motivoChegada"
                value={formData.motivoChegada}
                onChange={(e) => handleChange('motivoChegada', e.target.value)}
                placeholder="Ex: Dor de cabeça há 3 dias, febre, tosse..."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Descreva brevemente o motivo principal da procura pelo atendimento
              </p>
            </div>

            <div>
              <Label htmlFor="acompanhante">Acompanhante (opcional)</Label>
              <Input
                id="acompanhante"
                value={formData.acompanhante}
                onChange={(e) => handleChange('acompanhante', e.target.value)}
                placeholder="Nome do acompanhante, se houver"
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Informações adicionais relevantes..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/apps/saude/atendimento')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCidadao}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              'Registrando...'
            ) : (
              <>
                Registrar e Ir para Triagem
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
