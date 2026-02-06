'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { criarTriagem } from '@/lib/api/atendimento-api';
import { Activity, AlertTriangle, Heart, Thermometer, Wind, AlertCircle, Zap, CheckCircle, FileText, Siren } from 'lucide-react';

export default function TriagemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    atendimentoId: searchParams.get('atendimentoId') || '',
    pressaoArterial: '',
    frequenciaCardiaca: '',
    frequenciaRespiratoria: '',
    temperatura: '',
    saturacaoO2: '',
    peso: '',
    altura: '',
    queixaPrincipal: '',
    historico: '',
    alergias: '',
    medicamentosUso: '',
    classificacaoRisco: 'VERDE',
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await criarTriagem({
        atendimentoId: formData.atendimentoId,
        profissionalId: 'profissional-default', // TODO: Obter do contexto
        pressaoArterial: formData.pressaoArterial || undefined,
        frequenciaCardiaca: formData.frequenciaCardiaca ? parseInt(formData.frequenciaCardiaca) : undefined,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : undefined,
        saturacaoO2: formData.saturacaoO2 ? parseFloat(formData.saturacaoO2) : undefined,
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        altura: formData.altura ? parseFloat(formData.altura) : undefined,
        queixaPrincipal: formData.queixaPrincipal,
        observacoes: formData.historico || undefined,
        classificacaoRisco: formData.classificacaoRisco as any,
      });

      alert('Triagem realizada com sucesso!');
      router.push('/admin/apps/saude/atendimento/fila');
    } catch (error) {
      console.error('Erro ao realizar triagem:', error);
      alert('Erro ao realizar triagem');
    } finally {
      setLoading(false);
    }
  };

  const getClassificacaoInfo = (classificacao: string) => {
    const classes = {
      VERMELHO: { color: 'bg-red-100 border-red-500 text-red-700', label: 'VERMELHO - Emergência', icon: Siren },
      LARANJA: { color: 'bg-orange-100 border-orange-500 text-orange-700', label: 'LARANJA - Urgente', icon: AlertCircle },
      AMARELO: { color: 'bg-yellow-100 border-yellow-500 text-yellow-700', label: 'AMARELO - Pouco Urgente', icon: Zap },
      VERDE: { color: 'bg-green-100 border-green-500 text-green-700', label: 'VERDE - Não Urgente', icon: CheckCircle },
      AZUL: { color: 'bg-blue-100 border-blue-500 text-blue-700', label: 'AZUL - Consulta', icon: FileText },
    };
    return classes[classificacao as keyof typeof classes] || classes.VERDE;
  };

  const classificacaoInfo = getClassificacaoInfo(formData.classificacaoRisco);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Triagem de Atendimento</h1>
          <p className="text-gray-500 mt-1">
            Avaliação inicial e classificação de risco
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Classificação de Risco */}
        <Card className={`border-l-4 ${classificacaoInfo.color}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Classificação de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="classificacaoRisco">Selecione a classificação</Label>
              <Select
                value={formData.classificacaoRisco}
                onValueChange={(value) => handleChange('classificacaoRisco', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VERMELHO">VERMELHO - Emergência</SelectItem>
                  <SelectItem value="LARANJA">LARANJA - Urgente</SelectItem>
                  <SelectItem value="AMARELO">AMARELO - Pouco Urgente</SelectItem>
                  <SelectItem value="VERDE">VERDE - Não Urgente</SelectItem>
                  <SelectItem value="AZUL">AZUL - Consulta</SelectItem>
                </SelectContent>
              </Select>
              <div className={`p-3 rounded-lg ${classificacaoInfo.color} text-sm flex items-center gap-2`}>
                {React.createElement(classificacaoInfo.icon, { className: 'h-4 w-4' })}
                <span>{classificacaoInfo.label}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="atendimentoId">ID do Atendimento *</Label>
              <Input
                id="atendimentoId"
                value={formData.atendimentoId}
                onChange={(e) => handleChange('atendimentoId', e.target.value)}
                placeholder="Digite o ID do atendimento"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Sinais Vitais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sinais Vitais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pressaoArterial" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Pressão Arterial
                </Label>
                <Input
                  id="pressaoArterial"
                  value={formData.pressaoArterial}
                  onChange={(e) => handleChange('pressaoArterial', e.target.value)}
                  placeholder="Ex: 120/80"
                />
              </div>

              <div>
                <Label htmlFor="frequenciaCardiaca" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Frequência Cardíaca (bpm)
                </Label>
                <Input
                  id="frequenciaCardiaca"
                  type="number"
                  value={formData.frequenciaCardiaca}
                  onChange={(e) => handleChange('frequenciaCardiaca', e.target.value)}
                  placeholder="Ex: 72"
                />
              </div>

              <div>
                <Label htmlFor="frequenciaRespiratoria" className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Frequência Respiratória (rpm)
                </Label>
                <Input
                  id="frequenciaRespiratoria"
                  type="number"
                  value={formData.frequenciaRespiratoria}
                  onChange={(e) => handleChange('frequenciaRespiratoria', e.target.value)}
                  placeholder="Ex: 18"
                />
              </div>

              <div>
                <Label htmlFor="temperatura" className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperatura (°C)
                </Label>
                <Input
                  id="temperatura"
                  type="number"
                  step="0.1"
                  value={formData.temperatura}
                  onChange={(e) => handleChange('temperatura', e.target.value)}
                  placeholder="Ex: 36.5"
                />
              </div>

              <div>
                <Label htmlFor="saturacaoO2">Saturação O2 (%)</Label>
                <Input
                  id="saturacaoO2"
                  type="number"
                  step="0.1"
                  value={formData.saturacaoO2}
                  onChange={(e) => handleChange('saturacaoO2', e.target.value)}
                  placeholder="Ex: 98"
                />
              </div>

              <div>
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => handleChange('peso', e.target.value)}
                  placeholder="Ex: 70.5"
                />
              </div>

              <div>
                <Label htmlFor="altura">Altura (m)</Label>
                <Input
                  id="altura"
                  type="number"
                  step="0.01"
                  value={formData.altura}
                  onChange={(e) => handleChange('altura', e.target.value)}
                  placeholder="Ex: 1.75"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anamnese */}
        <Card>
          <CardHeader>
            <CardTitle>Anamnese</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="queixaPrincipal">Queixa Principal *</Label>
              <Textarea
                id="queixaPrincipal"
                value={formData.queixaPrincipal}
                onChange={(e) => handleChange('queixaPrincipal', e.target.value)}
                placeholder="Descreva o motivo do atendimento"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="historico">Histórico da Doença Atual</Label>
              <Textarea
                id="historico"
                value={formData.historico}
                onChange={(e) => handleChange('historico', e.target.value)}
                placeholder="Descreva o histórico e evolução dos sintomas"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="alergias">Alergias</Label>
              <Input
                id="alergias"
                value={formData.alergias}
                onChange={(e) => handleChange('alergias', e.target.value)}
                placeholder="Descreva alergias conhecidas"
              />
            </div>

            <div>
              <Label htmlFor="medicamentosUso">Medicamentos em Uso</Label>
              <Textarea
                id="medicamentosUso"
                value={formData.medicamentosUso}
                onChange={(e) => handleChange('medicamentosUso', e.target.value)}
                placeholder="Liste os medicamentos que o paciente está utilizando"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Finalizar Triagem'}
          </Button>
        </div>
      </form>
    </div>
  );
}
