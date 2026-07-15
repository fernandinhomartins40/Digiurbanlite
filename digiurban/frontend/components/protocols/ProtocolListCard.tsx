'use client';

/**
 * ============================================================================
 * ProtocolListCard — card de protocolo na listagem, com ícones de ação
 * ============================================================================
 * Extraído da página /admin/protocolos para ser REUTILIZADO tanto lá quanto no
 * Módulo Protocolos das secretarias (reforma de módulos). Mesma aparência,
 * mesmos ícones de ação (Detalhes + menu Atribuir/Delegar/Encaminhar/Equipe),
 * mesmos dialogs do sistema de protocolos existente — nada é recriado.
 * ============================================================================
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminPermissions } from '@/contexts/AdminAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye, MoreVertical, UserPlus, UserCheck, ArrowRightLeft, Users, Calendar, MessageSquare, Database,
} from 'lucide-react';
import { getPriorityLabel, getPriorityBadgeClass } from '@/lib/protocol-helpers';
import { AssignProtocolDialog } from '@/components/protocols/AssignProtocolDialog';
import { DelegateProtocolDialog } from '@/components/protocols/DelegateProtocolDialog';
import { ForwardProtocolDialog } from '@/components/protocols/ForwardProtocolDialog';
import { AssignTeamDialog } from '@/components/protocols/AssignTeamDialog';

const statusLabels: Record<string, string> = {
  VINCULADO: 'Vinculado',
  PROGRESSO: 'Em Progresso',
  ATUALIZACAO: 'Atualização',
  CONCLUIDO: 'Concluído',
  PENDENCIA: 'Pendência',
  CANCELADO: 'Cancelado',
};

const statusColors: Record<string, string> = {
  VINCULADO: 'bg-blue-100 text-blue-800',
  PROGRESSO: 'bg-yellow-100 text-yellow-800',
  ATUALIZACAO: 'bg-orange-100 text-orange-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  PENDENCIA: 'bg-red-100 text-red-800',
  CANCELADO: 'bg-gray-100 text-gray-700',
};

export interface ProtocolCardData {
  id: string;
  number: string;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  createdAt: string | Date;
  dueDate?: string | Date | null;
  citizen?: { name?: string } | null;
  service?: { name?: string; serviceType?: string } | null;
  department?: { name?: string } | null;
  assignedUser?: { name?: string } | null;
  hasData?: boolean;
  _count?: { history?: number };
}

interface Props {
  protocol: ProtocolCardData;
  /** Callback após uma ação (atribuir/delegar/etc) — recarregar a lista. */
  onChanged?: () => void;
}

export function ProtocolListCard({ protocol, onChanged }: Props) {
  const router = useRouter();
  const { hasPermission } = useAdminPermissions();
  const [showAssign, setShowAssign] = useState(false);
  const [showDelegate, setShowDelegate] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [showTeam, setShowTeam] = useState(false);

  const done = () => onChanged?.();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold">#{protocol.number}</h3>
              <Badge variant="secondary" className={`text-xs ${statusColors[protocol.status] || ''}`}>
                {statusLabels[protocol.status] || protocol.status}
              </Badge>
              <Badge variant="outline" className={`border text-xs ${getPriorityBadgeClass(protocol.priority)}`}>
                {getPriorityLabel(protocol.priority)}
              </Badge>
              {protocol.hasData && (
                <span title="Serviço com dados coletados" className="inline-flex items-center text-teal-600">
                  <Database className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-1">{protocol.title}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{protocol.description || 'Sem descrição'}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <div><span className="font-medium">Cidadão:</span> {protocol.citizen?.name || 'N/A'}</div>
              <div><span className="font-medium">Serviço:</span> {protocol.service?.name || 'N/A'}</div>
              {protocol.department?.name && (
                <div><span className="font-medium">Departamento:</span> {protocol.department.name}</div>
              )}
            </div>

            {protocol.assignedUser?.name && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="font-medium">Atribuído a:</span> {protocol.assignedUser.name}
              </div>
            )}

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400">
                <span className="whitespace-nowrap">Criado em {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}</span>
                {protocol.dueDate && (
                  <span className="flex items-center whitespace-nowrap">
                    <Calendar className="h-3 w-3 mr-1" />
                    Prazo: {new Date(protocol.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {protocol._count?.history != null && (
                  <span className="flex items-center whitespace-nowrap">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {protocol._count.history} interações
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-2 w-full sm:w-auto shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/protocolos/${protocol.id}`)}
              className="flex-1 sm:flex-initial"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">Detalhes</span>
            </Button>

            {hasPermission('protocols:assign') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowAssign(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /><span>Atribuir Servidor</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDelegate(true)}>
                    <UserCheck className="mr-2 h-4 w-4" /><span>Delegar Temporário</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowForward(true)}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" /><span>Encaminhar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowTeam(true)}>
                    <Users className="mr-2 h-4 w-4" /><span>Atribuir Equipe</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>

      {/* Dialogs do sistema de protocolos existente */}
      <AssignProtocolDialog open={showAssign} onOpenChange={setShowAssign} protocolId={protocol.id} onSuccess={done} />
      <DelegateProtocolDialog open={showDelegate} onOpenChange={setShowDelegate} protocolId={protocol.id} onSuccess={done} />
      <ForwardProtocolDialog open={showForward} onOpenChange={setShowForward} protocolId={protocol.id} onSuccess={done} />
      <AssignTeamDialog open={showTeam} onOpenChange={setShowTeam} protocolId={protocol.id} onSuccess={done} />
    </Card>
  );
}
