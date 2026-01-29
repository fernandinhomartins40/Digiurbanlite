'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  Heart,
  Activity,
  Users,
  FileText,
  Pill,
} from 'lucide-react';

interface Cidadao {
  id: string;
  name: string;
  cpf: string;
  cns?: string;
  birthDate?: Date;
  gender?: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface EquipeSaude {
  id: string;
  nome: string;
  ine: string;
  tipo: string;
}

interface Alerta {
  tipo: 'ALERGIA' | 'GESTANTE' | 'IDOSO' | 'CRIANCA' | 'DIABETICO' | 'HIPERTENSO' | 'OUTRO';
  descricao: string;
  gravidade?: 'LEVE' | 'MODERADA' | 'GRAVE';
}

interface ResumoClinico {
  problemasAtivos: {
    codigo: string;
    descricao: string;
    dataInicio: Date;
  }[];
  medicamentosUso: {
    medicamento: string;
    dosagem: string;
    frequencia: string;
  }[];
  alergias: {
    substancia: string;
    reacao: string;
    gravidade: string;
  }[];
}

interface UltimoAtendimento {
  id: string;
  data: Date;
  tipo: string;
  profissional: string;
  diagnostico?: string;
}

interface FolhaDeRostoPageProps {
  citizenId: string;
}

export function FolhaDeRostoPage({ citizenId }: FolhaDeRostoPageProps) {
  const [loading, setLoading] = useState(true);
  const [cidadao, setCidadao] = useState<Cidadao | null>(null);
  const [equipe, setEquipe] = useState<EquipeSaude | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [resumoClinico, setResumoClinico] = useState<ResumoClinico | null>(null);
  const [ultimosAtendimentos, setUltimosAtendimentos] = useState<UltimoAtendimento[]>([]);

  useEffect(() => {
    if (citizenId) {
      loadDados();
    }
  }, [citizenId]);

  const loadDados = async () => {
    try {
      setLoading(true);

      // Carregar dados do cidadão
      const cidadaoResponse = await fetch(`/api/citizens/${citizenId}`);
      if (cidadaoResponse.ok) {
        const cidadaoData = await cidadaoResponse.json();
        setCidadao(cidadaoData);

        // Gerar alertas baseados nos dados
        gerarAlertas(cidadaoData);
      }

      // Carregar equipe PSF
      const equipeResponse = await fetch(`/api/saude/equipe-cidadao/${citizenId}`);
      if (equipeResponse.ok) {
        const equipeData = await equipeResponse.json();
        setEquipe(equipeData);
      }

      // Carregar resumo clínico
      const resumoResponse = await fetch(`/api/saude/resumo-clinico/${citizenId}`);
      if (resumoResponse.ok) {
        const resumoData = await resumoResponse.json();
        setResumoClinico(resumoData);
      }

      // Carregar últimos atendimentos
      const atendimentosResponse = await fetch(
        `/api/saude/atendimentos?citizenId=${citizenId}&limit=5`
      );
      if (atendimentosResponse.ok) {
        const atendimentosData = await atendimentosResponse.json();
        setUltimosAtendimentos(atendimentosData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da folha de rosto:', error);
    } finally {
      setLoading(false);
    }
  };

  const gerarAlertas = (cidadaoData: Cidadao) => {
    const alertasGerados: Alerta[] = [];

    // Verificar idade
    if (cidadaoData.birthDate) {
      const idade = calcularIdade(new Date(cidadaoData.birthDate));
      if (idade >= 60) {
        alertasGerados.push({
          tipo: 'IDOSO',
          descricao: `Idoso (${idade} anos)`,
        });
      } else if (idade < 18) {
        alertasGerados.push({
          tipo: 'CRIANCA',
          descricao: `Criança/Adolescente (${idade} anos)`,
        });
      }
    }

    setAlertas(alertasGerados);
  };

  const calcularIdade = (dataNascimento: Date): number => {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mes = hoje.getMonth() - dataNascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const getAlertaBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'ALERGIA': return 'bg-red-100 text-red-800 border-red-300';
      case 'GESTANTE': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'IDOSO': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CRIANCA': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DIABETICO': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'HIPERTENSO': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando folha de rosto...</div>
      </div>
    );
  }

  if (!cidadao) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cidadão não encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Alertas */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{cidadao.name}</CardTitle>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>CPF: {cidadao.cpf}</span>
                  {cidadao.cns && <span>CNS: {cidadao.cns}</span>}
                  {cidadao.birthDate && (
                    <span>
                      {calcularIdade(new Date(cidadao.birthDate))} anos
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Alertas Visuais */}
            <div className="flex flex-wrap gap-2">
              {alertas.map((alerta, index) => (
                <Badge
                  key={index}
                  className={getAlertaBadgeColor(alerta.tipo)}
                  variant="outline"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {alerta.descricao}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Data de Nascimento</div>
                <div className="font-medium">
                  {cidadao.birthDate
                    ? new Date(cidadao.birthDate).toLocaleDateString('pt-BR')
                    : '-'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Sexo</div>
                <div className="font-medium">{cidadao.gender || '-'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Telefone</div>
                <div className="font-medium">{cidadao.phone || '-'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">E-mail</div>
                <div className="font-medium text-sm">{cidadao.email || '-'}</div>
              </div>
            </div>
          </div>

          {cidadao.address && (
            <>
              <Separator className="my-4" />
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Endereço</div>
                  <div className="font-medium">
                    {cidadao.address.street}, {cidadao.address.number}
                    {cidadao.address.neighborhood && ` - ${cidadao.address.neighborhood}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {cidadao.address.city}/{cidadao.address.state} - CEP: {cidadao.address.zipCode}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Equipe PSF */}
      {equipe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Equipe de Saúde da Família
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">{equipe.nome}</span>
                <Badge variant="outline" className="ml-2">
                  {equipe.tipo}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">INE: {equipe.ine}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Clínico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Problemas Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-red-600" />
              Problemas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumoClinico?.problemasAtivos && resumoClinico.problemasAtivos.length > 0 ? (
              <ul className="space-y-2">
                {resumoClinico.problemasAtivos.map((problema, index) => (
                  <li key={index} className="text-sm">
                    <div className="font-medium">{problema.descricao}</div>
                    <div className="text-xs text-gray-500">
                      {problema.codigo} - Desde{' '}
                      {new Date(problema.dataInicio).toLocaleDateString('pt-BR')}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum problema ativo registrado</p>
            )}
          </CardContent>
        </Card>

        {/* Medicamentos em Uso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-green-600" />
              Medicamentos em Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumoClinico?.medicamentosUso && resumoClinico.medicamentosUso.length > 0 ? (
              <ul className="space-y-2">
                {resumoClinico.medicamentosUso.map((med, index) => (
                  <li key={index} className="text-sm">
                    <div className="font-medium">{med.medicamento}</div>
                    <div className="text-xs text-gray-500">
                      {med.dosagem} - {med.frequencia}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum medicamento registrado</p>
            )}
          </CardContent>
        </Card>

        {/* Alergias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Alergias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumoClinico?.alergias && resumoClinico.alergias.length > 0 ? (
              <ul className="space-y-2">
                {resumoClinico.alergias.map((alergia, index) => (
                  <li key={index} className="text-sm">
                    <div className="font-medium text-red-600">{alergia.substancia}</div>
                    <div className="text-xs text-gray-500">
                      {alergia.reacao}
                      <Badge
                        variant="outline"
                        className={
                          alergia.gravidade === 'GRAVE'
                            ? 'ml-2 bg-red-100 text-red-800'
                            : 'ml-2'
                        }
                      >
                        {alergia.gravidade}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma alergia registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos Atendimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Últimos Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ultimosAtendimentos.length > 0 ? (
            <div className="space-y-3">
              {ultimosAtendimentos.map((atendimento) => (
                <div
                  key={atendimento.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">
                      {new Date(atendimento.data).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {atendimento.tipo} - {atendimento.profissional}
                    </div>
                    {atendimento.diagnostico && (
                      <div className="text-xs text-gray-500 mt-1">
                        {atendimento.diagnostico}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">{atendimento.tipo}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhum atendimento registrado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
