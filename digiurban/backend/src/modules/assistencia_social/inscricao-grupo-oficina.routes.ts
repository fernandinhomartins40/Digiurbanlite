import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { InscricaoGrupoOficinaService } from './inscricao-grupo-oficina.service';
import { InscricaoGrupoOficinaController } from './inscricao-grupo-oficina.controller';

const router = Router();
const prisma = new PrismaClient();
const service = new InscricaoGrupoOficinaService(prisma);
const controller = new InscricaoGrupoOficinaController(service);

router.get('/list', controller.handleGetList);
router.get('/:id', controller.handleGetDetails);
router.get('/dashboard', controller.handleGetDashboard);
router.get('/management/entities', controller.handleGetManagementEntities);
router.get('/management/:entity', controller.handleListEntity);
router.post('/management/:entity', controller.handleCreateEntity);
router.put('/management/:entity/:id', controller.handleUpdateEntity);
router.delete('/management/:entity/:id', controller.handleDeleteEntity);

export default router;
