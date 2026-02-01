'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, MapPin, Save } from 'lucide-react';

interface Equipe {
  id: string;
  nome: string;
  ine: string;
  unidade: {
    id: string;
    nome: string;
  };
}

interface ACS {
  id: string;
  name: string;
  email: string;
}

export default function NovaMicroarea() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [acsDisponiveis, setAcsDisponiveis] = useState<ACS[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    descricao: '',
    equipeId: '',
    acsId: '',
  });

  useEffect(() => {
    loadEquipes();
    loadACS();
  }, []);

  const loadEquipes = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/equipes?ativo=true', {
        credentials: 'include',
      });
      const data = await response.json();
      setEquipes(data);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const loadACS = async () => {
    try {
      // Buscar usuários com DadosSaude categoria=ACS
      const response = await fetch('/api/apps/saude/cadastros/dados-saude?categoria=ACS&ativo=true', {
        credentials: 'include',
      });
      const data = await response.json();
      setAcsDisponiveis(data);
    } catch (error) {
      console.error('Erro ao carregar ACS:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero || !formData.equipeId) {
      alert('Número da microárea e Equipe ESF são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        numero: formData.numero,
        descricao: formData.descricao || null,
        equipeId: formData.equipeId,
        acsId: formData.acsId || null,
        ativo: true,
      };

      const response = await fetch('/api/apps/saude/cadastros/microareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao criar microárea');
        return;
      }

      alert('Microárea criada com sucesso!');
      router.push('/admin/apps/saude/cadastros/microareas');
    } catch (error) {
      console.error('Erro ao criar microárea:', error);
      alert('Erro ao criar microárea');
    } finally {
      setLoading(false);
    }
  };

  const equipeInfo = equipes.find((e) => e.id === formData.equipeId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              Nova Microárea
            </h1>
            <p className="text-gray-600">Cadastrar nova microárea no território da ESF</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados da Microárea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Equipe ESF */}
              <div>
                <Label htmlFor="equipeId" className="required">
                  Equipe ESF *
                </Label>
                <Select
                  value={formData.equipeId}
                  onValueChange={(value) => setFormData({ ...formData, equipeId: value })}
                >
                  <SelectTrigger id="equipeId">
                    <SelectValue placeholder="Selecione a equipe responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome} - {equipe.unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equipeInfo && (
                  <p className="text-sm text-gray-500 mt-1">
                    INE: {equipeInfo.ine} | Unidade: {equipeInfo.unidade.nome}
                  </p>
                )}
              </div>

              {/* Número da Microárea */}
              <div>
                <Label htmlFor="numero" className="required">
                  Número da Microárea *
                </Label>
                <Input
                  id="numero"
                  type="text"
                  placeholder="Ex: 01, 02, 03..."
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Número de identificação única da microárea dentro da equipe
                </p>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="descricao">Descrição / Localização</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Bairro Centro, entre Rua A e Rua B..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Descrição opcional para identificar o território
                </p>
              </div>

              {/* ACS Responsável */}
              <div>
                <Label htmlFor="acsId">Agente Comunitário de Saúde (ACS) - Opcional</Label>
                <Select
                  value={formData.acsId}
                  onValueChange={(value) => setFormData({ ...formData, acsId: value })}
                >
                  <SelectTrigger id="acsId">
                    <SelectValue placeholder="Deixe vazio para sem ACS ou selecione um ACS" />
                  </SelectTrigger>
                  <SelectContent>
                    {acsDisponiveis.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Nenhum ACS disponível</div>
                    ) : (
                      acsDisponiveis.map((acs) => (
                        <SelectItem key={acs.id} value={acs.id}>
                          {acs.name} - {acs.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  ACS que realizará as visitas domiciliares neste território. Deixe vazio se ainda não tiver ACS designado.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mb-6 bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-900 mb-2">
                ℹ️ Sobre Microáreas
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Cada equipe ESF é responsável por um território de até 4.000 pessoas</li>
                <li>• O território é dividido em microáreas (geralmente 4 a 6 por equipe)</li>
                <li>• Cada microárea deve ter aproximadamente 750 pessoas (150 famílias)</li>
                <li>• O ACS é o profissional responsável pelas visitas domiciliares mensais</li>
                <li>• A territorialização permite conhecer melhor a comunidade e suas necessidades</li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Criar Microárea'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
