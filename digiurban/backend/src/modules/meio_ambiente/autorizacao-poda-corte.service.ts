import { PrismaClient } from '@prisma/client';
import { BaseTabService } from '../core/base';
import { ApprovalConfig, EntityConfig } from '../core/interfaces';

export class AutorizacaoPodaCorteService extends BaseTabService {
  constructor(prisma: PrismaClient) { super(prisma); }
  getEntityName() { return 'autorizacaopodacorte'; }
  getApprovalConfig() { return null; }
  getManagementEntities() { return []; }
  getAvailableKPIs() { return ['total', 'pending', 'completed']; }
}
