import { PrismaClient, UserRole, TipoAtribuicaoProtocolo, SituacaoAtribuicao } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Serviço para gerenciar atribuições de protocolos
 * Integração completa com Sistema Unificado V2.0
 */

interface AssignProtocolParams {
  protocolId: string;
  assignedUserId: string;
  assignedById: string;
  assignedByName: string;
  motivo?: string;
  comment?: string;
}

interface DelegateProtocolParams {
  protocolId: string;
  delegadoParaUserId: string;
  delegadoPorUserId: string;
  delegadoPorName: string;
  motivoDelegacao: string;
  ativaAte: Date;
  comentario?: string;
}

interface ForwardProtocolParams {
  protocolId: string;
  forwardToUserId: string;
  forwardToDepartmentId?: string;
  forwardedById: string;
  forwardedByName: string;
  tipoEncaminhamento: 'ENCAMINHADO' | 'CONSULTA';
  motivo: string;
  prazoResposta?: Date;
  comentario?: string;
}

interface AssignTeamParams {
  protocolId: string;
  teamId: string;
  assignedById: string;
  assignedByName: string;
  comentario?: string;
}

/**
 * Buscar o vínculo funcional ativo (EmployeeAssignment) do servidor
 */
async function getActiveEmployeeAssignment(userId: string, departmentId?: string) {
  return await prisma.employeeAssignment.findFirst({
    where: {
      userId,
      situacao: 'ATIVO',
      ...(departmentId ? { departmentId } : {})
    },
    orderBy: [
      { isPrimary: 'desc' },
      { dataInicio: 'desc' }
    ],
    include: {
      organizationalUnit: true,
      position: true,
      function: true,
      department: true
    }
  });
}

/**
 * Verificar status do servidor de saúde
 */
async function checkServerHealthStatus(userId: string) {
  const healthData = await prisma.healthProfessionalData.findUnique({
    where: { userId }
  });

  return {
    exists: !!healthData,
    status: healthData?.status || 'ATIVO',
    dataInativacao: healthData?.dataInativacao,
    motivoInativacao: healthData?.motivoInativacao
  };
}

/**
 * Buscar substitutos disponíveis via hierarquia
 */
async function getAvailableSubstitutes(userId: string) {
  const hierarchy = await prisma.employeeHierarchy.findFirst({
    where: {
      subordinadoId: userId,
      tipo: 'HIERARQUICO',
      ativo: true
    },
    include: {
      supervisor: {
        include: {
          subordinados: {
            where: {
              ativo: true,
              subordinadoId: { not: userId }
            },
            include: {
              subordinado: {
                include: {
                  healthData: true,
                  protocolAssignments: {
                    where: {
                      situacao: 'ATIVA'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!hierarchy || !hierarchy.supervisor) return [];

  return hierarchy.supervisor.subordinados
    .filter((s: any) => {
      const health = s.subordinado.healthData;
      return !health || health.ativo === true;
    })
    .map((s: any) => ({
      userId: s.subordinadoId,
      name: s.subordinado.name,
      email: s.subordinado.email,
      cargaAtual: s.subordinado.protocolAssignments.length,
      status: s.subordinado.healthData?.ativo ? 'ATIVO' : 'INATIVO'
    }))
    .sort((a: any, b: any) => a.cargaAtual - b.cargaAtual); // Menos sobrecarregados primeiro
}

/**
 * Registrar no sistema de auditoria unificado
 */
async function registerAssignmentAudit(
  assignmentId: string | null,
  userId: string,
  userName: string,
  tipo: string,
  motivo: string,
  detalhes: any
) {
  await prisma.assignmentAudit.create({
    data: {
      assignmentId,
      tipo: tipo as any,
      userId,
      userName,
      motivo,
      detalhes
    }
  });
}

/**
 * Atribuir protocolo a um servidor (Principal)
 * REFATORADO: Integração com Sistema Unificado V2.0
 */
export async function assignProtocolToServer(params: AssignProtocolParams) {
  const { protocolId, assignedUserId, assignedById, assignedByName, motivo, comment } = params;

  // 1. Buscar protocolo
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      department: true,
      citizen: true,
      service: true
    }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // 2. Buscar servidor
  const assignedUser = await prisma.user.findUnique({
    where: { id: assignedUserId },
    include: {
      healthData: true
    }
  });

  if (!assignedUser || !assignedUser.isActive) {
    throw new Error('Servidor não encontrado ou inativo');
  }

  // 3. Verificar status do servidor (apenas se for profissional de saúde)
  const healthStatus = await checkServerHealthStatus(assignedUserId);

  if (healthStatus.exists && healthStatus.status !== 'ATIVO') {
    const substitutos = await getAvailableSubstitutes(assignedUserId);
    throw {
      code: `SERVIDOR_${healthStatus.status}`,
      message: `${assignedUser.name} está ${healthStatus.status.toLowerCase()}${
        healthStatus.motivoInativacao ? `. Motivo: ${healthStatus.motivoInativacao}` : ''
      }`,
      suggestedDelegates: substitutos
    };
  }

  // 4. Buscar vínculo funcional ativo
  const employeeAssignment =
    await getActiveEmployeeAssignment(assignedUserId, protocol.departmentId) ||
    await getActiveEmployeeAssignment(assignedUserId);

  // 5. Marcar atribuições anteriores como SUBSTITUIDA
  await prisma.protocolServerAssignment.updateMany({
    where: {
      protocolId,
      situacao: 'ATIVA',
      tipo: 'PRINCIPAL'
    },
    data: {
      situacao: 'SUBSTITUIDA',
      dataFim: new Date()
    }
  });

  // 6. Criar nova atribuição
  const assignment = await prisma.protocolServerAssignment.create({
    data: {
      protocolId,
      userId: assignedUserId,
      tipo: 'PRINCIPAL',
      situacao: 'ATIVA',
      assignedById,
      assignedByName,
      motivo: motivo || comment || 'Atribuição principal',
      employeeAssignmentId: employeeAssignment?.id,
      organizationalUnitId: employeeAssignment?.organizationalUnitId,
      comentario: comment,
      dataInicio: new Date()
    }
  });

  // 7. Atualizar protocolo (campos denormalizados para performance)
  const updatedProtocol = await prisma.protocolSimplified.update({
    where: { id: protocolId },
    data: {
      assignedUserId, // Mantém compatibilidade
      currentAssignedUserId: assignedUserId,
      organizationalUnitId: employeeAssignment?.organizationalUnitId,
      status: 'PROGRESSO'
    },
    include: {
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      currentAssignedUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organizationalUnit: true,
      citizen: true,
      service: true,
      department: true
    }
  });

  // 8. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: 'ATRIBUIDO',
      comment: comment || `Protocolo atribuído para ${assignedUser.name}`,
      userId: assignedById,
      metadata: {
        assignmentId: assignment.id,
        tipo: 'PRINCIPAL',
        organizationalUnit: employeeAssignment?.organizationalUnit?.nome,
        position: employeeAssignment?.position?.nome
      }
    }
  });

  // 9. Registrar em AssignmentAudit (Sistema Unificado)
  if (employeeAssignment) {
    await registerAssignmentAudit(
      employeeAssignment.id,
      assignedUserId,
      assignedUser.name,
      'DESIGNACAO',
      'Atribuição de protocolo',
      {
        protocolId,
        protocolNumber: protocol.number,
        protocolTitle: protocol.title,
        assignedBy: assignedByName,
        comment
      }
    );
  }

  // 10. Criar notificação para cidadão
  await prisma.notification.create({
    data: {
      citizenId: protocol.citizenId,
      title: 'Protocolo em Andamento',
      message: `Seu protocolo ${protocol.number} foi atribuído para ${assignedUser.name} e está sendo processado`,
      type: 'INFO',
      protocolId: protocol.id
    }
  });

  return {
    protocol: updatedProtocol,
    assignment,
    employeeAssignment
  };
}

/**
 * Delegar protocolo temporariamente (férias, afastamento)
 */
export async function delegateProtocol(params: DelegateProtocolParams) {
  const {
    protocolId,
    delegadoParaUserId,
    delegadoPorUserId,
    delegadoPorName,
    motivoDelegacao,
    ativaAte,
    comentario
  } = params;

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: { departmentId: true }
  });

  if (!protocol) {
    throw new Error('Protocolo nao encontrado');
  }

  // 1. Validar servidor delegado
  const delegado = await prisma.user.findUnique({
    where: { id: delegadoParaUserId },
    include: { healthData: true }
  });

  if (!delegado || !delegado.isActive) {
    throw new Error('Servidor delegado não encontrado ou inativo');
  }

  const healthStatus = await checkServerHealthStatus(delegadoParaUserId);
  if (healthStatus.exists && healthStatus.status !== 'ATIVO') {
    throw new Error(`Servidor delegado está ${healthStatus.status}`);
  }

  // 2. Buscar vínculo funcional
  const employeeAssignment =
    await getActiveEmployeeAssignment(delegadoParaUserId, protocol.departmentId) ||
    await getActiveEmployeeAssignment(delegadoParaUserId);

  // 3. Criar atribuição de delegação
  const assignment = await prisma.protocolServerAssignment.create({
    data: {
      protocolId,
      userId: delegadoParaUserId,
      tipo: 'DELEGADO',
      situacao: 'ATIVA',
      assignedById: delegadoPorUserId,
      assignedByName: delegadoPorName,
      isDelegacao: true,
      delegadoPor: delegadoPorUserId,
      ativaAte,
      motivoDelegacao,
      comentario,
      employeeAssignmentId: employeeAssignment?.id,
      organizationalUnitId: employeeAssignment?.organizationalUnitId,
      dataInicio: new Date()
    }
  });

  // 4. Atualizar protocolo
  await prisma.protocolSimplified.update({
    where: { id: protocolId },
    data: {
      currentAssignedUserId: delegadoParaUserId
    }
  });

  // 5. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: 'DELEGADO',
      comment: `Delegado para ${delegado.name} até ${ativaAte.toLocaleDateString()}. Motivo: ${motivoDelegacao}`,
      userId: delegadoPorUserId,
      metadata: {
        assignmentId: assignment.id,
        tipo: 'DELEGADO',
        ativaAte,
        motivoDelegacao
      }
    }
  });

  return assignment;
}

/**
 * Encaminhar protocolo para outro departamento ou servidor
 */
export async function forwardProtocol(params: ForwardProtocolParams) {
  const {
    protocolId,
    forwardToUserId,
    forwardToDepartmentId,
    forwardedById,
    forwardedByName,
    tipoEncaminhamento,
    motivo,
    prazoResposta,
    comentario
  } = params;

  // 1. Buscar protocolo
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: { department: true }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // 2. Buscar servidor destino
  const forwardToUser = await prisma.user.findUnique({
    where: { id: forwardToUserId },
    include: { department: true }
  });

  if (!forwardToUser || !forwardToUser.isActive) {
    throw new Error('Servidor destino não encontrado ou inativo');
  }

  // 3. Verificar se é interdepartamental
  const destinationDepartmentId = forwardToDepartmentId || protocol.departmentId;
  const isInterdepartamental = destinationDepartmentId !== protocol.departmentId;

  // 4. Buscar vínculo funcional
  const employeeAssignment =
    await getActiveEmployeeAssignment(forwardToUserId, destinationDepartmentId) ||
    await getActiveEmployeeAssignment(forwardToUserId);
  const destinationDepartment =
    employeeAssignment?.department ||
    await prisma.department.findUnique({
      where: { id: destinationDepartmentId },
      select: { id: true, name: true }
    });

  // 5. Se ENCAMINHADO, marcar atribuição anterior como SUBSTITUIDA
  if (tipoEncaminhamento === 'ENCAMINHADO') {
    await prisma.protocolServerAssignment.updateMany({
      where: {
        protocolId,
        situacao: 'ATIVA',
        tipo: 'PRINCIPAL'
      },
      data: {
        situacao: 'SUBSTITUIDA',
        dataFim: new Date()
      }
    });
  }

  // 6. Criar nova atribuição
  const assignment = await prisma.protocolServerAssignment.create({
    data: {
      protocolId,
      userId: forwardToUserId,
      tipo: tipoEncaminhamento as TipoAtribuicaoProtocolo,
      situacao: 'ATIVA',
      assignedById: forwardedById,
      assignedByName: forwardedByName,
      motivo,
      prazoResposta,
      comentario,
      isInterdepartamental: isInterdepartamental || false,
      departmentOrigemId: protocol.departmentId,
      departmentOrigemName: protocol.department.name,
      departmentDestinoId: destinationDepartmentId,
      departmentDestinoName: destinationDepartment?.name,
      employeeAssignmentId: employeeAssignment?.id,
      organizationalUnitId: employeeAssignment?.organizationalUnitId,
      dataInicio: new Date()
    }
  });

  // 7. Se ENCAMINHADO, atualizar protocolo
  if (tipoEncaminhamento === 'ENCAMINHADO') {
    await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        currentAssignedUserId: forwardToUserId,
        departmentId: destinationDepartmentId
      }
    });
  }

  // 8. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: tipoEncaminhamento === 'ENCAMINHADO' ? 'ENCAMINHADO' : 'CONSULTA_SOLICITADA',
      comment: `${tipoEncaminhamento === 'ENCAMINHADO' ? 'Encaminhado' : 'Solicitada consulta'} para ${forwardToUser.name}. ${motivo}`,
      userId: forwardedById,
      metadata: {
        assignmentId: assignment.id,
        tipo: tipoEncaminhamento,
        isInterdepartamental,
        prazoResposta
      }
    }
  });

  return assignment;
}

/**
 * Atribuir protocolo para equipe completa
 */
export async function assignProtocolToTeam(params: AssignTeamParams) {
  const { protocolId, teamId, assignedById, assignedByName, comentario } = params;

  // 1. Buscar equipe
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      membros: {
        where: { ativo: true },
        include: {
          user: {
            include: {
              healthData: true
            }
          }
        }
      },
      coordenador: true
    }
  });

  if (!team || !team.ativo) {
    throw new Error('Equipe não encontrada ou inativa');
  }

  if (team.membros.length === 0) {
    throw new Error('Equipe não possui membros ativos');
  }

  // 2. Atualizar protocolo
  await prisma.protocolSimplified.update({
    where: { id: protocolId },
    data: {
      teamId,
      currentAssignedUserId: team.coordenadorId || team.membros[0].userId
    }
  });

  // 3. Criar atribuições para cada membro
  const assignments = [];

  for (const membro of team.membros) {
    const employeeAssignment = await getActiveEmployeeAssignment(membro.userId);

    const tipo = membro.userId === team.coordenadorId ? 'PRINCIPAL' : 'APOIO';

    const assignment = await prisma.protocolServerAssignment.create({
      data: {
        protocolId,
        userId: membro.userId,
        tipo: tipo as TipoAtribuicaoProtocolo,
        situacao: 'ATIVA',
        assignedById,
        assignedByName,
        motivo: `Atribuição em equipe: ${team.nome}`,
        comentario,
        employeeAssignmentId: employeeAssignment?.id,
        organizationalUnitId: employeeAssignment?.organizationalUnitId,
        dataInicio: new Date()
      }
    });

    assignments.push(assignment);
  }

  // 4. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: 'ATRIBUIDO_EQUIPE',
      comment: `Protocolo atribuído para equipe ${team.nome} (${team.membros.length} membros)`,
      userId: assignedById,
      metadata: {
        teamId,
        teamNome: team.nome,
        membrosCount: team.membros.length,
        coordenadorId: team.coordenadorId
      }
    }
  });

  return {
    team,
    assignments
  };
}

/**
 * Listar histórico de atribuições de um protocolo
 */
export async function getProtocolAssignments(protocolId: string) {
  const assignments = await prisma.protocolServerAssignment.findMany({
    where: { protocolId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      assignedBy: {
        select: {
          id: true,
          name: true
        }
      },
      employeeAssignment: {
        include: {
          organizationalUnit: true,
          position: true
        }
      },
      organizationalUnit: true
    },
    orderBy: {
      dataInicio: 'desc'
    }
  });

  // Criar timeline
  const timeline = assignments.map(a => ({
    data: a.dataInicio,
    evento: getEventoDescricao(a),
    por: a.assignedByName || 'Sistema',
    tipo: a.tipo,
    situacao: a.situacao
  }));

  return {
    assignments,
    timeline
  };
}

function getEventoDescricao(assignment: any): string {
  const userName = assignment.user.name;

  switch (assignment.tipo) {
    case 'PRINCIPAL':
      return `Atribuído para ${userName}`;
    case 'DELEGADO':
      return `Delegado para ${userName} (${assignment.motivoDelegacao || 'temporário'})`;
    case 'ENCAMINHADO':
      return `Encaminhado para ${userName}`;
    case 'CONSULTA':
      return `Solicitada consulta de ${userName}`;
    case 'APOIO':
      return `${userName} adicionado como apoio`;
    default:
      return `Atribuído para ${userName}`;
  }
}

/**
 * Obter métricas de carga de trabalho dos servidores
 */
export async function getWorkloadStats(departmentId?: string) {
  const where: any = {
    isActive: true
  };

  if (departmentId) {
    where.OR = [
      { departmentId },
      {
        userDepartments: {
          some: {
            departmentId,
            isActive: true
          }
        }
      },
      {
        assignments: {
          some: {
            departmentId,
            situacao: 'ATIVO'
          }
        }
      }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      department: true,
      userDepartments: {
        where: {
          isActive: true,
          ...(departmentId ? { departmentId } : {})
        },
        include: {
          department: true
        },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'asc' }
        ]
      },
      healthData: true,
      protocolAssignments: {
        where: {
          situacao: 'ATIVA'
        },
        include: {
          protocol: {
            select: {
              status: true,
              dueDate: true
            }
          }
        }
      },
      assignments: {
        where: {
          situacao: 'ATIVO',
          ...(departmentId ? { departmentId } : {})
        },
        orderBy: [
          { isPrimary: 'desc' },
          { dataInicio: 'desc' }
        ],
        include: {
          department: true,
          organizationalUnit: true,
          position: true
        }
      }
    }
  });

  const servidores = users.map(user => {
    const protocolosAtivos = user.protocolAssignments.length;
    const protocolosPendentes = user.protocolAssignments.filter(
      a => a.protocol.status === 'PENDENCIA'
    ).length;
    const protocolosPrazoVencido = user.protocolAssignments.filter(
      a => a.protocol.dueDate && new Date(a.protocol.dueDate) < new Date()
    ).length;

    // Cálculo de carga percentual (baseado em 20 protocolos = 100%)
    const cargaPercentual = Math.min(100, Math.round((protocolosAtivos / 20) * 100));

    const primaryAssignment = user.assignments.find(a => a.isPrimary) || user.assignments[0];
    const primaryUserDepartment = user.userDepartments.find(ud => ud.isPrimary) || user.userDepartments[0];
    const resolvedDepartment =
      primaryAssignment?.department ||
      primaryUserDepartment?.department ||
      user.department ||
      null;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      departmentId: resolvedDepartment?.id || null,
      departmentName: resolvedDepartment?.name || null,
      protocolosAtivos,
      protocolosPendentes,
      protocolosPrazoVencido,
      cargaPercentual,
      status: user.healthData?.status || 'ATIVO',
      employeeAssignment: primaryAssignment ? {
        organizationalUnit: primaryAssignment.organizationalUnit?.nome,
        position: primaryAssignment.position?.nome,
        cargaHoraria: primaryAssignment.cargaHoraria
      } : null
    };
  });

  const totalProtocolos = servidores.reduce((sum, s) => sum + s.protocolosAtivos, 0);
  const mediaProtocolosPorServidor = servidores.length > 0
    ? Math.round(totalProtocolos / servidores.length)
    : 0;

  const servidorSobrecarregado = servidores
    .filter(s => s.cargaPercentual >= 75)
    .sort((a, b) => b.cargaPercentual - a.cargaPercentual)[0];

  const servidorDisponivel = servidores
    .filter(s => s.status === 'ATIVO' && s.cargaPercentual < 50)
    .sort((a, b) => a.cargaPercentual - b.cargaPercentual)[0];

  return {
    servidores: servidores.sort((a, b) => a.cargaPercentual - b.cargaPercentual),
    resumo: {
      totalProtocolos,
      totalServidores: servidores.length,
      mediaProtocolosPorServidor,
      servidorSobrecarregado: servidorSobrecarregado ? `${servidorSobrecarregado.name} (${servidorSobrecarregado.cargaPercentual}%)` : null,
      servidorDisponivel: servidorDisponivel ? `${servidorDisponivel.name} (${servidorDisponivel.cargaPercentual}%)` : null
    }
  };
}

/**
 * Sugerir melhor servidor para atribuição (IA simples)
 */
export async function suggestAssignee(protocolId: string, departmentId: string) {
  const workloadStats = await getWorkloadStats(departmentId);

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      service: true
    }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // Calcular score para cada servidor
  const sugestoes = workloadStats.servidores
    .filter(s => s.status === 'ATIVO')
    .map(servidor => {
      let score = 0;

      // Fator 1: Baixa carga de trabalho (40%)
      score += (100 - servidor.cargaPercentual) * 0.4;

      // Fator 2: Sem protocolos vencidos (30%)
      if (servidor.protocolosPrazoVencido === 0) {
        score += 30;
      }

      // Fator 3: Mesma unidade organizacional (20%)
      // TODO: Implementar quando houver unidade no protocolo

      // Fator 4: Experiência (10%)
      // Baseado no número de protocolos concluídos (pode ser melhorado)
      const experienciaScore = Math.min(10, servidor.protocolosAtivos * 0.5);
      score += experienciaScore;

      const razoes = [];
      if (servidor.cargaPercentual < 30) {
        razoes.push(`Baixa carga de trabalho (${servidor.cargaPercentual}%)`);
      }
      if (servidor.protocolosPrazoVencido === 0) {
        razoes.push('Nenhum protocolo com prazo vencido');
      }
      if (servidor.status === 'ATIVO') {
        razoes.push('Status: ATIVO');
      }
      if (servidor.employeeAssignment) {
        razoes.push(`Lotação: ${servidor.employeeAssignment.organizationalUnit || 'N/A'}`);
      }

      return {
        userId: servidor.userId,
        name: servidor.name,
        email: servidor.email,
        score: Math.round(score),
        razoes,
        protocolosAtivos: servidor.protocolosAtivos,
        cargaPercentual: servidor.cargaPercentual,
        employeeAssignment: servidor.employeeAssignment
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 sugestões

  return {
    sugestoes
  };
}

/**
 * Job para reverter delegações expiradas
 */
export async function revertExpiredDelegations() {
  const now = new Date();

  // Buscar delegações expiradas
  const expiredDelegations = await prisma.protocolServerAssignment.findMany({
    where: {
      isDelegacao: true,
      situacao: 'ATIVA',
      ativaAte: {
        lt: now
      }
    },
    include: {
      protocol: true,
      user: true
    }
  });

  const results = [];

  for (const delegation of expiredDelegations) {
    try {
      // Marcar delegação como concluída
      await prisma.protocolServerAssignment.update({
        where: { id: delegation.id },
        data: {
          situacao: 'CONCLUIDA',
          dataFim: now
        }
      });

      // Buscar atribuição original (PRINCIPAL mais recente que não seja delegação)
      const originalAssignment = await prisma.protocolServerAssignment.findFirst({
        where: {
          protocolId: delegation.protocolId,
          tipo: 'PRINCIPAL',
          isDelegacao: false
        },
        orderBy: {
          dataInicio: 'desc'
        },
        include: {
          user: true
        }
      });

      if (originalAssignment) {
        // Reativar atribuição original
        await prisma.protocolServerAssignment.update({
          where: { id: originalAssignment.id },
          data: {
            situacao: 'ATIVA',
            dataFim: null
          }
        });

        // Atualizar protocolo
        await prisma.protocolSimplified.update({
          where: { id: delegation.protocolId },
          data: {
            currentAssignedUserId: originalAssignment.userId
          }
        });

        // Registrar histórico
        await prisma.protocolHistorySimplified.create({
          data: {
            protocolId: delegation.protocolId,
            action: 'DELEGACAO_REVERTIDA',
            comment: `Delegação expirada. Protocolo retornou para ${originalAssignment.user?.name || 'servidor original'}`,
            metadata: {
              delegationId: delegation.id,
              originalAssignmentId: originalAssignment.id
            }
          }
        });

        results.push({
          success: true,
          protocolId: delegation.protocolId,
          message: `Delegação revertida com sucesso`
        });
      }
    } catch (error: any) {
      results.push({
        success: false,
        protocolId: delegation.protocolId,
        error: error.message
      });
    }
  }

  return {
    processedCount: expiredDelegations.length,
    results
  };
}

export default {
  assignProtocolToServer,
  delegateProtocol,
  forwardProtocol,
  assignProtocolToTeam,
  getProtocolAssignments,
  getWorkloadStats,
  suggestAssignee,
  revertExpiredDelegations
};
