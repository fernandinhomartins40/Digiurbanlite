'use client';

import { useState, useEffect } from 'react';
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
import { Truck, FileText, Upload, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NovaSolicitacaoTFDPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCidadao, setSelectedCidadao] = useState<any>(null);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    especialidadeId: '',
    destinoId: '',
    tipoAtendimento: 'CONSULTA',
    justificativa: '',
    observacoes: '',
    documentos: [] as File[],
  });

  useEffect(() => {
    loadEspecialidades();
    loadDestinos();
  }, []);

  const loadEspecialidades = async () => {
    try {
      const response = await fetch('/api/saude/tfd/configuracoes/especialidades', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data);
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
    }
  };

  const loadDestinos = async () => {
    try {
      const response = await fetch('/api/saude/tfd/configuracoes/destinos', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDestinos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar destinos:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData({ ...formData, documentos: [...formData.documentos, ...files] });
    }
  };

  const removeFile = (index: number) => {
    const newDocs = [...formData.documentos];
    newDocs.splice(index, 1);
    setFormData({ ...formData, documentos: newDocs });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCidadao) {
      alert('Selecione um cidadão antes de continuar');
      return;
    }

    setLoading(true);

    try {
      const especialidadeSelecionada = especialidades.find(
        (item) => item.id === formData.especialidadeId
      );
      const destinoSelecionado = destinos.find((item) => item.id === formData.destinoId);

      if (!especialidadeSelecionada || !destinoSelecionado) {
        throw new Error('Especialidade e destino sao obrigatorios');
      }

      const response = await fetch('/api/saude/tfd/solicitacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          citizenId: selectedCidadao.id,
          especialidade: especialidadeSelecionada.nome,
          procedimento: formData.tipoAtendimento,
          justificativa: formData.justificativa,
          prioridade: 'MEDIA',
          cidadeDestino: destinoSelecionado.cidade,
          estadoDestino: destinoSelecionado.estado,
          hospitalDestino: destinoSelecionado.hospital || undefined,
          observacoes: formData.observacoes || undefined,
          encaminhamentoMedicoUrl: '',
          examesUrls: [],
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const solicitacao = await response.json();

      if (formData.documentos.length > 0 && solicitacao?.id) {
        await Promise.all(
          formData.documentos.map(async (file) => {
            const fileForm = new FormData();
            fileForm.append('file', file);
            fileForm.append('tipoDocumento', 'OUTRO');
            fileForm.append('descricao', file.name);

            const uploadResponse = await fetch(
              `/api/saude/tfd/solicitacao/${solicitacao.id}/upload-documento`,
              {
                method: 'POST',
                credentials: 'include',
                body: fileForm,
              }
            );

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.text();
              throw new Error(uploadError || `Falha ao enviar ${file.name}`);
            }
          })
        );
      }

      alert('Solicitação TFD criada com sucesso!');
      router.push('/admin/apps/saude/tfd/solicitacoes');
    } catch (error: any) {
      console.error('Erro ao criar solicitação:', error);
      alert(`Erro ao criar solicitação: ${error.message}`);
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
            <Truck className="h-8 w-8 text-purple-600" />
            Nova Solicitação TFD
          </h1>
          <p className="text-gray-500 mt-1">
            Registre nova solicitação de tratamento fora do domicílio
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      {/* Fluxo do TFD */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 text-white rounded-full">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-purple-900">1. Solicitação</div>
                <div className="text-xs text-purple-700">Você está aqui</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <Badge variant="outline" className="text-xs">2. Análise Documental</Badge>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <Badge variant="outline" className="text-xs">3. Regulação Médica</Badge>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <Badge variant="outline" className="text-xs">4. Aprovação Gestão</Badge>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <Badge variant="outline" className="text-xs">5. Viagem</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Paciente</CardTitle>
            <CardDescription>
              Busque o paciente que necessita de tratamento fora do domicílio
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

        {/* Dados da Solicitação */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Tratamento</CardTitle>
            <CardDescription>
              Preencha os dados do tratamento necessário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="especialidadeId">Especialidade Médica *</Label>
                <Select
                  value={formData.especialidadeId}
                  onValueChange={(value) => handleChange('especialidadeId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id}>
                        {esp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="destinoId">Cidade de Destino *</Label>
                <Select
                  value={formData.destinoId}
                  onValueChange={(value) => handleChange('destinoId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinos.map((dest) => (
                      <SelectItem key={dest.id} value={dest.id}>
                        {dest.cidade} - {dest.estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                  <SelectItem value="CONSULTA">🩺 Consulta Médica</SelectItem>
                  <SelectItem value="EXAME">🔬 Exame Especializado</SelectItem>
                  <SelectItem value="CIRURGIA">🏥 Procedimento Cirúrgico</SelectItem>
                  <SelectItem value="TRATAMENTO">💊 Tratamento Contínuo</SelectItem>
                  <SelectItem value="URGENCIA">🚨 Urgência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="justificativa">Justificativa Médica *</Label>
              <Textarea
                id="justificativa"
                value={formData.justificativa}
                onChange={(e) => handleChange('justificativa', e.target.value)}
                placeholder="Descreva detalhadamente a necessidade do tratamento fora do domicílio..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Explique por que o tratamento não pode ser realizado no município
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações Adicionais</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Informações complementares..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Documentos Necessários
            </CardTitle>
            <CardDescription>
              Anexe laudo médico, encaminhamento e outros documentos relevantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="documentos">Anexar Documentos</Label>
              <Input
                id="documentos"
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB cada)
              </p>
            </div>

            {/* Lista de Arquivos */}
            {formData.documentos.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos Anexados ({formData.documentos.length})</Label>
                <div className="space-y-2">
                  {formData.documentos.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/apps/saude/tfd/solicitacoes')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCidadao}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              'Criando Solicitação...'
            ) : (
              <>
                Criar Solicitação TFD
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
