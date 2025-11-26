'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    citizenId: '',
    especialidade: '',
    procedimento: '',
    justificativaMedica: '',
    cid10: '',
    cidadeDestino: '',
    estadoDestino: 'SP',
    hospitalDestino: '',
    prioridade: 'MEDIA',
    acompanhanteNecessario: 'false',
    acompanhanteNome: '',
    acompanhanteCpf: '',
    observacoes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implementar chamada real à API
      // const response = await fetch('/api/tfd/solicitacoes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // const data = await response.json();

      toast({
        title: 'Solicitação criada!',
        description: 'A solicitação foi criada e enviada para análise documental.',
      });

      // Simular criação
      setTimeout(() => {
        router.push('/admin/apps/saude/tfd/solicitacoes');
      }, 1000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Solicitação TFD</h1>
          <p className="text-muted-foreground">
            Preencha os dados para criar uma nova solicitação de tratamento fora do domicílio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Dados do Paciente */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Informações do cidadão que irá realizar o tratamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="citizenId">CPF do Paciente *</Label>
                  <Input
                    id="citizenId"
                    required
                    placeholder="000.000.000-00"
                    value={formData.citizenId}
                    onChange={(e) =>
                      setFormData({ ...formData, citizenId: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade *</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value) =>
                      setFormData({ ...formData, prioridade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMERGENCIA">Emergência</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                      <SelectItem value="MEDIA">Média</SelectItem>
                      <SelectItem value="ROTINA">Rotina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Médicos */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Médicos</CardTitle>
              <CardDescription>
                Informações sobre o procedimento e tratamento necessário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="especialidade">Especialidade *</Label>
                  <Input
                    id="especialidade"
                    required
                    placeholder="Ex: Cardiologia, Oncologia"
                    value={formData.especialidade}
                    onChange={(e) =>
                      setFormData({ ...formData, especialidade: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cid10">CID-10</Label>
                  <Input
                    id="cid10"
                    placeholder="Ex: C50.9"
                    value={formData.cid10}
                    onChange={(e) =>
                      setFormData({ ...formData, cid10: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedimento">Procedimento *</Label>
                <Input
                  id="procedimento"
                  required
                  placeholder="Descreva o procedimento necessário"
                  value={formData.procedimento}
                  onChange={(e) =>
                    setFormData({ ...formData, procedimento: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="justificativaMedica">Justificativa Médica *</Label>
                <Textarea
                  id="justificativaMedica"
                  required
                  placeholder="Justifique a necessidade do tratamento fora do domicílio"
                  value={formData.justificativaMedica}
                  onChange={(e) =>
                    setFormData({ ...formData, justificativaMedica: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Destino */}
          <Card>
            <CardHeader>
              <CardTitle>Destino</CardTitle>
              <CardDescription>
                Local onde o tratamento será realizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidadeDestino">Cidade *</Label>
                  <Input
                    id="cidadeDestino"
                    required
                    placeholder="Ex: São Paulo"
                    value={formData.cidadeDestino}
                    onChange={(e) =>
                      setFormData({ ...formData, cidadeDestino: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estadoDestino">Estado *</Label>
                  <Select
                    value={formData.estadoDestino}
                    onValueChange={(value) =>
                      setFormData({ ...formData, estadoDestino: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      {/* Adicionar outros estados */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalDestino">Hospital/Clínica</Label>
                  <Input
                    id="hospitalDestino"
                    placeholder="Nome da unidade de saúde"
                    value={formData.hospitalDestino}
                    onChange={(e) =>
                      setFormData({ ...formData, hospitalDestino: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acompanhante */}
          <Card>
            <CardHeader>
              <CardTitle>Acompanhante</CardTitle>
              <CardDescription>
                Se necessário, informe os dados do acompanhante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="acompanhanteNecessario">Necessita acompanhante?</Label>
                <Select
                  value={formData.acompanhanteNecessario}
                  onValueChange={(value) =>
                    setFormData({ ...formData, acompanhanteNecessario: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Não</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.acompanhanteNecessario === 'true' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acompanhanteNome">Nome do Acompanhante *</Label>
                    <Input
                      id="acompanhanteNome"
                      required={formData.acompanhanteNecessario === 'true'}
                      placeholder="Nome completo"
                      value={formData.acompanhanteNome}
                      onChange={(e) =>
                        setFormData({ ...formData, acompanhanteNome: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acompanhanteCpf">CPF do Acompanhante *</Label>
                    <Input
                      id="acompanhanteCpf"
                      required={formData.acompanhanteNecessario === 'true'}
                      placeholder="000.000.000-00"
                      value={formData.acompanhanteCpf}
                      onChange={(e) =>
                        setFormData({ ...formData, acompanhanteCpf: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Anexe os documentos necessários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="encaminhamento">Encaminhamento Médico *</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Clique para fazer upload ou arraste o arquivo
                  </p>
                  <Input
                    id="encaminhamento"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Button type="button" variant="outline" size="sm">
                    Selecionar arquivo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exames">Exames (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Você pode fazer upload de múltiplos arquivos
                  </p>
                  <Input
                    id="exames"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                  />
                  <Button type="button" variant="outline" size="sm">
                    Selecionar arquivos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Informações adicionais (opcional)"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Criar Solicitação'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
