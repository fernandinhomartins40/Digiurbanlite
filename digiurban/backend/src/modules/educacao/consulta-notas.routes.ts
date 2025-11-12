import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ConsultaNotasService } from './consulta-notas.service';
import { ConsultaNotasController } from './consulta-notas.controller';

const router = Router();
const prisma = new PrismaClient();
const service = new ConsultaNotasService(prisma);
const controller = new ConsultaNotasController(service);

router.get('/list', controller.handleGetList);
router.get('/:id', controller.handleGetDetails);
router.get('/dashboard', controller.handleGetDashboard);
router.get('/management/entities', controller.handleGetManagementEntities);
router.get('/management/:entity', controller.handleListEntity);
router.post('/management/:entity', controller.handleCreateEntity);
router.put('/management/:entity/:id', controller.handleUpdateEntity);
router.delete('/management/:entity/:id', controller.handleDeleteEntity);

export default router;
