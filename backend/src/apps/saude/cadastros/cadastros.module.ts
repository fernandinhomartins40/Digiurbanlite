import { Module } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

// Unidades de Saúde
import { UnidadesSaudeController } from './unidades/unidades.controller.js';
import { UnidadesSaudeService } from './unidades/unidades.service.js';

// Profissionais de Saúde
import { ProfissionaisSaudeController } from './profissionais/profissionais.controller.js';
import { ProfissionaisSaudeService } from './profissionais/profissionais.service.js';

// Especialidades Médicas
import { EspecialidadesMedicasController } from './especialidades/especialidades.controller.js';
import { EspecialidadesMedicasService } from './especialidades/especialidades.service.js';

// Salas/Consultórios
import { SalasConsultoriosController } from './salas/salas.controller.js';
import { SalasConsultoriosService } from './salas/salas.service.js';

// Turnos de Trabalho
import { TurnosTrabalhoController } from './turnos/turnos.controller.js';
import { TurnosTrabalhoService } from './turnos/turnos.service.js';

// Agendas Médicas
import { AgendasMedicasController } from './agendas/agendas.controller.js';
import { AgendasMedicasService } from './agendas/agendas.service.js';

// Configurações de Atendimento
import { ConfiguracoesAtendimentoController } from './configuracoes/configuracoes.controller.js';
import { ConfiguracoesAtendimentoService } from './configuracoes/configuracoes.service.js';

@Module({
  controllers: [
    UnidadesSaudeController,
    ProfissionaisSaudeController,
    EspecialidadesMedicasController,
    SalasConsultoriosController,
    TurnosTrabalhoController,
    AgendasMedicasController,
    ConfiguracoesAtendimentoController,
  ],
  providers: [
    PrismaService,
    UnidadesSaudeService,
    ProfissionaisSaudeService,
    EspecialidadesMedicasService,
    SalasConsultoriosService,
    TurnosTrabalhoService,
    AgendasMedicasService,
    ConfiguracoesAtendimentoService,
  ],
  exports: [
    UnidadesSaudeService,
    ProfissionaisSaudeService,
    EspecialidadesMedicasService,
    SalasConsultoriosService,
    TurnosTrabalhoService,
    AgendasMedicasService,
    ConfiguracoesAtendimentoService,
  ],
})
export class CadastrosSaudeModule {}
