'use client';

/**
 * E-mails do sistema da prefeitura: nome do remetente, e-mail para respostas,
 * liga/desliga dos avisos e lista do que foi enviado (endereços mascarados).
 * O DigiUrban não tem caixa de entrada — só envia e-mails automáticos.
 */

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail, RefreshCw, Save, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';

interface SentItem {
  id: string;
  toEmail: string;
  subject: string;
  status: string;
  kind: string | null;
  createdAt: string;
  errorMessage: string | null;
}

const STATUS: Record<string, { label: string; className: string }> = {
  QUEUED: { label: 'Na fila', className: 'bg-gray-100 text-gray-700' },
  PROCESSING: { label: 'Enviando', className: 'bg-blue-100 text-blue-700' },
  SENT: { label: 'Enviado', className: 'bg-blue-100 text-blue-700' },
  DELIVERED: { label: 'Entregue', className: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Falhou', className: 'bg-red-100 text-red-700' },
  BOUNCED: { label: 'Devolvido', className: 'bg-red-100 text-red-700' },
  COMPLAINED: { label: 'Marcado como spam', className: 'bg-red-100 text-red-700' },
};

const FILTERS: Array<[string, string]> = [
  ['', 'Todos'],
  ['DELIVERED', 'Entregues'],
  ['QUEUED', 'Na fila'],
  ['FAILED', 'Com falha'],
];

const PAGE = 30;

export default function SystemEmailPage() {
  const { apiRequest } = useAdminAuth();
  const { hasMinRole } = useAdminPermissions();
  const canEdit = hasMinRole('ADMIN');
  const { toast } = useToast();
  const [form, setForm] = useState({ senderName: '', replyTo: '', emailNotificationsEnabled: true });
  const [platform, setPlatform] = useState<{ enabled: boolean; fromEmail: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<SentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('');
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    apiRequest('/admin/mail/settings')
      .then((data: any) => {
        setForm(data.settings);
        setPlatform(data.platform);
      })
      .catch((error: Error) => toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
    // apiRequest muda a cada render do contexto: carregar só uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSent = useCallback(async () => {
    if (!canEdit) return;
    setListLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(offset) });
      if (filter) params.set('status', filter);
      const data = await apiRequest(`/admin/mail/sent?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar enviados', description: error.message, variant: 'destructive' });
    } finally {
      setListLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, filter, offset]);

  useEffect(() => {
    loadSent();
  }, [loadSent]);

  const save = async () => {
    setSaving(true);
    try {
      const data = await apiRequest('/admin/mail/settings', { method: 'PUT', body: JSON.stringify(form) });
      setForm({
        senderName: data.settings.senderName || '',
        replyTo: data.settings.replyTo || '',
        emailNotificationsEnabled: data.settings.emailNotificationsEnabled,
      });
      toast({ title: 'Salvo' });
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Mail className="h-6 w-6" /> E-mails do sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O sistema manda e-mails automáticos aos cidadãos e servidores: andamento de protocolo, troca de senha, boas-vindas e documentos.
        </p>
      </div>

      {platform && !platform.enabled && (
        <Card className="border-amber-300">
          <CardContent className="py-4 flex gap-3 text-sm">
            <TriangleAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <p>O envio de e-mails ainda não foi ligado pela equipe do DigiUrban. Os e-mails ficam guardados e saem assim que for ligado.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como os e-mails chegam</CardTitle>
          <CardDescription>{canEdit ? 'Só administradores podem alterar.' : 'Peça a um administrador para alterar.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Avisos por e-mail</Label>
              <p className="text-xs text-muted-foreground">
                Desligado, só saem os e-mails essenciais (troca de senha e confirmação de cadastro).
              </p>
            </div>
            <Switch
              checked={form.emailNotificationsEnabled}
              disabled={!canEdit}
              onCheckedChange={(value) => setForm((f) => ({ ...f, emailNotificationsEnabled: value }))}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome que aparece como remetente</Label>
              <Input
                placeholder="Ex.: Prefeitura de Palmital"
                value={form.senderName}
                disabled={!canEdit}
                maxLength={80}
                onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail para respostas</Label>
              <Input
                type="email"
                placeholder="Ex.: atendimento@palmital.sp.gov.br"
                value={form.replyTo}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, replyTo: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Se o cidadão clicar em &quot;Responder&quot;, a resposta vai para este endereço.</p>
            </div>
          </div>
          {platform && <p className="text-xs text-muted-foreground">Endereço de envio: {platform.fromEmail}</p>}
          {canEdit && (
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg">E-mails enviados</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadSent} disabled={listLoading}>
              <RefreshCw className={`h-4 w-4 ${listLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(([value, label]) => (
                <Button
                  key={value || 'all'}
                  size="sm"
                  variant={filter === value ? 'default' : 'outline'}
                  onClick={() => {
                    setOffset(0);
                    setFilter(value);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>

            {items.length === 0 && !listLoading && (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum e-mail por aqui.</p>
            )}

            <div className="divide-y">
              {items.map((item) => {
                const status = STATUS[item.status] || { label: item.status, className: 'bg-gray-100 text-gray-700' };
                return (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.toEmail} · {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </p>
                      {item.errorMessage && item.status !== 'DELIVERED' && (
                        <p className="text-xs text-red-600 break-words">{item.errorMessage}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full self-start sm:self-center inline-flex items-center gap-1 ${status.className}`}>
                      {item.status === 'DELIVERED' && <CheckCircle2 className="h-3 w-3" />}
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {total > PAGE && (
              <div className="flex items-center justify-between pt-2 text-sm">
                <span className="text-muted-foreground">
                  {offset + 1}–{Math.min(offset + PAGE, total)} de {total}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(offset - PAGE, 0))}>Anteriores</Button>
                  <Button size="sm" variant="outline" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Próximos</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
