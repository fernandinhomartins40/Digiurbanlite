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
 * GET /api/apps/saude/cadastros/profissionais/stats
 * Estatísticas de profissionais de saúde
 */
router.get('/profissionais/stats', async (req: Request, res: Response) => {
  try {
    const [total, ativos, porCategoria] = await Promise.all([
      prisma.profissionalSaude.count(),
      prisma.profissionalSaude.count({ where: { isActive: true } }),
      prisma.profissionalSaude.groupBy({
        by: ['categoria'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    res.json({
      total,
      ativos,
      porCategoria: porCategoria.map((item) => ({
        categoria: item.categoria,
        quantidade: item._count,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao buscar stats de profissionais:', error);
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
    const { nome, tipo, cnes, endereco, bairro, cep, telefone, email, horarioFuncionamento } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const unidade = await prisma.unidadeSaude.create({
      data: {
        nome,
        tipo: tipo || 'UBS',
        cnes: cnes || null,
        endereco: endereco || null,
        bairro: bairro || null,
        cep: cep || null,
        telefone: telefone || null,
        email: email || null,
        horario: horarioFuncionamento || null,
        isActive: true,
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

    const unidade = await prisma.unidadeSaude.update({
      where: { id },
      data: {
        nome,
        tipo,
        cnes,
        endereco,
        bairro,
        cep,
        telefone,
        email,
        horario: horarioFuncionamento,
        isActive,
      },
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

/**
 * GET /api/apps/saude/cadastros/profissionais
 * Listar profissionais de saúde
 */
router.get('/profissionais', async (req: Request, res: Response) => {
  try {
    const { search, categoria, isActive, unidadeId } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { cpf: { contains: search as string, mode: 'insensitive' } },
        { registroProfissional: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // ✅ NOVO: Filtrar por unidade através da tabela de vínculos
    if (unidadeId) {
      where.vinculosUnidades = {
        some: {
          unidadeId: unidadeId as string,
          ativo: true,
          OR: [
            { dataFim: null },
            { dataFim: { gte: new Date() } },
          ],
        },
      };
    }

    const profissionais = await prisma.profissionalSaude.findMany({
      where,
      include: {
        // Incluir unidades vinculadas
        vinculosUnidades: {
          where: {
            ativo: true,
            OR: [
              { dataFim: null },
              { dataFim: { gte: new Date() } },
            ],
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
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Transformar para incluir array de unidades
    const profissionaisFormatados = profissionais.map((prof) => ({
      ...prof,
      unidades: prof.vinculosUnidades.map((v) => v.unidade),
    }));

    res.json(profissionaisFormatados);
  } catch (error: any) {
    console.error('Erro ao buscar profissionais:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/apps/saude/cadastros/profissionais/:id
 * Buscar profissional específico
 */
router.get('/profissionais/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profissional = await prisma.profissionalSaude.findUnique({
      where: { id },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(profissional);
  } catch (error: any) {
    console.error('Erro ao buscar profissional:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/profissionais
 * Criar novo profissional de saúde
 */
router.post('/profissionais', async (req: Request, res: Response) => {
  try {
    const {
      nome,
      cpf,
      cns,
      categoria,
      especialidade,
      conselho,
      numeroConselho,
      ufConselho,
      telefone,
      email,
      cbo,
    } = req.body;

    if (!nome || !cpf) {
      return res.status(400).json({ error: 'Nome e CPF são obrigatórios' });
    }

    // Montar registro profissional
    const registroProfissional = numeroConselho
      ? `${conselho || 'REG'} ${numeroConselho}/${ufConselho || 'BR'}`
      : `TEMP-${Date.now()}`;

    const profissional = await prisma.profissionalSaude.create({
      data: {
        nome,
        cpf: cpf.replace(/\D/g, ''),
        registroProfissional,
        tipoRegistro: conselho || null,
        categoria: categoria || 'Médico',
        especialidade: especialidade || null,
        telefone: telefone || null,
        email: email || null,
        isActive: true,
      },
    });

    res.status(201).json(profissional);
  } catch (error: any) {
    console.error('Erro ao criar profissional:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'CPF ou registro profissional já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/apps/saude/cadastros/profissionais/:id
 * Atualizar profissional de saúde
 */
router.put('/profissionais/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome,
      cpf,
      categoria,
      especialidade,
      conselho,
      numeroConselho,
      ufConselho,
      telefone,
      email,
      isActive,
    } = req.body;

    const registroProfissional = numeroConselho
      ? `${conselho || 'REG'} ${numeroConselho}/${ufConselho || 'BR'}`
      : undefined;

    const profissional = await prisma.profissionalSaude.update({
      where: { id },
      data: {
        nome,
        cpf: cpf ? cpf.replace(/\D/g, '') : undefined,
        registroProfissional,
        tipoRegistro: conselho,
        categoria,
        especialidade,
        telefone,
        email,
        isActive,
      },
    });

    res.json(profissional);
  } catch (error: any) {
    console.error('Erro ao atualizar profissional:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/apps/saude/cadastros/profissionais/:id
 * Remover profissional de saúde
 */
router.delete('/profissionais/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.profissionalSaude.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Profissional removido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover profissional:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    const { nome, cbo, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const especialidade = await prisma.especialidadeMedica.create({
      data: {
        nome,
        descricao: descricao || null,
        isActive: true,
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

    const especialidade = await prisma.especialidadeMedica.update({
      where: { id },
      data: {
        nome,
        descricao,
        isActive,
      },
    });

    res.json(especialidade);
  } catch (error: any) {
    console.error('Erro ao atualizar especialidade:', error);
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
        unidade: true,
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
    const { nome, numero, tipo, capacidade, equipamentos, unidadeId } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Se não tem unidadeId, pegar a primeira unidade ativa
    let finalUnidadeId = unidadeId;
    if (!finalUnidadeId) {
      const primeiraUnidade = await prisma.unidadeSaude.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!primeiraUnidade) {
        return res.status(400).json({ error: 'Nenhuma unidade de saúde disponível' });
      }
      finalUnidadeId = primeiraUnidade.id;
    }

    const sala = await prisma.salaConsultorio.create({
      data: {
        nome,
        numero: numero || null,
        tipo: tipo || 'CONSULTORIO',
        capacidade: capacidade ? parseInt(capacidade) : null,
        equipamentos: equipamentos ? [equipamentos] : undefined,
        unidadeId: finalUnidadeId,
        ativa: true,
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
    const { nome, numero, tipo, capacidade, equipamentos, ativa } = req.body;

    const sala = await prisma.salaConsultorio.update({
      where: { id },
      data: {
        nome,
        numero,
        tipo,
        capacidade: capacidade ? parseInt(capacidade) : null,
        equipamentos: equipamentos ? [equipamentos] : undefined,
        ativa,
      },
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
    const { nome, periodo, horaInicio, horaFim, cargaHoraria } = req.body;

    if (!nome || !horaInicio || !horaFim) {
      return res.status(400).json({ error: 'Nome, horário de início e fim são obrigatórios' });
    }

    const turno = await prisma.turnoTrabalho.create({
      data: {
        nome,
        descricao: periodo || null,
        horaInicio,
        horaFim,
        ativo: true,
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

    const turno = await prisma.turnoTrabalho.update({
      where: { id },
      data: {
        nome,
        descricao,
        horaInicio,
        horaFim,
        ativo,
      },
    });

    res.json(turno);
  } catch (error: any) {
    console.error('Erro ao atualizar turno:', error);
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
      salaNome: agenda.sala?.nome,
      tipo: agenda.especialidade?.nome || 'Geral',
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
    } = req.body;

    if (!nome || !dataInicio) {
      return res.status(400).json({ error: 'Nome e data de início são obrigatórios' });
    }

    // Buscar primeira unidade e profissional se não fornecidos
    let finalUnidadeId = unidadeId;
    let finalProfissionalId = profissionalId;

    if (!finalUnidadeId) {
      const primeiraUnidade = await prisma.unidadeSaude.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (primeiraUnidade) finalUnidadeId = primeiraUnidade.id;
    }

    if (!finalProfissionalId) {
      const primeiroProfissional = await prisma.profissionalSaude.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (primeiroProfissional) finalProfissionalId = primeiroProfissional.id;
    }

    if (!finalUnidadeId || !finalProfissionalId) {
      return res.status(400).json({ error: 'Unidade e profissional são necessários' });
    }

    // ✅ NOVO: Validar se o profissional está vinculado à unidade
    const vinculo = await prisma.profissionalUnidade.findFirst({
      where: {
        profissionalId: finalProfissionalId,
        unidadeId: finalUnidadeId,
        ativo: true,
        OR: [
          { dataFim: null },
          { dataFim: { gte: new Date() } },
        ],
      },
      include: {
        profissional: { select: { nome: true } },
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
        profissionalId: finalProfissionalId,
        unidadeId: finalUnidadeId,
        especialidadeId: especialidadeId || null,
        salaId: salaId || null,
        diaSemana: new Date(dataInicio).getDay(),
        horaInicio: horaInicio || '08:00',
        horaFim: horaFim || '17:00',
        tempoPorConsulta: duracaoConsulta ? parseInt(duracaoConsulta) : 30,
        vagasDisponiveis: vagasPorDia ? parseInt(vagasPorDia) : 20,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        isActive: true,
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

    const agenda = await prisma.agendaMedica.update({
      where: { id },
      data: {
        horaInicio,
        horaFim,
        tempoPorConsulta: tempoPorConsulta ? parseInt(tempoPorConsulta) : undefined,
        vagasDisponiveis: vagasDisponiveis ? parseInt(vagasDisponiveis) : undefined,
        dataInicio: dataInicio ? new Date(dataInicio) : undefined,
        dataFim: dataFim ? new Date(dataFim) : undefined,
        especialidadeId,
        salaId,
        isActive,
      },
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
            nome: true,
            categoria: true,
            especialidade: true,
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
      orderBy: [{ profissional: { nome: 'asc' } }, { dataInicio: 'desc' }],
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
    const profissional = await prisma.profissionalSaude.findUnique({
      where: { id: profissionalId },
      select: { id: true, nome: true },
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
        profissional: { select: { nome: true } },
        unidade: { select: { nome: true } },
      },
    });

    // Criar auditoria
    await prisma.auditoriaVinculo.create({
      data: {
        vinculoId: vinculo.id,
        tipo: 'CRIACAO',
        profissionalId,
        profissionalNome: profissional.nome,
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
        profissional: { select: { nome: true } },
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
        profissional: { select: { nome: true } },
        unidade: { select: { nome: true } },
      },
    });

    // Criar auditoria
    await prisma.auditoriaVinculo.create({
      data: {
        vinculoId: vinculo.id,
        tipo: tipoAuditoria,
        profissionalId: vinculo.profissionalId,
        profissionalNome: vinculo.profissional.nome,
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
        profissional: { select: { nome: true } },
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
        profissionalNome: vinculoAtual.profissional.nome,
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
// ROTAS DE ESPECIALIDADES POR PROFISSIONAL
// ============================================================

/**
 * GET /api/apps/saude/cadastros/profissionais/:id/especialidades
 * Listar especialidades de um profissional
 */
router.get('/profissionais/:id/especialidades', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vinculos = await prisma.profissionalEspecialidade.findMany({
      where: { profissionalId: id },
      include: {
        especialidade: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
      },
      orderBy: [
        { isPrincipal: 'desc' },
        { ativo: 'desc' },
        { dataInicio: 'desc' },
      ],
    });

    res.json(vinculos);
  } catch (error: any) {
    console.error('Erro ao buscar especialidades do profissional:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apps/saude/cadastros/profissionais/:id/especialidades
 * Adicionar especialidade a um profissional
 */
router.post('/profissionais/:id/especialidades', async (req: Request, res: Response) => {
  try {
    const { id: profissionalId } = req.params;
    const { especialidadeId, isPrincipal, dataInicio, observacoes } = req.body;

    if (!especialidadeId) {
      return res.status(400).json({ error: 'especialidadeId é obrigatório' });
    }

    // Verificar se profissional existe
    const profissional = await prisma.profissionalSaude.findUnique({
      where: { id: profissionalId },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Verificar se especialidade existe
    const especialidade = await prisma.especialidadeMedica.findUnique({
      where: { id: especialidadeId },
    });

    if (!especialidade) {
      return res.status(404).json({ error: 'Especialidade não encontrada' });
    }

    // Verificar se já existe vínculo ativo
    const vinculoExistente = await prisma.profissionalEspecialidade.findUnique({
      where: {
        profissionalId_especialidadeId: {
          profissionalId,
          especialidadeId,
        },
      },
    });

    if (vinculoExistente && vinculoExistente.ativo) {
      return res.status(400).json({
        error: 'Já existe um vínculo ativo com esta especialidade',
      });
    }

    // Se marcado como principal, desmarcar outras
    if (isPrincipal) {
      await prisma.profissionalEspecialidade.updateMany({
        where: {
          profissionalId,
          ativo: true,
          isPrincipal: true,
        },
        data: {
          isPrincipal: false,
        },
      });
    }

    // Criar ou reativar vínculo
    const vinculo = vinculoExistente
      ? await prisma.profissionalEspecialidade.update({
          where: { id: vinculoExistente.id },
          data: {
            ativo: true,
            isPrincipal: isPrincipal || false,
            dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
            dataFim: null,
            observacoes,
          },
          include: {
            especialidade: true,
          },
        })
      : await prisma.profissionalEspecialidade.create({
          data: {
            profissionalId,
            especialidadeId,
            isPrincipal: isPrincipal || false,
            dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
            observacoes,
          },
          include: {
            especialidade: true,
          },
        });

    res.status(201).json(vinculo);
  } catch (error: any) {
    console.error('Erro ao adicionar especialidade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/apps/saude/cadastros/profissionais/:profissionalId/especialidades/:id
 * Atualizar especialidade (ex: marcar como principal)
 */
router.patch(
  '/profissionais/:profissionalId/especialidades/:id',
  async (req: Request, res: Response) => {
    try {
      const { profissionalId, id } = req.params;
      const { isPrincipal, observacoes } = req.body;

      const vinculo = await prisma.profissionalEspecialidade.findUnique({
        where: { id },
      });

      if (!vinculo || vinculo.profissionalId !== profissionalId) {
        return res.status(404).json({ error: 'Vínculo não encontrado' });
      }

      // Se marcado como principal, desmarcar outras
      if (isPrincipal === true) {
        await prisma.profissionalEspecialidade.updateMany({
          where: {
            profissionalId,
            ativo: true,
            isPrincipal: true,
            id: { not: id },
          },
          data: {
            isPrincipal: false,
          },
        });
      }

      const vinculoAtualizado = await prisma.profissionalEspecialidade.update({
        where: { id },
        data: {
          isPrincipal: isPrincipal !== undefined ? isPrincipal : vinculo.isPrincipal,
          observacoes: observacoes !== undefined ? observacoes : vinculo.observacoes,
        },
        include: {
          especialidade: true,
        },
      });

      res.json(vinculoAtualizado);
    } catch (error: any) {
      console.error('Erro ao atualizar especialidade:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/apps/saude/cadastros/profissionais/:profissionalId/especialidades/:id
 * Remover especialidade de um profissional
 */
router.delete(
  '/profissionais/:profissionalId/especialidades/:id',
  async (req: Request, res: Response) => {
    try {
      const { profissionalId, id } = req.params;

      const vinculo = await prisma.profissionalEspecialidade.findUnique({
        where: { id },
      });

      if (!vinculo || vinculo.profissionalId !== profissionalId) {
        return res.status(404).json({ error: 'Vínculo não encontrado' });
      }

      // Soft delete
      await prisma.profissionalEspecialidade.update({
        where: { id },
        data: {
          ativo: false,
          dataFim: new Date(),
        },
      });

      res.json({ message: 'Especialidade removida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover especialidade:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
