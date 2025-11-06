/**
 * ============================================================================
 * CITIZEN PROGRAMS ROUTES
 * ============================================================================
 * Rotas para cidadãos visualizarem e se inscreverem em programas/cursos
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /api/citizen/programas-rurais
 * Lista programas rurais disponíveis para inscrição
 * Retorna programas com status PLANNED (planejado) e ACTIVE (ativo)
 */
router.get('/programas-rurais', async (req, res) => {
  try {
    const { status } = req.query;

    // Se status específico for solicitado, usar ele
    // Caso contrário, mostrar PLANNED e ACTIVE (programas disponíveis para inscrição)
    const statusFilter = status
      ? { status: status as string }
      : { status: { in: ['PLANNED', 'ACTIVE'] } };

    const programs = await prisma.ruralProgram.findMany({
      where: {
        ...statusFilter
        },
      select: {
        id: true,
        name: true,
        description: true,
        programType: true,
        targetAudience: true,
        startDate: true,
        endDate: true,
        maxParticipants: true,
        currentParticipants: true,
        customFields: true,
        requiredDocuments: true,
        enrollmentSettings: true,
        coordinator: true,
        status: true
        },
      orderBy: {
        startDate: 'desc'
        }
        });

    // Calcular vagas disponíveis e mapear campos para o frontend
    const programsWithAvailability = programs.map(program => ({
      ...program,
      formSchema: program.customFields, // Mapear customFields para formSchema
      availableSlots: program.maxParticipants
        ? program.maxParticipants - program.currentParticipants
        : null,
      hasVacancy: program.maxParticipants
        ? program.currentParticipants < program.maxParticipants
        : true
        }));

    return res.json({
      success: true,
      programs: programsWithAvailability,
      total: programs.length
        });
  } catch (error) {
    console.error('Erro ao listar programas rurais:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar programas'
    });
  }
});

/**
 * GET /api/citizen/programas-rurais/:id
 * Detalhes de um programa rural específico
 */
router.get('/programas-rurais/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const program = await prisma.ruralProgram.findFirst({
      where: {
        id
        }
        });

    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Programa não encontrado'
        });
    }

    // Calcular disponibilidade e mapear campos para o frontend
    const availableSlots = program.maxParticipants
      ? program.maxParticipants - program.currentParticipants
      : null;

    const hasVacancy = program.maxParticipants
      ? program.currentParticipants < program.maxParticipants
      : true;

    return res.json({
      success: true,
      program: {
        ...program,
        formSchema: program.customFields, // Mapear customFields para formSchema
        availableSlots,
        hasVacancy
        }
        });
  } catch (error) {
    console.error('Erro ao buscar programa rural:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar programa'
    });
  }
});

/**
 * GET /api/citizen/cursos-rurais
 * Lista cursos rurais disponíveis para inscrição
 * Retorna cursos com status PLANNED e ACTIVE (disponíveis para inscrição)
 */
router.get('/cursos-rurais', async (req, res) => {
  try {
    const { status } = req.query;

    const statusFilter = status
      ? { status: status as string }
      : { status: { in: ['PLANNED', 'ACTIVE'] } };

    const trainings = await prisma.ruralTraining.findMany({
      where: {
        ...statusFilter
        },
      select: {
        id: true,
        title: true,
        description: true,
        trainingType: true,
        targetAudience: true,
        instructor: true,
        startDate: true,
        endDate: true,
        duration: true,
        maxParticipants: true,
        currentParticipants: true,
        location: true,
        cost: true,
        certificate: true,
        customFields: true,
        requiredDocuments: true,
        enrollmentSettings: true,
        status: true
        },
      orderBy: {
        startDate: 'desc'
        }
        });

    const trainingsWithAvailability = trainings.map(training => ({
      ...training,
      formSchema: training.customFields, // Mapear customFields para formSchema
      availableSlots: training.maxParticipants
        ? training.maxParticipants - training.currentParticipants
        : null,
      hasVacancy: training.maxParticipants
        ? training.currentParticipants < training.maxParticipants
        : true
        }));

    return res.json({
      success: true,
      trainings: trainingsWithAvailability,
      total: trainings.length
        });
  } catch (error) {
    console.error('Erro ao listar cursos rurais:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar cursos'
    });
  }
});

/**
 * GET /api/citizen/cursos-rurais/:id
 * Detalhes de um curso rural específico
 */
router.get('/cursos-rurais/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const training = await prisma.ruralTraining.findFirst({
      where: {
        id
        }
        });

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Curso não encontrado'
        });
    }

    const availableSlots = training.maxParticipants
      ? training.maxParticipants - training.currentParticipants
      : null;

    const hasVacancy = training.maxParticipants
      ? training.currentParticipants < training.maxParticipants
      : true;

    return res.json({
      success: true,
      training: {
        ...training,
        formSchema: training.customFields, // Mapear customFields para formSchema
        availableSlots,
        hasVacancy
        }
        });
  } catch (error) {
    console.error('Erro ao buscar curso rural:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar curso'
    });
  }
});

/**
 * GET /api/citizen/oficinas-culturais
 * Lista oficinas culturais disponíveis para inscrição
 * Retorna oficinas com status PLANNED e ACTIVE (disponíveis para inscrição)
 */
router.get('/oficinas-culturais', async (req, res) => {
  try {
    const { status } = req.query;

    const statusFilter = status
      ? { status: status as string }
      : { status: { in: ['PLANNED', 'ACTIVE'] } };

    const workshops = await prisma.culturalWorkshop.findMany({
      where: {
        ...statusFilter
        },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        instructor: true,
        startDate: true,
        endDate: true,
        schedule: true,
        maxParticipants: true,
        currentParticipants: true,
        isFree: true,
        customFields: true,
        requiredDocuments: true,
        enrollmentSettings: true,
        status: true
        },
      orderBy: {
        startDate: 'desc'
        }
        });

    const workshopsWithAvailability = workshops.map(workshop => ({
      ...workshop,
      formSchema: workshop.customFields, // Mapear customFields para formSchema
      availableSlots: workshop.maxParticipants
        ? workshop.maxParticipants - workshop.currentParticipants
        : null,
      hasVacancy: workshop.maxParticipants
        ? workshop.currentParticipants < workshop.maxParticipants
        : true
        }));

    return res.json({
      success: true,
      workshops: workshopsWithAvailability,
      total: workshops.length
        });
  } catch (error) {
    console.error('Erro ao listar oficinas culturais:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar oficinas'
    });
  }
});

/**
 * GET /api/citizen/oficinas-culturais/:id
 * Detalhes de uma oficina cultural específica
 */
router.get('/oficinas-culturais/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await prisma.culturalWorkshop.findFirst({
      where: {
        id
        }
        });

    if (!workshop) {
      return res.status(404).json({
        success: false,
        error: 'Oficina não encontrada'
        });
    }

    const availableSlots = workshop.maxParticipants
      ? workshop.maxParticipants - workshop.currentParticipants
      : null;

    const hasVacancy = workshop.maxParticipants
      ? workshop.currentParticipants < workshop.maxParticipants
      : true;

    return res.json({
      success: true,
      workshop: {
        ...workshop,
        formSchema: workshop.customFields, // Mapear customFields para formSchema
        availableSlots,
        hasVacancy
        }
        });
  } catch (error) {
    console.error('Erro ao buscar oficina cultural:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar oficina'
    });
  }
});

export default router;
