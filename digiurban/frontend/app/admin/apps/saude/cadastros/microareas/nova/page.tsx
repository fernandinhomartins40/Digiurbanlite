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
import { ArrowLeft, MapPin, Save, Info } from 'lucide-react';

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
      // Buscar usuÃ¡rios com DadosSaude categoria=ACS
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
      alert('NÃºmero da microÃ¡rea e Equipe ESF sÃ£o obrigatÃ³rios');
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
        alert(error.error || 'Erro ao criar microÃ¡rea');
        return;
      }

      alert('MicroÃ¡rea criada com sucesso!');
      router.push('/admin/apps/saude/cadastros/microareas');
    } catch (error) {
      console.error('Erro ao criar microÃ¡rea:', error);
      alert('Erro ao criar microÃ¡rea');
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
              Nova MicroÃ¡rea
            </h1>
            <p className="text-gray-600">Cadastrar nova microÃ¡rea no territÃ³rio da ESF</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados da MicroÃ¡rea</CardTitle>
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
                    <SelectValue placeholder="Selecione a equipe responsÃ¡vel" />
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

              {/* NÃºmero da MicroÃ¡rea */}
              <div>
                <Label htmlFor="numero" className="required">
                  NÃºmero da MicroÃ¡rea *
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
                  NÃºmero de identificaÃ§Ã£o Ãºnica da microÃ¡rea dentro da equipe
                </p>
              </div>

              {/* DescriÃ§Ã£o */}
              <div>
                <Label htmlFor="descricao">DescriÃ§Ã£o / LocalizaÃ§Ã£o</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Bairro Centro, entre Rua A e Rua B..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  DescriÃ§Ã£o opcional para identificar o territÃ³rio
                </p>
              </div>

              {/* ACS ResponsÃ¡vel */}
              <div>
                <Label htmlFor="acsId">Agente ComunitÃ¡rio de SaÃºde (ACS) - Opcional</Label>
                <Select
                  value={formData.acsId}
                  onValueChange={(value) => setFormData({ ...formData, acsId: value })}
                >
                  <SelectTrigger id="acsId">
                    <SelectValue placeholder="Deixe vazio para sem ACS ou selecione um ACS" />
                  </SelectTrigger>
                  <SelectContent>
                    {acsDisponiveis.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Nenhum ACS disponÃ­vel</div>
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
                  ACS que realizarÃ¡ as visitas domiciliares neste territÃ³rio. Deixe vazio se ainda nÃ£o tiver ACS designado.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mb-6 bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-900 mb-2">
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Sobre Microáreas
                </span>
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>â€¢ Cada equipe ESF Ã© responsÃ¡vel por um territÃ³rio de atÃ© 4.000 pessoas</li>
                <li>â€¢ O territÃ³rio Ã© dividido em microÃ¡reas (geralmente 4 a 6 por equipe)</li>
                <li>â€¢ Cada microÃ¡rea deve ter aproximadamente 750 pessoas (150 famÃ­lias)</li>
                <li>â€¢ O ACS Ã© o profissional responsÃ¡vel pelas visitas domiciliares mensais</li>
                <li>â€¢ A territorializaÃ§Ã£o permite conhecer melhor a comunidade e suas necessidades</li>
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
              {loading ? 'Salvando...' : 'Criar MicroÃ¡rea'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
