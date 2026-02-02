'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { OrgChart } from '@/components/unified-system/OrgChart';
import { Loader2, Building2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface OrganizationalUnit {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  nivel: number;
  responsavel?: {
    id: string;
    name: string;
    email: string;
  };
  children?: OrganizationalUnit[];
  _count?: {
    assignments?: number;
    positions?: number;
  };
}

export default function OrganogramaPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [orgData, setOrgData] = useState<OrganizationalUnit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar departamentos
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Carregar organograma quando departamento mudar
  useEffect(() => {
    if (selectedDepartment) {
      fetchOrganogram();
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erro ao carregar departamentos');

      const data = await response.json();
      setDepartments(data);

      // Selecionar primeiro departamento por padrão
      if (data.length > 0 && !selectedDepartment) {
        setSelectedDepartment(data[0].id);
      }
    } catch (err: any) {
      console.error('Erro ao carregar departamentos:', err);
      setError(err.message);
    }
  };

  const fetchOrganogram = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar unidade raiz (Secretaria)
      const response = await fetch(
        `/api/organizational-units?departmentId=${selectedDepartment}&tipo=SECRETARIA`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Erro ao carregar organograma');

      const units = await response.json();

      if (units.length === 0) {
        setError('Nenhuma estrutura organizacional encontrada para este departamento');
        setOrgData(null);
        return;
      }

      // Pegar primeira unidade (secretaria)
      const secretaria = units[0];

      // Buscar hierarquia completa
      const hierarchyResponse = await fetch(
        `/api/organizational-units/${secretaria.id}/hierarchy`,
        {
          credentials: 'include',
        }
      );

      if (!hierarchyResponse.ok) throw new Error('Erro ao carregar hierarquia');

      const hierarchy = await hierarchyResponse.json();
      setOrgData(hierarchy);
    } catch (err: any) {
      console.error('Erro ao carregar organograma:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnitClick = (unit: OrganizationalUnit) => {
    // Navegar para detalhes da unidade
    router.push(`/admin/unidades-organizacionais/${unit.id}`);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                Organograma Municipal
              </h1>
              <p className="text-gray-600 mt-1">
                Visualize a estrutura organizacional das secretarias municipais
              </p>
            </div>

            <Button
              variant="outline"
              onClick={fetchOrganogram}
              disabled={loading || !selectedDepartment}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700 min-w-[120px]">
              Secretaria:
            </label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione uma secretaria" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Conteúdo */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando organograma...</span>
          </div>
        )}

        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {!loading && !error && orgData && (
          <OrgChart data={orgData} onUnitClick={handleUnitClick} />
        )}

        {!loading && !error && !orgData && selectedDepartment && (
          <Card className="p-8 text-center">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma estrutura organizacional encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Este departamento ainda não possui uma estrutura organizacional cadastrada.
            </p>
            <Button
              onClick={() => router.push('/admin/unidades-organizacionais/nova')}
            >
              Criar Estrutura Organizacional
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
