import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// ROTAS DE ESTATÍSTICAS DOS CADASTROS
// ============================================================

/**
 * GET /api/apps/saude/cadastros/unidades/stats
 * Estatísticas de unidades de saúde
 */
router.get('/unidades/stats', async (req: Request, res: Response) => {
  try {
    const [total, ativas, porTipo] = await Promise.all([
      prisma.unidadeSaude.count(),
      prisma.unidadeSaude.count({ where: { isActive: true } }),
      prisma.unidadeSaude.groupBy({
        by: ['tipo'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    res.json({
      total,
      ativas,
      porTipo: porTipo.map((item) => ({
        tipo: item.tipo,
        quantidade: item._count,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao buscar stats de unidades:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/especialidades/stats
 * Estatísticas de especialidades médicas
 */
router.get('/especialidades/stats', async (req: Request, res: Response) => {
  try {
    const [total, ativas] = await Promise.all([
      prisma.especialidadeMedica.count(),
      prisma.especialidadeMedica.count({ where: { isActive: true } }),
    ]);

    res.json({ total, ativas });
  } catch (error: any) {
    console.error('Erro ao buscar stats de especialidades:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/salas/stats
 * Estatísticas de salas e consultórios
 */
router.get('/salas/stats', async (req: Request, res: Response) => {
  try {
    const [total, ativas, porTipo] = await Promise.all([
      prisma.salaConsultorio.count(),
      prisma.salaConsultorio.count({ where: { ativa: true } }),
      prisma.salaConsultorio.groupBy({
        by: ['tipo'],
        _count: true,
        where: { ativa: true },
      }),
    ]);

    res.json({
      total,
      ativas,
      porTipo: porTipo.map((item) => ({
        tipo: item.tipo,
        quantidade: item._count,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao buscar stats de salas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/turnos/stats
 * Estatísticas de turnos de trabalho
 */
router.get('/turnos/stats', async (req: Request, res: Response) => {
  try {
    const [total, ativos] = await Promise.all([
      prisma.turnoTrabalho.count(),
      prisma.turnoTrabalho.count({ where: { ativo: true } }),
    ]);

    res.json({ total, ativos });
  } catch (error: any) {
    console.error('Erro ao buscar stats de turnos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/agendas/stats
 * Estatísticas de agendas médicas
 */
router.get('/agendas/stats', async (req: Request, res: Response) => {
  try {
    const [total, ativas] = await Promise.all([
      prisma.agendaMedica.count(),
      prisma.agendaMedica.count({ where: { isActive: true } }),
    ]);

    res.json({ total, ativas });
  } catch (error: any) {
    console.error('Erro ao buscar stats de agendas:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE UNIDADES DE SAÚDE
// ============================================================

/**
 * GET /api/apps/saude/cadastros/unidades
 * Listar unidades de saúde
 */
router.get('/unidades', async (req: Request, res: Response) => {
  try {
    const { search, tipo, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { cnes: { contains: search as string, mode: 'insensitive' } },
        { endereco: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const unidades = await prisma.unidadeSaude.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    res.json(unidades);
  } catch (error: any) {
    console.error('Erro ao buscar unidades:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/unidades/:id
 * Buscar unidade específica
 */
router.get('/unidades/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id },
    });

    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    res.json(unidade);
  } catch (error: any) {
    console.error('Erro ao buscar unidade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/unidades
 * Criar nova unidade de saúde
 */
router.post('/unidades', async (req: Request, res: Response) => {
  try {
    const { nome, tipo, cnes, endereco, bairro, cep, telefone, email, horarioFuncionamento, isActive } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!tipo) {
      return res.status(400).json({ error: 'Tipo é obrigatório' });
    }

    const unidade = await prisma.unidadeSaude.create({
      data: {
        nome,
        tipo,
        cnes: cnes || null,
        endereco: endereco || null,
        bairro: bairro || null,
        cep: cep || null,
        telefone: telefone || null,
        email: email || null,
        horario: horarioFuncionamento || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json(unidade);
  } catch (error: any) {
    console.error('Erro ao criar unidade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/unidades/:id
 * Atualizar unidade de saúde
 */
router.put('/unidades/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, tipo, cnes, endereco, bairro, cep, telefone, email, horarioFuncionamento, isActive } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (cnes !== undefined) updateData.cnes = cnes || null;
    if (endereco !== undefined) updateData.endereco = endereco || null;
    if (bairro !== undefined) updateData.bairro = bairro || null;
    if (cep !== undefined) updateData.cep = cep || null;
    if (telefone !== undefined) updateData.telefone = telefone || null;
    if (email !== undefined) updateData.email = email || null;
    if (horarioFuncionamento !== undefined) updateData.horario = horarioFuncionamento || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const unidade = await prisma.unidadeSaude.update({
      where: { id },
      data: updateData,
    });

    res.json(unidade);
  } catch (error: any) {
    console.error('Erro ao atualizar unidade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/unidades/:id
 * Remover unidade de saúde
 */
router.delete('/unidades/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.unidadeSaude.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Unidade removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover unidade:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE PROFISSIONAIS DE SAÚDE
// ============================================================

// ============================================================
// ROTAS DE ESPECIALIDADES MÉDICAS
// ============================================================

/**
 * GET /api/apps/saude/cadastros/especialidades
 * Listar especialidades médicas
 */
router.get('/especialidades', async (req: Request, res: Response) => {
  try {
    const { search, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { descricao: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const especialidades = await prisma.especialidadeMedica.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    res.json(especialidades);
  } catch (error: any) {
    console.error('Erro ao buscar especialidades:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/especialidades/:id
 * Buscar especialidade específica
 */
router.get('/especialidades/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const especialidade = await prisma.especialidadeMedica.findUnique({
      where: { id },
    });

    if (!especialidade) {
      return res.status(404).json({ error: 'Especialidade não encontrada' });
    }

    res.json(especialidade);
  } catch (error: any) {
    console.error('Erro ao buscar especialidade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/especialidades
 * Criar nova especialidade médica
 */
router.post('/especialidades', async (req: Request, res: Response) => {
  try {
    const { nome, descricao, isActive } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const especialidade = await prisma.especialidadeMedica.create({
      data: {
        nome,
        descricao: descricao || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json(especialidade);
  } catch (error: any) {
    console.error('Erro ao criar especialidade:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Especialidade já cadastrada' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/especialidades/:id
 * Atualizar especialidade médica
 */
router.put('/especialidades/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao, isActive } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const especialidade = await prisma.especialidadeMedica.update({
      where: { id },
      data: updateData,
    });

    res.json(especialidade);
  } catch (error: any) {
    console.error('Erro ao atualizar especialidade:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Nome de especialidade já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/especialidades/:id
 * Remover especialidade médica
 */
router.delete('/especialidades/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.especialidadeMedica.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Especialidade removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover especialidade:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE SALAS E CONSULTÓRIOS
// ============================================================

/**
 * GET /api/apps/saude/cadastros/salas
 * Listar salas e consultórios
 */
router.get('/salas', async (req: Request, res: Response) => {
  try {
    const { search, tipo, isActive, unidadeId } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { numero: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (isActive !== undefined) {
      where.ativa = isActive === 'true';
    }

    if (unidadeId) {
      where.unidadeId = unidadeId;
    }

    const salas = await prisma.salaConsultorio.findMany({
      where,
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Transformar para o formato esperado pelo frontend
    const salasFormatadas = salas.map((sala) => ({
      ...sala,
      unidade: sala.unidade,
      unidadeNome: sala.unidade.nome,
      isActive: sala.ativa,
    }));

    res.json(salasFormatadas);
  } catch (error: any) {
    console.error('Erro ao buscar salas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/salas/:id
 * Buscar sala específica
 */
router.get('/salas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sala = await prisma.salaConsultorio.findUnique({
      where: { id },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            endereco: true,
          },
        },
      },
    });

    if (!sala) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    res.json(sala);
  } catch (error: any) {
    console.error('Erro ao buscar sala:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/salas
 * Criar nova sala/consultório
 */
router.post('/salas', async (req: Request, res: Response) => {
  try {
    const { nome, numero, tipo, capacidade, equipamentos, unidadeId, ativa } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!unidadeId) {
      return res.status(400).json({ error: 'Unidade de Saúde é obrigatória' });
    }

    // Verificar se a unidade existe
    const unidadeExists = await prisma.unidadeSaude.findUnique({
      where: { id: unidadeId },
      select: { id: true },
    });

    if (!unidadeExists) {
      return res.status(400).json({ error: 'Unidade de saúde não encontrada' });
    }

    // Processar equipamentos: se vier como string, transformar em array
    let equipamentosArray = null;
    if (equipamentos) {
      if (typeof equipamentos === 'string' && equipamentos.trim()) {
        // Dividir por vírgula, ponto e vírgula ou quebra de linha
        equipamentosArray = equipamentos
          .split(/[,;\n]/)
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0);
      } else if (Array.isArray(equipamentos)) {
        equipamentosArray = equipamentos.filter((e) => e && e.trim());
      }
    }

    const sala = await prisma.salaConsultorio.create({
      data: {
        nome,
        numero: numero || null,
        tipo: tipo || 'CONSULTORIO',
        capacidade: capacidade ? parseInt(capacidade) : null,
        equipamentos: equipamentosArray || undefined,
        unidadeId,
        ativa: ativa !== undefined ? ativa : true,
      },
    });

    res.status(201).json(sala);
  } catch (error: any) {
    console.error('Erro ao criar sala:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/salas/:id
 * Atualizar sala/consultório
 */
router.put('/salas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, numero, tipo, capacidade, equipamentos, ativa, unidadeId } = req.body;

    // Verificar se a unidade existe caso seja fornecida
    if (unidadeId) {
      const unidadeExists = await prisma.unidadeSaude.findUnique({
        where: { id: unidadeId },
        select: { id: true },
      });

      if (!unidadeExists) {
        return res.status(400).json({ error: 'Unidade de saúde não encontrada' });
      }
    }

    // Processar equipamentos: se vier como string, transformar em array
    let equipamentosArray = null;
    if (equipamentos) {
      if (typeof equipamentos === 'string' && equipamentos.trim()) {
        // Dividir por vírgula, ponto e vírgula ou quebra de linha
        equipamentosArray = equipamentos
          .split(/[,;\n]/)
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0);
      } else if (Array.isArray(equipamentos)) {
        equipamentosArray = equipamentos.filter((e) => e && e.trim());
      }
    }

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (numero !== undefined) updateData.numero = numero;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (capacidade !== undefined) updateData.capacidade = capacidade ? parseInt(capacidade) : null;
    if (equipamentos !== undefined) updateData.equipamentos = equipamentosArray || undefined;
    if (ativa !== undefined) updateData.ativa = ativa;
    if (unidadeId !== undefined) updateData.unidadeId = unidadeId;

    const sala = await prisma.salaConsultorio.update({
      where: { id },
      data: updateData,
    });

    res.json(sala);
  } catch (error: any) {
    console.error('Erro ao atualizar sala:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/salas/:id
 * Remover sala/consultório
 */
router.delete('/salas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.salaConsultorio.update({
      where: { id },
      data: { ativa: false },
    });

    res.json({ message: 'Sala removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover sala:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE TURNOS DE TRABALHO
// ============================================================

/**
 * GET /api/apps/saude/cadastros/turnos
 * Listar turnos de trabalho
 */
router.get('/turnos', async (req: Request, res: Response) => {
  try {
    const { search, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { descricao: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.ativo = isActive === 'true';
    }

    const turnos = await prisma.turnoTrabalho.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    // Transformar para o formato esperado pelo frontend
    const turnosFormatados = turnos.map((turno) => ({
      ...turno,
      isActive: turno.ativo,
      periodo: turno.nome, // Mapear nome como período
    }));

    res.json(turnosFormatados);
  } catch (error: any) {
    console.error('Erro ao buscar turnos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/turnos/:id
 * Buscar turno específico
 */
router.get('/turnos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turnoTrabalho.findUnique({
      where: { id },
    });

    if (!turno) {
      return res.status(404).json({ error: 'Turno não encontrado' });
    }

    res.json(turno);
  } catch (error: any) {
    console.error('Erro ao buscar turno:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/turnos
 * Criar novo turno de trabalho
 */
router.post('/turnos', async (req: Request, res: Response) => {
  try {
    const { nome, periodo, horaInicio, horaFim, isActive } = req.body;

    if (!nome || !horaInicio || !horaFim) {
      return res.status(400).json({ error: 'Nome, horário de início e fim são obrigatórios' });
    }

    const turno = await prisma.turnoTrabalho.create({
      data: {
        nome,
        descricao: periodo || null,
        horaInicio,
        horaFim,
        ativo: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json(turno);
  } catch (error: any) {
    console.error('Erro ao criar turno:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Turno já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/turnos/:id
 * Atualizar turno de trabalho
 */
router.put('/turnos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao, horaInicio, horaFim, ativo } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!horaInicio || !horaFim) {
      return res.status(400).json({ error: 'Horário de início e fim são obrigatórios' });
    }

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao || null;
    if (horaInicio !== undefined) updateData.horaInicio = horaInicio;
    if (horaFim !== undefined) updateData.horaFim = horaFim;
    if (ativo !== undefined) updateData.ativo = ativo;

    const turno = await prisma.turnoTrabalho.update({
      where: { id },
      data: updateData,
    });

    res.json(turno);
  } catch (error: any) {
    console.error('Erro ao atualizar turno:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Nome de turno já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/turnos/:id
 * Remover turno de trabalho
 */
router.delete('/turnos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.turnoTrabalho.update({
      where: { id },
      data: { ativo: false },
    });

    res.json({ message: 'Turno removido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover turno:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE AGENDAS MÉDICAS
// ============================================================

/**
 * GET /api/apps/saude/cadastros/agendas
 * Listar agendas médicas
 */
router.get('/agendas', async (req: Request, res: Response) => {
  try {
    const { search, profissionalId, unidadeId, isActive } = req.query;

    const where: any = {};

    if (profissionalId) {
      where.profissionalId = profissionalId;
    }

    if (unidadeId) {
      where.unidadeId = unidadeId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const agendas = await prisma.agendaMedica.findMany({
      where,
      include: {
        especialidade: {
          select: {
            id: true,
            nome: true,
          },
        },
        sala: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformar para o formato esperado pelo frontend
    const agendasFormatadas = agendas.map((agenda) => ({
      ...agenda,
      profissionalNome: 'Profissional', // TODO: Buscar nome do profissional
      unidadeNome: 'Unidade', // TODO: Buscar nome da unidade
      especialidade: agenda.especialidade,
      sala: agenda.sala,
    }));

    res.json(agendasFormatadas);
  } catch (error: any) {
    console.error('Erro ao buscar agendas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/agendas/:id
 * Buscar agenda específica
 */
router.get('/agendas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agenda = await prisma.agendaMedica.findUnique({
      where: { id },
      include: {
        especialidade: true,
        sala: true,
        turno: true,
      },
    });

    if (!agenda) {
      return res.status(404).json({ error: 'Agenda não encontrada' });
    }

    res.json(agenda);
  } catch (error: any) {
    console.error('Erro ao buscar agenda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/agendas
 * Criar nova agenda médica
 */
router.post('/agendas', async (req: Request, res: Response) => {
  try {
    const {
      nome,
      tipo,
      dataInicio,
      dataFim,
      horaInicio,
      horaFim,
      vagasPorDia,
      duracaoConsulta,
      profissionalId,
      unidadeId,
      especialidadeId,
      salaId,
      isActive,
    } = req.body;

    // Validações obrigatórias
    if (!dataInicio) {
      return res.status(400).json({ error: 'Data de início é obrigatória' });
    }

    if (!profissionalId) {
      return res.status(400).json({ error: 'Profissional é obrigatório' });
    }

    if (!unidadeId) {
      return res.status(400).json({ error: 'Unidade é obrigatória' });
    }

    // Validar se o profissional está vinculado à unidade
    const vinculo = await prisma.profissionalUnidade.findFirst({
      where: {
        profissionalId,
        unidadeId,
        ativo: true,
        OR: [
          { dataFim: null },
          { dataFim: { gte: new Date() } },
        ],
      },
      include: {
        profissional: { select: { name: true } },
        unidade: { select: { nome: true } },
      },
    });

    if (!vinculo) {
      return res.status(400).json({
        error: 'Profissional não está vinculado a esta unidade',
        detalhes: 'O profissional precisa estar vinculado à unidade antes de criar uma agenda',
      });
    }

    const agenda = await prisma.agendaMedica.create({
      data: {
        profissionalId,
        unidadeId,
        especialidadeId: especialidadeId || null,
        salaId: salaId || null,
        diaSemana: new Date(dataInicio).getDay(),
        horaInicio: horaInicio || '08:00',
        horaFim: horaFim || '17:00',
        tempoPorConsulta: duracaoConsulta ? parseInt(duracaoConsulta) : 30,
        vagasDisponiveis: vagasPorDia ? parseInt(vagasPorDia) : 20,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json(agenda);
  } catch (error: any) {
    console.error('Erro ao criar agenda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/agendas/:id
 * Atualizar agenda médica
 */
router.put('/agendas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      horaInicio,
      horaFim,
      tempoPorConsulta,
      vagasDisponiveis,
      dataInicio,
      dataFim,
      isActive,
      especialidadeId,
      salaId,
    } = req.body;

    if (!dataInicio) {
      return res.status(400).json({ error: 'Data de início é obrigatória' });
    }

    const updateData: any = {};
    if (horaInicio !== undefined) updateData.horaInicio = horaInicio;
    if (horaFim !== undefined) updateData.horaFim = horaFim;
    if (tempoPorConsulta !== undefined) updateData.tempoPorConsulta = parseInt(tempoPorConsulta);
    if (vagasDisponiveis !== undefined) updateData.vagasDisponiveis = parseInt(vagasDisponiveis);
    if (dataInicio !== undefined) updateData.dataInicio = new Date(dataInicio);
    if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
    if (especialidadeId !== undefined) updateData.especialidadeId = especialidadeId || null;
    if (salaId !== undefined) updateData.salaId = salaId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Atualizar diaSemana se dataInicio mudou
    if (dataInicio) {
      updateData.diaSemana = new Date(dataInicio).getDay();
    }

    const agenda = await prisma.agendaMedica.update({
      where: { id },
      data: updateData,
    });

    res.json(agenda);
  } catch (error: any) {
    console.error('Erro ao atualizar agenda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/agendas/:id
 * Remover agenda médica
 */
router.delete('/agendas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.agendaMedica.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Agenda removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover agenda:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE VÍNCULOS PROFISSIONAL-UNIDADE
// ============================================================

/**
 * GET /api/apps/saude/cadastros/vinculos
 * Listar vínculos profissional-unidade
 */
router.get('/vinculos', async (req: Request, res: Response) => {
  try {
    const { profissionalId, unidadeId, ativo } = req.query;

    const where: any = {};

    if (profissionalId) {
      where.profissionalId = profissionalId;
    }

    if (unidadeId) {
      where.unidadeId = unidadeId;
    }

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
      if (where.ativo) {
        where.OR = [
          { dataFim: null },
          { dataFim: { gte: new Date() } },
        ];
      }
    }

    const vinculos = await prisma.profissionalUnidade.findMany({
      where,
      include: {
        profissional: {
          select: {
            id: true,
            name: true,
            email: true,
            dadosSaude: {
              select: {
                categoria: true,
                especialidades: true,
              },
            },
          },
        },
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
      orderBy: [{ profissional: { name: 'asc' } }, { dataInicio: 'desc' }],
    });

    res.json(vinculos);
  } catch (error: any) {
    console.error('Erro ao buscar vínculos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/vinculos/:id
 * Buscar vínculo específico
 */
router.get('/vinculos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vinculo = await prisma.profissionalUnidade.findUnique({
      where: { id },
      include: {
        profissional: true,
        unidade: true,
      },
    });

    if (!vinculo) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    res.json(vinculo);
  } catch (error: any) {
    console.error('Erro ao buscar vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/vinculos
 * Criar novo vínculo profissional-unidade
 */
router.post('/vinculos', async (req: Request, res: Response) => {
  try {
    const {
      profissionalId,
      unidadeId,
      dataInicio,
      dataFim,
      cargaHoraria,
      percentualDedicacao,
      observacoes,
      userId,
      userName,
    } = req.body;

    if (!profissionalId || !unidadeId) {
      return res.status(400).json({ error: 'Profissional e unidade são obrigatórios' });
    }

    // Verificar se profissional existe
    const profissional = await prisma.user.findUnique({
      where: { id: profissionalId },
      select: { id: true, name: true },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Verificar se unidade existe
    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id: unidadeId },
      select: { id: true, nome: true },
    });

    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    // Verificar se já existe vínculo ativo
    const vinculoExistente = await prisma.profissionalUnidade.findFirst({
      where: {
        profissionalId,
        unidadeId,
        ativo: true,
        OR: [
          { dataFim: null },
          { dataFim: { gte: new Date() } },
        ],
      },
    });

    if (vinculoExistente) {
      return res.status(400).json({
        error: 'Já existe um vínculo ativo entre este profissional e unidade',
      });
    }

    // Validar percentual de dedicação
    if (percentualDedicacao !== undefined && (percentualDedicacao < 0 || percentualDedicacao > 100)) {
      return res.status(400).json({ error: 'Percentual de dedicação deve estar entre 0 e 100' });
    }

    // Criar vínculo
    const vinculo = await prisma.profissionalUnidade.create({
      data: {
        profissionalId,
        unidadeId,
        dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        dataFim: dataFim ? new Date(dataFim) : null,
        ativo: true,
        cargaHoraria: cargaHoraria ? parseInt(cargaHoraria) : null,
        percentualDedicacao: percentualDedicacao ? parseInt(percentualDedicacao) : null,
        observacoes: observacoes || null,
      },
      include: {
        profissional: { select: { name: true } },
        unidade: { select: { nome: true } },
      },
    });

    // Criar auditoria
    await prisma.auditoriaVinculo.create({
      data: {
        vinculoId: vinculo.id,
        tipo: 'CRIACAO',
        profissionalId,
        profissionalNome: profissional.name,
        unidadeDestinoId: unidadeId,
        unidadeDestinoNome: unidade.nome,
        userId: userId || null,
        userName: userName || null,
        motivo: observacoes || 'Vínculo criado',
        detalhes: {
          cargaHoraria,
          percentualDedicacao,
          dataInicio: vinculo.dataInicio,
          dataFim: vinculo.dataFim,
        },
      },
    });

    res.status(201).json(vinculo);
  } catch (error: any) {
    console.error('Erro ao criar vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/vinculos/:id
 * Atualizar vínculo profissional-unidade
 */
router.put('/vinculos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      dataFim,
      cargaHoraria,
      percentualDedicacao,
      observacoes,
      ativo,
      userId,
      userName,
      motivo,
    } = req.body;

    // Buscar vínculo atual
    const vinculoAtual = await prisma.profissionalUnidade.findUnique({
      where: { id },
      include: {
        profissional: { select: { name: true } },
        unidade: { select: { nome: true } },
      },
    });

    if (!vinculoAtual) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    // Validar percentual de dedicação
    if (percentualDedicacao !== undefined && (percentualDedicacao < 0 || percentualDedicacao > 100)) {
      return res.status(400).json({ error: 'Percentual de dedicação deve estar entre 0 e 100' });
    }

    // Determinar tipo de auditoria
    let tipoAuditoria: 'ATIVACAO' | 'DESATIVACAO' | 'ALTERACAO_CARGA_HORARIA' | 'ALTERACAO_PERIODO' = 'ALTERACAO_PERIODO';

    if (ativo !== undefined && ativo !== vinculoAtual.ativo) {
      tipoAuditoria = ativo ? 'ATIVACAO' : 'DESATIVACAO';
    } else if (cargaHoraria !== undefined && cargaHoraria !== vinculoAtual.cargaHoraria) {
      tipoAuditoria = 'ALTERACAO_CARGA_HORARIA';
    }

    // Atualizar vínculo
    const vinculo = await prisma.profissionalUnidade.update({
      where: { id },
      data: {
        dataFim: dataFim !== undefined ? (dataFim ? new Date(dataFim) : null) : undefined,
        cargaHoraria: cargaHoraria !== undefined ? parseInt(cargaHoraria) : undefined,
        percentualDedicacao: percentualDedicacao !== undefined ? parseInt(percentualDedicacao) : undefined,
        observacoes: observacoes !== undefined ? observacoes : undefined,
        ativo: ativo !== undefined ? ativo : undefined,
      },
      include: {
        profissional: { select: { name: true } },
        unidade: { select: { nome: true } },
      },
    });

    // Criar auditoria
    await prisma.auditoriaVinculo.create({
      data: {
        vinculoId: vinculo.id,
        tipo: tipoAuditoria,
        profissionalId: vinculo.profissionalId,
        profissionalNome: vinculo.profissional.name,
        unidadeDestinoId: vinculo.unidadeId,
        unidadeDestinoNome: vinculo.unidade.nome,
        userId: userId || null,
        userName: userName || null,
        motivo: motivo || `Vínculo atualizado: ${tipoAuditoria}`,
        detalhes: {
          cargaHorariaAnterior: vinculoAtual.cargaHoraria,
          cargaHorariaNova: vinculo.cargaHoraria,
          percentualDedicacaoAnterior: vinculoAtual.percentualDedicacao,
          percentualDedicacaoNovo: vinculo.percentualDedicacao,
          ativoAnterior: vinculoAtual.ativo,
          ativoNovo: vinculo.ativo,
        },
      },
    });

    res.json(vinculo);
  } catch (error: any) {
    console.error('Erro ao atualizar vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/vinculos/:id
 * Desativar vínculo profissional-unidade
 */
router.delete('/vinculos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, userName, motivo } = req.body;

    // Buscar vínculo
    const vinculoAtual = await prisma.profissionalUnidade.findUnique({
      where: { id },
      include: {
        profissional: { select: { name: true } },
        unidade: { select: { nome: true } },
      },
    });

    if (!vinculoAtual) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    // Desativar vínculo (soft delete)
    const vinculo = await prisma.profissionalUnidade.update({
      where: { id },
      data: {
        ativo: false,
        dataFim: new Date(),
      },
    });

    // Criar auditoria
    await prisma.auditoriaVinculo.create({
      data: {
        vinculoId: id,
        tipo: 'DESATIVACAO',
        profissionalId: vinculoAtual.profissionalId,
        profissionalNome: vinculoAtual.profissional.name,
        unidadeOrigemId: vinculoAtual.unidadeId,
        unidadeOrigemNome: vinculoAtual.unidade.nome,
        userId: userId || null,
        userName: userName || null,
        motivo: motivo || 'Vínculo desativado',
        detalhes: {
          dataDesativacao: new Date(),
        },
      },
    });

    res.json({ message: 'Vínculo desativado com sucesso', vinculo });
  } catch (error: any) {
    console.error('Erro ao remover vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/vinculos/auditoria/:vinculoId
 * Buscar histórico de auditoria de um vínculo
 */
router.get('/vinculos/auditoria/:vinculoId', async (req: Request, res: Response) => {
  try {
    const { vinculoId } = req.params;

    const auditorias = await prisma.auditoriaVinculo.findMany({
      where: { vinculoId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(auditorias);
  } catch (error: any) {
    console.error('Erro ao buscar auditoria:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE EQUIPES ESF
// ============================================================

/**
 * GET /api/apps/saude/cadastros/equipes
 * Listar todas as equipes ESF
 */
router.get('/equipes', async (req: Request, res: Response) => {
  try {
    const { unidadeId, ativo } = req.query;

    const where: any = {};
    if (unidadeId) where.unidadeId = unidadeId as string;
    if (ativo !== undefined) where.ativo = ativo === 'true';

    const equipes = await prisma.equipeSaude.findMany({
      where,
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        profissionais: {
          where: { ativo: true },
          include: {
            profissional: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        microareas: {
          where: { ativo: true },
          include: {
            _count: {
              select: {
                citizens: true,
              },
            },
          },
        },
        _count: {
          select: {
            citizens: true,
            profissionais: true,
            microareas: true,
          },
        },
      },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });

    res.json(equipes);
  } catch (error: any) {
    console.error('Erro ao buscar equipes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/equipes/:id
 * Buscar equipe específica
 */
router.get('/equipes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipe = await prisma.equipeSaude.findUnique({
      where: { id },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            fluxoAtendimento: true,
          },
        },
        profissionais: {
          include: {
            profissional: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { ativo: 'desc' },
        },
        microareas: {
          include: {
            acs: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                citizens: true,
              },
            },
          },
          orderBy: { numero: 'asc' },
        },
        _count: {
          select: {
            citizens: true,
            profissionais: true,
            microareas: true,
          },
        },
      },
    });

    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    res.json(equipe);
  } catch (error: any) {
    console.error('Erro ao buscar equipe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/equipes
 * Criar nova equipe ESF
 */
router.post('/equipes', async (req: Request, res: Response) => {
  try {
    const { ine, nome, tipo, unidadeId, createdBy, ativo } = req.body;

    // Validações
    if (!ine || !nome || !tipo || !unidadeId) {
      return res.status(400).json({
        error: 'Campos obrigatórios: ine, nome, tipo, unidadeId',
      });
    }

    // Verificar se INE já existe
    const ineExistente = await prisma.equipeSaude.findUnique({
      where: { ine },
    });

    if (ineExistente) {
      return res.status(400).json({
        error: 'Já existe uma equipe com este INE',
      });
    }

    // Verificar se unidade existe
    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id: unidadeId },
    });

    if (!unidade) {
      return res.status(404).json({ error: 'Unidade de saúde não encontrada' });
    }

    const equipe = await prisma.equipeSaude.create({
      data: {
        ine,
        nome,
        tipo,
        unidadeId,
        createdBy,
        ativo: ativo !== undefined ? ativo : true,
      },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
    });

    res.status(201).json(equipe);
  } catch (error: any) {
    console.error('Erro ao criar equipe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/equipes/:id
 * Atualizar equipe ESF
 */
router.put('/equipes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ine, nome, tipo, ativo } = req.body;

    // Validações obrigatórias
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!ine) {
      return res.status(400).json({ error: 'INE é obrigatório' });
    }

    if (!tipo) {
      return res.status(400).json({ error: 'Tipo é obrigatório' });
    }

    const equipeExistente = await prisma.equipeSaude.findUnique({
      where: { id },
    });

    if (!equipeExistente) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    // Se está mudando o INE, verificar se já não existe
    if (ine && ine !== equipeExistente.ine) {
      const ineExistente = await prisma.equipeSaude.findUnique({
        where: { ine },
      });

      if (ineExistente) {
        return res.status(400).json({
          error: 'Já existe uma equipe com este INE',
        });
      }
    }

    const updateData: any = {};
    if (ine !== undefined) updateData.ine = ine;
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (ativo !== undefined) updateData.ativo = ativo;

    const equipe = await prisma.equipeSaude.update({
      where: { id },
      data: updateData,
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        _count: {
          select: {
            profissionais: true,
            microareas: true,
            citizens: true,
          },
        },
      },
    });

    res.json(equipe);
  } catch (error: any) {
    console.error('Erro ao atualizar equipe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/equipes/:id
 * Desativar equipe ESF (soft delete)
 */
router.delete('/equipes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipe = await prisma.equipeSaude.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            citizens: true,
            profissionais: true,
          },
        },
      },
    });

    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    // Verificar se tem cidadãos vinculados
    if (equipe._count.citizens > 0) {
      return res.status(400).json({
        error: `Não é possível desativar equipe com ${equipe._count.citizens} cidadão(s) vinculado(s)`,
      });
    }

    // Soft delete
    await prisma.equipeSaude.update({
      where: { id },
      data: { ativo: false },
    });

    res.json({ message: 'Equipe desativada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar equipe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/equipes/:id/profissionais
 * Listar profissionais da equipe
 */
router.get('/equipes/:id/profissionais', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profissionais = await prisma.profissionalEquipe.findMany({
      where: { equipeId: id },
      include: {
        profissional: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ ativo: 'desc' }, { dataInicio: 'desc' }],
    });

    res.json(profissionais);
  } catch (error: any) {
    console.error('Erro ao buscar profissionais da equipe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/equipes/:id/profissionais
 * Adicionar profissional à equipe
 */
router.post('/equipes/:id/profissionais', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { profissionalId, cbo, funcao } = req.body;

    if (!profissionalId || !cbo) {
      return res.status(400).json({
        error: 'Campos obrigatórios: profissionalId, cbo',
      });
    }

    // Verificar se equipe existe
    const equipe = await prisma.equipeSaude.findUnique({
      where: { id },
    });

    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    // Verificar se profissional existe
    const profissional = await prisma.user.findUnique({
      where: { id: profissionalId },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Verificar se já não está vinculado ativamente
    const vinculoExistente = await prisma.profissionalEquipe.findFirst({
      where: {
        profissionalId,
        equipeId: id,
        ativo: true,
      },
    });

    if (vinculoExistente) {
      return res.status(400).json({
        error: 'Profissional já está vinculado ativamente a esta equipe',
      });
    }

    const vinculo = await prisma.profissionalEquipe.create({
      data: {
        profissionalId,
        equipeId: id,
        cbo,
        funcao,
        ativo: true,
      },
      include: {
        profissional: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(vinculo);
  } catch (error: any) {
    console.error('Erro ao adicionar profissional à equipe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/equipes/:equipeId/profissionais/:vinculoId
 * Remover profissional da equipe
 */
router.delete(
  '/equipes/:equipeId/profissionais/:vinculoId',
  async (req: Request, res: Response) => {
    try {
      const { vinculoId } = req.params;

      const vinculo = await prisma.profissionalEquipe.findUnique({
        where: { id: vinculoId },
      });

      if (!vinculo) {
        return res.status(404).json({ error: 'Vínculo não encontrado' });
      }

      // Soft delete
      await prisma.profissionalEquipe.update({
        where: { id: vinculoId },
        data: {
          ativo: false,
          dataFim: new Date(),
        },
      });

      res.json({ message: 'Profissional removido da equipe com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover profissional da equipe:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// ROTAS DE MICROÁREAS
// ============================================================

/**
 * GET /api/apps/saude/cadastros/microareas
 * Listar todas as microáreas
 */
router.get('/microareas', async (req: Request, res: Response) => {
  try {
    const { equipeId, ativo } = req.query;

    const where: any = {};
    if (equipeId) where.equipeId = equipeId as string;
    if (ativo !== undefined) where.ativo = ativo === 'true';

    const microareas = await prisma.microarea.findMany({
      where,
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            ine: true,
            tipo: true,
          },
        },
        acs: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            citizens: true,
          },
        },
      },
      orderBy: [{ equipeId: 'asc' }, { numero: 'asc' }],
    });

    res.json(microareas);
  } catch (error: any) {
    console.error('Erro ao buscar microáreas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/equipes/:equipeId/microareas
 * Listar microáreas de uma equipe específica
 */
router.get('/equipes/:equipeId/microareas', async (req: Request, res: Response) => {
  try {
    const { equipeId } = req.params;

    const microareas = await prisma.microarea.findMany({
      where: { equipeId },
      include: {
        acs: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            citizens: true,
          },
        },
      },
      orderBy: { numero: 'asc' },
    });

    res.json(microareas);
  } catch (error: any) {
    console.error('Erro ao buscar microáreas da equipe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/microareas
 * Criar nova microárea
 */
router.post('/microareas', async (req: Request, res: Response) => {
  try {
    const { numero, descricao, equipeId, acsId, ativo } = req.body;

    // Validar campos obrigatórios
    if (!numero || !equipeId) {
      return res.status(400).json({ error: 'Número e equipeId são obrigatórios' });
    }

    // Verificar se a equipe existe
    const equipe = await prisma.equipeSaude.findUnique({
      where: { id: equipeId },
    });

    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    // Verificar se já existe microárea com esse número nesta equipe
    const microareaExistente = await prisma.microarea.findFirst({
      where: {
        numero,
        equipeId,
      },
    });

    if (microareaExistente) {
      return res.status(400).json({ error: 'Já existe uma microárea com este número nesta equipe' });
    }

    // Verificar se ACS existe (se fornecido)
    if (acsId) {
      const acs = await prisma.user.findUnique({
        where: { id: acsId },
        include: { dadosSaude: true },
      });

      if (!acs || !acs.dadosSaude || acs.dadosSaude.categoria !== 'ACS') {
        return res.status(400).json({ error: 'ACS não encontrado ou não é um ACS válido' });
      }
    }

    // Criar microárea
    const microarea = await prisma.microarea.create({
      data: {
        numero,
        descricao,
        equipeId,
        acsId,
        ativo: ativo !== undefined ? ativo : true,
      },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            ine: true,
            unidade: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        acs: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            citizens: true,
          },
        },
      },
    });

    res.status(201).json(microarea);
  } catch (error: any) {
    console.error('Erro ao criar microárea:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/microareas/:id
 * Buscar microárea específica
 */
router.get('/microareas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const microarea = await prisma.microarea.findUnique({
      where: { id },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            ine: true,
            tipo: true,
            unidade: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        acs: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        citizens: {
          select: {
            id: true,
            name: true,
            cpf: true,
            phone: true,
          },
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!microarea) {
      return res.status(404).json({ error: 'Microárea não encontrada' });
    }

    res.json(microarea);
  } catch (error: any) {
    console.error('Erro ao buscar microárea:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/equipes/:equipeId/microareas
 * Criar nova microárea para uma equipe
 */
router.post('/equipes/:equipeId/microareas', async (req: Request, res: Response) => {
  try {
    const { equipeId } = req.params;
    const { numero, descricao, acsId, ativo } = req.body;

    if (!numero) {
      return res.status(400).json({
        error: 'Campo obrigatório: numero',
      });
    }

    // Verificar se equipe existe
    const equipe = await prisma.equipeSaude.findUnique({
      where: { id: equipeId },
    });

    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    // Verificar se já existe microárea com este número na equipe
    const microareaExistente = await prisma.microarea.findFirst({
      where: {
        equipeId,
        numero,
      },
    });

    if (microareaExistente) {
      return res.status(400).json({
        error: `Já existe uma microárea com o número ${numero} nesta equipe`,
      });
    }

    // Se foi informado ACS, verificar se existe
    if (acsId) {
      const acs = await prisma.user.findUnique({
        where: { id: acsId },
      });

      if (!acs) {
        return res.status(404).json({ error: 'ACS não encontrado' });
      }
    }

    const microarea = await prisma.microarea.create({
      data: {
        equipeId,
        numero,
        descricao: descricao || null,
        acsId: acsId || null,
        ativo: ativo !== undefined ? ativo : true,
      },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            ine: true,
          },
        },
        acs: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(microarea);
  } catch (error: any) {
    console.error('Erro ao criar microárea:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/microareas/:id
 * Atualizar microárea
 */
router.put('/microareas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { numero, descricao, acsId, ativo } = req.body;

    if (!numero) {
      return res.status(400).json({ error: 'Número é obrigatório' });
    }

    const microareaExistente = await prisma.microarea.findUnique({
      where: { id },
    });

    if (!microareaExistente) {
      return res.status(404).json({ error: 'Microárea não encontrada' });
    }

    // Se está mudando o número, verificar se não existe outro com o mesmo na equipe
    if (numero && numero !== microareaExistente.numero) {
      const numeroExistente = await prisma.microarea.findFirst({
        where: {
          equipeId: microareaExistente.equipeId,
          numero,
          id: { not: id },
        },
      });

      if (numeroExistente) {
        return res.status(400).json({
          error: `Já existe uma microárea com o número ${numero} nesta equipe`,
        });
      }
    }

    // Se está mudando o ACS, verificar se existe (permitir null para remover ACS)
    if (acsId !== undefined && acsId !== null && acsId !== microareaExistente.acsId) {
      const acs = await prisma.user.findUnique({
        where: { id: acsId },
      });

      if (!acs) {
        return res.status(404).json({ error: 'ACS não encontrado' });
      }
    }

    const updateData: any = {};
    if (numero !== undefined) updateData.numero = numero;
    if (descricao !== undefined) updateData.descricao = descricao || null;
    if (acsId !== undefined) updateData.acsId = acsId;
    if (ativo !== undefined) updateData.ativo = ativo;

    const microarea = await prisma.microarea.update({
      where: { id },
      data: updateData,
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            ine: true,
          },
        },
        acs: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            citizens: true,
          },
        },
      },
    });

    res.json(microarea);
  } catch (error: any) {
    console.error('Erro ao atualizar microárea:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/microareas/:id
 * Desativar microárea (soft delete)
 */
router.delete('/microareas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const microarea = await prisma.microarea.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            citizens: true,
          },
        },
      },
    });

    if (!microarea) {
      return res.status(404).json({ error: 'Microárea não encontrada' });
    }

    // Verificar se tem cidadãos vinculados
    if (microarea._count.citizens > 0) {
      return res.status(400).json({
        error: `Não é possível desativar microárea com ${microarea._count.citizens} cidadão(s) vinculado(s)`,
      });
    }

    // Soft delete
    await prisma.microarea.update({
      where: { id },
      data: { ativo: false },
    });

    res.json({ message: 'Microárea desativada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar microárea:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE DADOS DE SAÚDE (DadosSaude)
// ============================================================

/**
 * GET /api/apps/saude/cadastros/dados-saude
 * Listar servidores com dados de saúde
 * Query params:
 * - categoria: filtrar por categoria (MEDICO, ENFERMEIRO, etc)
 * - ativo: filtrar por status ativo (true/false)
 * - semDadosSaude: retorna servidores SEM dados de saúde (true/false)
 * - departmentId: filtrar por departamento
 */
router.get('/dados-saude', async (req: Request, res: Response) => {
  try {
    const { categoria, ativo, semDadosSaude, departmentId } = req.query;

    const where: any = {};

    // Se semDadosSaude=true, retornar apenas servidores SEM dadosSaude
    if (semDadosSaude === 'true') {
      where.dadosSaude = { is: null };

      // Filtro adicional por departamento
      if (departmentId) {
        where.departmentId = departmentId as string;
      }

      // Retornar apenas servidores ativos
      where.isActive = true;
    } else {
      // Construir filtro de dadosSaude
      const dadosSaudeFilter: any = {};

      if (categoria) {
        dadosSaudeFilter.categoria = categoria as string;
      }

      if (ativo !== undefined) {
        dadosSaudeFilter.ativo = ativo === 'true';
      }

      where.dadosSaude = {
        isNot: null,
        ...(Object.keys(dadosSaudeFilter).length > 0 && {
          is: dadosSaudeFilter,
        }),
      };
    }

    const servidores = await prisma.user.findMany({
      where,
      include: {
        dadosSaude: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            vinculosUnidades: true,
            equipesVinculadas: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Mapear para incluir departmentName
    const servidoresComDepartamento = servidores.map((servidor: any) => ({
      ...servidor,
      departmentName: servidor.department?.name || 'Sem departamento',
    }));

    res.json(servidoresComDepartamento);
  } catch (error: any) {
    console.error('Erro ao listar dados de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/dados-saude/:id
 * Buscar dados de saúde de um servidor específico
 */
router.get('/dados-saude/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const servidor = await prisma.user.findUnique({
      where: { id },
      include: {
        dadosSaude: true,
        _count: {
          select: {
            vinculosUnidades: true,
            equipesVinculadas: true,
          },
        },
      },
    });

    if (!servidor) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    res.json(servidor);
  } catch (error: any) {
    console.error('Erro ao buscar dados de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/dados-saude
 * Criar vínculo de saúde para um servidor
 */
router.post('/dados-saude', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      categoria,
      registroProfissional,
      tipoRegistro,
      ufRegistro,
      cns,
      especialidades,
      cbo,
      aceitaAgendamento,
      tempoMedioConsulta,
      observacoes,
    } = req.body;

    // Validar campos obrigatórios
    if (!userId || !categoria) {
      return res.status(400).json({ error: 'userId e categoria são obrigatórios' });
    }

    // Verificar se o servidor existe
    const servidor = await prisma.user.findUnique({
      where: { id: userId },
      include: { dadosSaude: true },
    });

    if (!servidor) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    if (servidor.dadosSaude) {
      return res.status(400).json({ error: 'Servidor já possui dados de saúde vinculados' });
    }

    // Criar DadosSaude
    const dadosSaude = await prisma.dadosSaude.create({
      data: {
        userId,
        categoria,
        registroProfissional,
        tipoRegistro,
        ufRegistro,
        cns,
        especialidades,
        cbo,
        ativo: true,
        aceitaAgendamento: aceitaAgendamento !== undefined ? aceitaAgendamento : true,
        tempoMedioConsulta: tempoMedioConsulta || 30,
        observacoes,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json(dadosSaude);
  } catch (error: any) {
    console.error('Erro ao criar dados de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/dados-saude/:id
 * Atualizar dados de saúde de um servidor
 */
router.put('/dados-saude/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      categoria,
      registroProfissional,
      tipoRegistro,
      ufRegistro,
      cns,
      especialidades,
      cbo,
      ativo,
      aceitaAgendamento,
      tempoMedioConsulta,
      observacoes,
      motivoInativacao,
    } = req.body;

    // Buscar DadosSaude pelo userId
    const dadosSaudeExistente = await prisma.dadosSaude.findUnique({
      where: { userId: id },
    });

    if (!dadosSaudeExistente) {
      return res.status(404).json({ error: 'Dados de saúde não encontrados' });
    }

    // Atualizar
    const dadosSaude = await prisma.dadosSaude.update({
      where: { userId: id },
      data: {
        categoria,
        registroProfissional,
        tipoRegistro,
        ufRegistro,
        cns,
        especialidades,
        cbo,
        ativo,
        aceitaAgendamento,
        tempoMedioConsulta,
        observacoes,
        motivoInativacao,
        dataInativacao: ativo === false ? new Date() : null,
      },
      include: {
        user: true,
      },
    });

    res.json(dadosSaude);
  } catch (error: any) {
    console.error('Erro ao atualizar dados de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/dados-saude/:id
 * Desativar dados de saúde de um servidor
 */
router.delete('/dados-saude/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dadosSaudeExistente = await prisma.dadosSaude.findUnique({
      where: { userId: id },
    });

    if (!dadosSaudeExistente) {
      return res.status(404).json({ error: 'Dados de saúde não encontrados' });
    }

    // Soft delete
    await prisma.dadosSaude.update({
      where: { userId: id },
      data: {
        ativo: false,
        dataInativacao: new Date(),
        motivoInativacao: 'Desativado via sistema',
      },
    });

    res.json({ message: 'Dados de saúde desativados com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar dados de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
