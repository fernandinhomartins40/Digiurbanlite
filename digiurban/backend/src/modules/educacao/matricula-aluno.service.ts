import { PrismaClient } from '@prisma/client';
import { BaseTabService } from '../core/base';
import { ApprovalConfig, EntityConfig } from '../core/interfaces';

export class MatriculaAlunoService extends BaseTabService {
  constructor(prisma: PrismaClient) { super(prisma); }
  getEntityName() { return 'matriculaaluno'; }
  getApprovalConfig() { return null; }
  getManagementEntities() { return []; }
  getAvailableKPIs() { return ['total', 'pending', 'completed']; }
}
