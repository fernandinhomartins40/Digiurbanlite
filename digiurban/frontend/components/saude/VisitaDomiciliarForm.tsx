'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Home, MapPin, Loader2, Save } from 'lucide-react';
import { TurnoVisita, TipoVisita } from '@/types/saude';

interface VisitaDomiciliarFormProps {
  citizenId: string;
  onSave?: () => void;
}

export function VisitaDomiciliarForm({ citizenId, onSave }: VisitaDomiciliarFormProps) {
  const [saving, setSaving] = useState(false);
  const [dataVisita, setDataVisita] = useState('');
  const [turno, setTurno] = useState<TurnoVisita>('MANHA');
  const [tipoVisita, setTipoVisita] = useState<TipoVisita>('ACOMPANHAMENTO');
  const [motivoVisita, setMotivoVisita] = useState('');
  const [atividadesRealizadas, setAtividadesRealizadas] = useState<string[]>([]);
  const [encaminhamentoUBS, setEncaminhamentoUBS] = useState(false);
  const [motivoEncaminhamento, setMotivoEncaminhamento] = useState('');
  const [desfecho, setDesfecho] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [geolocation, setGeolocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setGeolocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    }
  };

  const handleSave = async () => {
    if (!dataVisita || !tipoVisita || !motivoVisita) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/saude/visita-domiciliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId,
          dataVisita,
          turno,
          tipoVisita,
          motivoVisita,
          atividadesRealizadas,
          encaminhamentoUBS,
          motivoEncaminhamento,
          desfecho,
          observacoes,
          latitude: geolocation?.lat,
          longitude: geolocation?.lng,
        }),
      });

      if (response.ok) {
        alert('Visita domiciliar registrada!');
        onSave?.();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar visita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-blue-600" />
          Registro de Visita Domiciliar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Data da Visita *</Label>
            <Input type="date" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Turno</Label>
            <Select value={turno} onValueChange={(v: TurnoVisita) => setTurno(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MANHA">Manhã</SelectItem>
                <SelectItem value="TARDE">Tarde</SelectItem>
                <SelectItem value="NOITE">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Visita *</Label>
            <Select value={tipoVisita} onValueChange={(v: TipoVisita) => setTipoVisita(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CADASTRAMENTO">Cadastramento</SelectItem>
                <SelectItem value="ACOMPANHAMENTO">Acompanhamento</SelectItem>
                <SelectItem value="BUSCA_ATIVA">Busca Ativa</SelectItem>
                <SelectItem value="CONTROLE_AMBIENTAL">Controle Ambiental</SelectItem>
                <SelectItem value="EDUCACAO_SAUDE">Educação em Saúde</SelectItem>
                <SelectItem value="CONVOCACAO">Convocação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Motivo da Visita *</Label>
          <Textarea value={motivoVisita} onChange={(e) => setMotivoVisita(e.target.value)} rows={2} />
        </div>

        <div className="space-y-2">
          <Label>Atividades Realizadas</Label>
          <Textarea
            placeholder="Descreva as ações realizadas durante a visita..."
            onChange={(e) => setAtividadesRealizadas(e.target.value.split('\n').filter(Boolean))}
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox checked={encaminhamentoUBS} onCheckedChange={(c) => setEncaminhamentoUBS(c as boolean)} />
          <Label>Encaminhamento para UBS</Label>
        </div>

        {encaminhamentoUBS && (
          <div className="space-y-2">
            <Label>Motivo do Encaminhamento</Label>
            <Input value={motivoEncaminhamento} onChange={(e) => setMotivoEncaminhamento(e.target.value)} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Desfecho/Conclusão</Label>
          <Textarea value={desfecho} onChange={(e) => setDesfecho(e.target.value)} rows={2} />
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleGetLocation}>
            <MapPin className="mr-2 h-4 w-4" />
            Capturar Localização
          </Button>
          {geolocation && <span className="text-sm text-green-600">Localização capturada</span>}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><Save className="mr-2 h-4 w-4" />Salvar Visita</>}
        </Button>
      </CardContent>
    </Card>
  );
}
