import { prisma } from '../lib/prisma';


/**
 * Serviço de Sincronização: EmployeeAssignment ↔ UserDepartment
 *
 * Quando um EmployeeAssignment é criado/atualizado/encerrado, sincroniza
 * automaticamente o UserDepartment e User.departmentId para manter
 * compatibilidade com o sistema de protocolos e roteamento.
 */

export async function syncUserDepartmentsFromAssignments(userId: string): Promise<void> {
  try {
    // Buscar todos os vínculos ativos do servidor
    const activeAssignments = await prisma.employeeAssignment.findMany({
      where: {
        userId,
        situacao: { in: ['ATIVO', 'AFASTADO', 'LICENCA'] },
      },
      select: {
        departmentId: true,
        isPrimary: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { dataInicio: 'desc' },
      ],
    });

    // Extrair departmentIds únicos dos vínculos ativos
    const deptIdsFromAssignments = [...new Set(activeAssignments.map(a => a.departmentId))];

    // Buscar UserDepartments atuais
    const currentUserDepts = await prisma.userDepartment.findMany({
      where: { userId, isActive: true },
      select: { departmentId: true, isPrimary: true },
    });
    const currentDeptIds = currentUserDepts.map(ud => ud.departmentId);

    // Determinar qual é o departamento primário dos assignments
    const primaryAssignment = activeAssignments.find(a => a.isPrimary);
    const primaryDeptId = primaryAssignment?.departmentId || deptIdsFromAssignments[0] || null;

    // Desativar UserDepartments que não têm mais assignment ativo
    const deptsToDeactivate = currentDeptIds.filter(id => !deptIdsFromAssignments.includes(id));
    if (deptsToDeactivate.length > 0) {
      await prisma.userDepartment.updateMany({
        where: {
          userId,
          departmentId: { in: deptsToDeactivate },
          isActive: true,
        },
        data: { isActive: false, isPrimary: false },
      });
    }

    // Criar/reativar UserDepartments para assignments que não têm
    for (const deptId of deptIdsFromAssignments) {
      await prisma.userDepartment.upsert({
        where: {
          userId_departmentId: { userId, departmentId: deptId },
        },
        create: {
          userId,
          departmentId: deptId,
          isPrimary: deptId === primaryDeptId,
          isActive: true,
        },
        update: {
          isPrimary: deptId === primaryDeptId,
          isActive: true,
        },
      });
    }

    // Garantir que apenas 1 UserDepartment seja primary
    if (primaryDeptId) {
      await prisma.userDepartment.updateMany({
        where: {
          userId,
          departmentId: { not: primaryDeptId },
          isPrimary: true,
          isActive: true,
        },
        data: { isPrimary: false },
      });
    }

    // Atualizar User.departmentId (legacy) com o departamento primário
    await prisma.user.update({
      where: { id: userId },
      data: { departmentId: primaryDeptId },
    });

    console.log(`🔄 [SYNC] UserDepartments sincronizados para userId=${userId}: ${deptIdsFromAssignments.length} dept(s), primary=${primaryDeptId}`);
  } catch (error) {
    console.error(`❌ [SYNC] Erro ao sincronizar UserDepartments para userId=${userId}:`, error);
  }
}

/**
 * Sincronização em lote: recalcula UserDepartments para TODOS os servidores
 * Útil para migração inicial ou reparo de dados
 */
export async function syncAllUserDepartments(): Promise<{ total: number; synced: number; errors: number }> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let synced = 0;
  let errors = 0;

  for (const user of users) {
    try {
      await syncUserDepartmentsFromAssignments(user.id);
      synced++;
    } catch {
      errors++;
    }
  }

  console.log(`🔄 [SYNC BATCH] Total: ${users.length}, Sincronizados: ${synced}, Erros: ${errors}`);
  return { total: users.length, synced, errors };
}
