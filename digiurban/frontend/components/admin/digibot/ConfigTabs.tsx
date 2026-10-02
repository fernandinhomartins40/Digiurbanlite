'use client';

/** Abas que editam a configuração do bot (rascunho): mensagens, menu, atendimento */

import { ArrowDown, ArrowUp, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { BotConfig, ESSENTIAL_MENU } from './api';

type Change = (next: BotConfig) => void;

export function MessagesTab({ config, onChange }: { config: BotConfig; onChange: Change }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensagens e jeito de falar</CardTitle>
        <CardDescription>O que o bot diz ao começar e ao encerrar um atendimento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="botName">Nome do bot</Label>
          <Input id="botName" maxLength={30} value={config.botName} onChange={(e) => onChange({ ...config, botName: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="welcome">Mensagem de boas-vindas</Label>
          <Textarea id="welcome" rows={3} maxLength={400} value={config.welcomeMessage} onChange={(e) => onChange({ ...config, welcomeMessage: e.target.value })} />
          <p className="text-xs text-gray-500">Aparece quando o cidadão abre o chat ou volta ao menu.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="farewell">Mensagem de despedida</Label>
          <Textarea id="farewell" rows={2} maxLength={300} value={config.farewellMessage} onChange={(e) => onChange({ ...config, farewellMessage: e.target.value })} />
          <p className="text-xs text-gray-500">Quando o cidadão escreve "sair" ou encerra o atendimento.</p>
        </div>
        <div className="space-y-2">
          <Label>Jeito de falar</Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['simples', 'Simples e próximo'],
                ['formal', 'Formal'],
              ] as const
            ).map(([value, label]) => (
              <Button key={value} type="button" variant={config.tone === value ? 'default' : 'outline'} size="sm" onClick={() => onChange({ ...config, tone: value })}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1 rounded-xl border p-4">
          <Label htmlFor="aiCap">Uso de inteligência artificial por conversa</Label>
          <div className="flex items-center gap-2">
            <Input
              id="aiCap"
              type="number"
              min={0}
              max={50}
              className="w-24"
              value={config.aiCallsPerConversation}
              onChange={(e) => onChange({ ...config, aiCallsPerConversation: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })}
            />
            <span className="text-sm text-gray-600">usos, no máximo, em cada conversa (por hora)</span>
          </div>
          <p className="text-xs text-gray-500">
            Protege os créditos de IA do município. Passou do limite, o bot continua atendendo pelos menus, palavras e perguntas, sem gastar. Use 0 para nunca usar IA. Recomendado: 15.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MenuTab({ config, onChange }: { config: BotConfig; onChange: Change }) {
  const move = (index: number, delta: number) => {
    const menu = [...config.menu];
    const target = index + delta;
    if (target < 0 || target >= menu.length) return;
    [menu[index], menu[target]] = [menu[target], menu[index]];
    onChange({ ...config, menu });
  };
  const update = (index: number, patch: Partial<BotConfig['menu'][number]>) => {
    const menu = config.menu.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...config, menu });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu inicial</CardTitle>
        <CardDescription>As opções que o cidadão vê ao abrir o chat. Use as setas para mudar a ordem.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {config.menu.map((item, index) => {
          const essential = ESSENTIAL_MENU.includes(item.id);
          return (
            <div key={item.id} className={`rounded-xl border p-3 ${item.enabled ? 'bg-white' : 'bg-gray-50 opacity-70'}`}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Subir">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === config.menu.length - 1} onClick={() => move(index, 1)} aria-label="Descer">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Nome do botão</Label>
                    <Input maxLength={40} value={item.label} onChange={(e) => update(index, { label: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Explicação curta</Label>
                    <Input maxLength={80} value={item.description || ''} onChange={(e) => update(index, { description: e.target.value })} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 pt-5">
                  {essential ? (
                    <span className="flex items-center gap-1 text-xs text-gray-500" title="Essencial: sempre aparece">
                      <Lock className="h-3.5 w-3.5" /> Sempre
                    </span>
                  ) : (
                    <Switch checked={item.enabled} onCheckedChange={(v) => update(index, { enabled: v })} aria-label={`Mostrar ${item.label}`} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-gray-500">"Solicitar serviço" e "Consultar protocolo" são essenciais e sempre aparecem. O cidadão pode pedir para falar com um atendente a qualquer momento.</p>
      </CardContent>
    </Card>
  );
}

export function HumanTab({ config, onChange }: { config: BotConfig; onChange: Change }) {
  const set = (patch: Partial<BotConfig['human']>) => onChange({ ...config, human: { ...config.human, ...patch } });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atendimento humano</CardTitle>
        <CardDescription>O que o bot diz quando o cidadão pede para falar com uma pessoa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="hours">Horário de atendimento</Label>
          <p className="text-xs text-gray-500">Aparece para o cidadão logo depois da mensagem abaixo.</p>
          <Input id="hours" maxLength={120} value={config.human.hours} onChange={(e) => set({ hours: e.target.value })} placeholder="Segunda a sexta, das 8h às 17h" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wait">Mensagem ao chamar um atendente</Label>
          <Textarea id="wait" rows={2} maxLength={300} value={config.human.waitMessage} onChange={(e) => set({ waitMessage: e.target.value })} />
        </div>
        <p className="text-xs text-gray-500">As conversas que pedem atendente aparecem para os servidores em Mensagens › Fila de atendimento.</p>
      </CardContent>
    </Card>
  );
}
