'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Trash2, Loader2 } from 'lucide-react';
import { TipoAtividadeColetivaPEC } from '@/types/saude';

interface Participante {
  citizenId?: string;
  nome?: string;
  cpf?: string;
  pressaoArterial?: string;
  glicemia?: number;
  peso?: number;
  avaliacaoAlterada: boolean;
}

export function AtividadeColetivaForm({ unidadeId }: { unidadeId: string }) {
  const [saving, setSaving] = useState(false);
  const [tipo, setTipo] = useState<TipoAtividadeColetivaPEC>('EDUCACAO_SAUDE');
  const [tema, setTema] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [praticasSaude, setPraticasSaude] = useState<string[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const handleAddParticipante = () => {
    setParticipantes([...participantes, { avaliacaoAlterada: false }]);
  };

  const handleSave = async () => {
    if (!tipo || !tema || !dataHora || !local) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/saude/atividades-coletivas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadeId,
          tipo,
          tema,
          dataHora,
          local,
          publicoAlvo,
          numeroParticipantes: participantes.length,
          praticasSaude,
          participantes,
        }),
      });

      if (response.ok) {
        alert('Atividade coletiva registrada!');
      }
    } catch (error) {
      alert('Erro ao salvar atividade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Registro de Atividade Coletiva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Atividade *</Label>
            <Select value={tipo} onValueChange={(v: TipoAtividadeColetivaPEC) => setTipo(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GRUPO_HIPERTENSOS">Grupo Hipertensos</SelectItem>
                <SelectItem value="GRUPO_DIABETICOS">Grupo Diabéticos</SelectItem>
                <SelectItem value="GRUPO_GESTANTES">Grupo Gestantes</SelectItem>
                <SelectItem value="GRUPO_IDOSOS">Grupo Idosos</SelectItem>
                <SelectItem value="EDUCACAO_SAUDE">Educação em Saúde</SelectItem>
                <SelectItem value="PRATICAS_CORPORAIS">Práticas Corporais</SelectItem>
                <SelectItem value="GRUPO_TABAGISMO">Grupo Tabagismo</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data e Hora *</Label>
            <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Tema *</Label>
            <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: Prevenção de quedas em idosos" />
          </div>

          <div className="space-y-2">
            <Label>Local *</Label>
            <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Sala de reuniões da UBS" />
          </div>

          <div className="space-y-2">
            <Label>Público Alvo</Label>
            <Input value={publicoAlvo} onChange={(e) => setPublicoAlvo(e.target.value)} placeholder="Ex: Idosos acima de 60 anos" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Práticas de Saúde Abordadas</Label>
          <Textarea
            placeholder="Digite uma prática por linha..."
            onChange={(e) => setPraticasSaude(e.target.value.split('\n').filter(Boolean))}
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Participantes</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddParticipante}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {participantes.map((p, i) => (
            <div key={i} className="border rounded p-3 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <Input placeholder="Nome" onChange={(e) => {
                  const newP = [...participantes];
                  newP[i].nome = e.target.value;
                  setParticipantes(newP);
                }} />
                <Input placeholder="CPF" onChange={(e) => {
                  const newP = [...participantes];
                  newP[i].cpf = e.target.value;
                  setParticipantes(newP);
                }} />
                <Input placeholder="PA" onChange={(e) => {
                  const newP = [...participantes];
                  newP[i].pressaoArterial = e.target.value;
                  setParticipantes(newP);
                }} />
                <div className="flex items-center gap-2">
                  <Checkbox checked={p.avaliacaoAlterada} onCheckedChange={(c) => {
                    const newP = [...participantes];
                    newP[i].avaliacaoAlterada = c as boolean;
                    setParticipantes(newP);
                  }} />
                  <Label className="text-xs">Alterada</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setParticipantes(participantes.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <>Salvar Atividade</>}
        </Button>
      </CardContent>
    </Card>
  );
}
