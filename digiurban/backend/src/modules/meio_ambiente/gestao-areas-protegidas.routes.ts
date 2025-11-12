import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { GestaoAreasProtegidasService } from './gestao-areas-protegidas.service';
import { GestaoAreasProtegidasController } from './gestao-areas-protegidas.controller';

const router = Router();
const prisma = new PrismaClient();
const service = new GestaoAreasProtegidasService(prisma);
const controller = new GestaoAreasProtegidasController(service);

router.get('/list', controller.handleGetList);
router.get('/:id', controller.handleGetDetails);
router.get('/dashboard', controller.handleGetDashboard);
router.get('/management/entities', controller.handleGetManagementEntities);
router.get('/management/:entity', controller.handleListEntity);
router.post('/management/:entity', controller.handleCreateEntity);
router.put('/management/:entity/:id', controller.handleUpdateEntity);
router.delete('/management/:entity/:id', controller.handleDeleteEntity);

export default router;
