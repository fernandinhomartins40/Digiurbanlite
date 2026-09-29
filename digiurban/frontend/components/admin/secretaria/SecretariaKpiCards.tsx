'use client'

/**
 * Indicadores da página de uma secretaria.
 *
 * Substitui os cartões que exibiam conceitos sem fonte de dados no backend
 * (ex.: "Artistas cadastrados", "Eventos culturais") e sempre mostravam 0.
 * Agora cada secretaria mostra os indicadores que o seu app REALMENTE calcula
 * + os protocolos em aberto (reais, via /api/departments/:slug/stats).
 * Quando um número não pode ser carregado, mostra "—" em vez de um 0 falso.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  Megaphone,
  School,
  Stethoscope,
  Timer,
  Users,
  Wrench,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchJson, fetchSecretariaProtocolStats, SecretariaProtocolStats } from '@/lib/secretaria-protocol-stats'

interface KpiDef {
  label: string
  hint: string
  icon: LucideIcon
  /** Extrai o valor da resposta do endpoint de estatísticas do app */
  value: (data: any) => number | undefined
}

interface SecretariaKpiConfig {
  endpoint: string
  kpis: KpiDef[]
}

const sum = (items: any) =>
  Array.isArray(items) ? items.reduce((acc: number, i: any) => acc + (Number(i?.total) || 0), 0) : undefined

// Indicadores reais de cada app de secretaria (ver /api/apps/*/stats)
const CONFIG: Record<string, SecretariaKpiConfig> = {
  cultura: {
    endpoint: '/api/apps/cultura/stats',
    kpis: [
      { label: 'Participantes matriculados', hint: 'em oficinas e cursos', icon: Users, value: (d) => d.participantesMatriculados },
      { label: 'Inscrições aguardando', hint: 'análise da secretaria', icon: ClipboardList, value: (d) => d.inscricoesAguardando },
      { label: 'Editais abertos', hint: 'com inscrições em andamento', icon: Megaphone, value: (d) => d.editaisComInscricoesAbertas },
    ],
  },
  esportes: {
    endpoint: '/api/apps/esportes/stats',
    kpis: [
      { label: 'Alunos matriculados', hint: 'em escolinhas e turmas', icon: Users, value: (d) => d.alunosMatriculados },
      { label: 'Inscrições aguardando', hint: 'análise da secretaria', icon: ClipboardList, value: (d) => d.inscricoesAguardando },
      { label: 'Reservas pendentes', hint: 'de espaços esportivos', icon: CalendarClock, value: (d) => d.reservasPendentes },
    ],
  },
  habitacao: {
    endpoint: '/api/apps/habitacao/inscricoes/stats',
    kpis: [
      { label: 'Programas ativos', hint: 'habitacionais', icon: Home, value: (d) => d.programasAtivos },
      { label: 'Unidades disponíveis', hint: 'para contemplação', icon: Building2, value: (d) => d.unidadesDisponiveis },
      { label: 'Contemplados no ano', hint: 'famílias atendidas', icon: FileCheck2, value: (d) => d.contempladasNoAno },
    ],
  },
  'meio-ambiente': {
    endpoint: '/api/apps/meio-ambiente/processos/stats',
    kpis: [
      { label: 'Processos em andamento', hint: 'licenciamento ambiental', icon: Briefcase, value: (d) => sum(d.backlogPorTipo) },
      { label: 'Licenças vencendo', hint: 'nos próximos 60 dias', icon: Timer, value: (d) => d.licencasVencendo60Dias },
      { label: 'Fiscalizações abertas', hint: 'denúncias em apuração', icon: AlertTriangle, value: (d) => d.fiscalizacoesAbertas },
    ],
  },
  'servicos-publicos': {
    endpoint: '/api/apps/servicos-publicos/os/stats',
    kpis: [
      { label: 'Ordens de serviço abertas', hint: 'backlog atual', icon: Wrench, value: (d) => sum(d.backlogPorTipo) },
      { label: 'Ordens atrasadas', hint: 'fora do prazo', icon: AlertTriangle, value: (d) => d.atrasadas },
    ],
  },
  'obras-publicas': {
    endpoint: '/api/apps/licenciamento/processos/stats',
    kpis: [
      { label: 'Processos em análise', hint: 'licenciamento urbano', icon: Briefcase, value: (d) => sum(d.backlogPorTipo) },
      { label: 'Licenças emitidas no ano', hint: 'alvarás e habite-se', icon: FileCheck2, value: (d) => d.licencasEmitidasNoAno },
      { label: 'Licenças vencendo', hint: 'nos próximos 60 dias', icon: Timer, value: (d) => d.licencasVencendo60Dias },
    ],
  },
  'planejamento-urbano': {
    endpoint: '/api/apps/licenciamento/processos/stats',
    kpis: [
      { label: 'Processos em análise', hint: 'licenciamento urbano', icon: Briefcase, value: (d) => sum(d.backlogPorTipo) },
      { label: 'Licenças emitidas no ano', hint: 'alvarás e habite-se', icon: FileCheck2, value: (d) => d.licencasEmitidasNoAno },
      { label: 'Licenças vencendo', hint: 'nos próximos 60 dias', icon: Timer, value: (d) => d.licencasVencendo60Dias },
    ],
  },
  agricultura: {
    endpoint: '/api/agricultura/produtores/statistics',
    kpis: [
      { label: 'Produtores cadastrados', hint: 'no app de Agricultura', icon: Users, value: (d) => d.total },
      { label: 'Produtores ativos', hint: 'com cadastro em dia', icon: FileCheck2, value: (d) => d.ativos },
      { label: 'Com documentação pendente', hint: 'precisam de atenção', icon: AlertTriangle, value: (d) => d.comPendencias },
    ],
  },
  educacao: {
    endpoint: '/api/secretarias/educacao/stats',
    kpis: [
      { label: 'Matrículas ativas', hint: 'na rede municipal', icon: GraduationCap, value: (d) => d.totalMatriculas },
      { label: 'Unidades de ensino', hint: 'ativas', icon: School, value: (d) => d.totalUnidades },
      { label: 'Turmas ativas', hint: 'no ano letivo', icon: Users, value: (d) => d.totalTurmas },
    ],
  },
  saude: {
    endpoint: '/api/secretarias/saude/stats',
    kpis: [
      { label: 'Unidades de saúde', hint: 'ativas', icon: Building2, value: (d) => d.totalUnidades },
      { label: 'Atendimentos no mês', hint: 'na fila de atendimento', icon: Stethoscope, value: (d) => d.atendimentosMes },
      { label: 'Profissionais ativos', hint: 'cadastrados na rede', icon: Users, value: (d) => d.totalProfissionais },
    ],
  },
  'mobilidade-urbana': {
    endpoint: '/api/apps/mobilidade-urbana/stats',
    kpis: [
      { label: 'Carteiras ativas', hint: 'estudante, idoso, PcD e passe livre', icon: IdCard, value: (d) => d.carteirasAtivas },
      { label: 'Solicitações em análise', hint: 'aguardando a secretaria', icon: ClipboardList, value: (d) => d.solicitacoesEmAnalise },
      { label: 'Vencendo em 30 dias', hint: 'precisam de renovação', icon: Timer, value: (d) => d.carteirasVencendo30d },
    ],
  },
  'transportes-transito': {
    endpoint: '/api/apps/transportes-transito/stats',
    kpis: [
      { label: 'Credenciais ativas', hint: 'estacionamento e credenciamentos', icon: IdCard, value: (d) => d.credenciaisAtivas },
      { label: 'Vistorias pendentes', hint: 'a realizar', icon: ClipboardList, value: (d) => d.vistoriasPendentes },
      { label: 'Defesas pendentes', hint: 'de autuação, a julgar', icon: Timer, value: (d) => d.defesasPendentes },
    ],
  },
  'defesa-civil': {
    endpoint: '/api/apps/defesa-civil/ocorrencias/stats',
    kpis: [
      { label: 'Ocorrências abertas', hint: 'em atendimento', icon: AlertTriangle, value: (d) => sum(d.abertasPorTipo) },
      { label: 'Áreas interditadas', hint: 'risco atual', icon: Home, value: (d) => d.areasInterditadas },
      { label: 'Famílias em abrigo', hint: 'acolhidas agora', icon: Users, value: (d) => d.familiasEmAbrigo },
    ],
  },
  'politicas-mulheres': {
    endpoint: '/api/apps/politicas-mulheres/casos/stats',
    kpis: [
      { label: 'Casos ativos', hint: 'em acompanhamento', icon: Users, value: (d) => sum(d.ativosPorTipo) },
      { label: 'Encaminhamentos abertos', hint: 'à rede de proteção', icon: ClipboardList, value: (d) => d.encaminhamentosAbertos },
      { label: 'Casos no ano', hint: 'atendimentos iniciados', icon: CalendarClock, value: (d) => d.casosNoAno },
    ],
  },
  'assistencia-social': {
    endpoint: '/api/secretarias/assistencia-social/stats',
    kpis: [
      { label: 'Famílias cadastradas', hint: 'CadÚnico municipal', icon: Users, value: (d) => d.totalFamilias },
      { label: 'Programas ativos', hint: 'benefícios e serviços', icon: ClipboardList, value: (d) => d.totalProgramas },
      { label: 'Unidades (CRAS/CREAS)', hint: 'em funcionamento', icon: Building2, value: (d) => d.totalUnidades },
    ],
  },
}

function KpiCard({
  title,
  icon: Icon,
  value,
  hint,
  loading,
  href,
}: {
  title: string
  icon: LucideIcon
  value: number | undefined
  hint: string
  loading: boolean
  href?: string
}) {
  const content = (
    <Card className={href ? 'h-full transition-shadow hover:shadow-md' : 'h-full'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{typeof value === 'number' ? value : '—'}</div>
            <p className="text-xs text-muted-foreground">{typeof value === 'number' ? hint : 'Indisponível no momento'}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export function SecretariaKpiCards({ slug }: { slug: string }) {
  const config = CONFIG[slug]
  const [protocols, setProtocols] = useState<SecretariaProtocolStats | null>(null)
  const [appData, setAppData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.allSettled([
      fetchSecretariaProtocolStats(slug),
      config ? fetchJson(config.endpoint) : Promise.resolve(null),
    ]).then(([p, a]) => {
      if (!active) return
      setProtocols(p.status === 'fulfilled' ? p.value : null)
      setAppData(a.status === 'fulfilled' ? a.value : null)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [slug, config])

  const kpis = config?.kpis ?? []
  const cols = kpis.length + 1 >= 4 ? 'lg:grid-cols-4' : kpis.length + 1 === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-4 sm:gap-6`}>
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.label}
          title={kpi.label}
          icon={kpi.icon}
          hint={kpi.hint}
          loading={loading}
          value={appData ? kpi.value(appData) : undefined}
        />
      ))}
      <KpiCard
        title="Protocolos em aberto"
        icon={FileText}
        loading={loading}
        value={protocols?.pending}
        hint={`${protocols?.total ?? 0} no total · clique para abrir a fila`}
        href={`/admin/protocolos?departamento=${slug}`}
      />
    </div>
  )
}
