import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { SolicitacaoCameraSegurancaService } from './solicitacao-camera-seguranca.service';
import { SolicitacaoCameraSegurancaController } from './solicitacao-camera-seguranca.controller';

const router = Router();
const prisma = new PrismaClient();
const service = new SolicitacaoCameraSegurancaService(prisma);
const controller = new SolicitacaoCameraSegurancaController(service);

router.get('/list', controller.handleGetList);
router.get('/:id', controller.handleGetDetails);
router.get('/dashboard', controller.handleGetDashboard);
router.get('/management/entities', controller.handleGetManagementEntities);
router.get('/management/:entity', controller.handleListEntity);
router.post('/management/:entity', controller.handleCreateEntity);
router.put('/management/:entity/:id', controller.handleUpdateEntity);
router.delete('/management/:entity/:id', controller.handleDeleteEntity);

export default router;
