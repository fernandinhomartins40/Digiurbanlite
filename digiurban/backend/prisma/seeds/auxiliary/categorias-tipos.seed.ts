import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import {
  programasSociaisData,
  tiposObraServicoData,
  especialidadesMedicasData,
  tiposProducaoAgricolaData,
  maquinasAgricolasData,
  especiesArvoreData,
  tiposEstabelecimentoTuristicoData,
  modalidadesEsportivasData,
  tiposAtividadeCulturalData,
  tiposOcorrenciaData,
  cursosProfissionalizantesData,
  programasHabitacionaisData,
  programasAmbientaisData,
} from '../../../src/data/default-catalogs.data';

export {
  programasSociaisData,
  tiposObraServicoData,
  especialidadesMedicasData,
  tiposProducaoAgricolaData,
  maquinasAgricolasData,
  especiesArvoreData,
  tiposEstabelecimentoTuristicoData,
  modalidadesEsportivasData,
  tiposAtividadeCulturalData,
  tiposOcorrenciaData,
  cursosProfissionalizantesData,
  programasHabitacionaisData,
  programasAmbientaisData,
};

// ========================================
// PROGRAMAS SOCIAIS
// ========================================


export async function seedProgramasSociais() {
  console.log('   📋 Programas Sociais...');

  for (const data of programasSociaisData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.programaSocial.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.programaSocial.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.programaSocial.create({ data: data });
    }
  }

  console.log(`   ✅ ${programasSociaisData.length} programas sociais criados`);
}

// ========================================
// TIPOS DE OBRAS E SERVIÇOS
// ========================================


export async function seedTiposObraServico() {
  console.log('   🏗️  Tipos de Obras e Serviços...');

  for (const data of tiposObraServicoData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.tipoObraServico.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.tipoObraServico.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.tipoObraServico.create({ data: data });
    }
  }

  console.log(`   ✅ ${tiposObraServicoData.length} tipos de obras e serviços criados`);
}

// ========================================
// ESPECIALIDADES MÉDICAS
// ========================================


export async function seedEspecialidadesMedicas() {
  console.log('   🏥 Especialidades Médicas...');

  for (const data of especialidadesMedicasData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.especialidadeMedica.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.especialidadeMedica.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.especialidadeMedica.create({ data: data });
    }
  }

  console.log(`   ✅ ${especialidadesMedicasData.length} especialidades médicas criadas`);
}

// ========================================
// TIPOS DE PRODUÇÃO AGRÍCOLA
// ========================================


export async function seedTiposProducaoAgricola() {
  console.log('   🌾 Tipos de Produção Agrícola...');

  for (const data of tiposProducaoAgricolaData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.tipoProducaoAgricola.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.tipoProducaoAgricola.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.tipoProducaoAgricola.create({ data: data });
    }
  }

  console.log(`   ✅ ${tiposProducaoAgricolaData.length} tipos de produção agrícola criados`);
}

// ========================================
// MÁQUINAS AGRÍCOLAS
// ========================================


export async function seedMaquinasAgricolas() {
  console.log('   🚜 Máquinas Agrícolas...');

  for (const data of maquinasAgricolasData) {
    // onda 8: unique composta [tenantId, identificacao] — findFirst é escopado pela tenant-extension
    const existing = await prisma.maquinaAgricola.findFirst({ where: { identificacao: data.identificacao } });
    if (existing) {
      await prisma.maquinaAgricola.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.maquinaAgricola.create({ data: data });
    }
  }

  console.log(`   ✅ ${maquinasAgricolasData.length} máquinas agrícolas criadas`);
}

// ========================================
// ESPÉCIES DE ÁRVORES
// ========================================


export async function seedEspeciesArvore() {
  console.log('   🌲 Espécies de Árvores...');

  for (const data of especiesArvoreData) {
    // onda 8: unique composta [tenantId, nomeComum] — findFirst é escopado pela tenant-extension
    const existing = await prisma.especieArvore.findFirst({ where: { nomeComum: data.nomeComum } });
    if (existing) {
      await prisma.especieArvore.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.especieArvore.create({ data: data });
    }
  }

  console.log(`   ✅ ${especiesArvoreData.length} espécies de árvores criadas`);
}

// ========================================
// TIPOS DE ESTABELECIMENTOS TURÍSTICOS
// ========================================


export async function seedTiposEstabelecimentoTuristico() {
  console.log('   🏨 Tipos de Estabelecimentos Turísticos...');

  for (const data of tiposEstabelecimentoTuristicoData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.tipoEstabelecimentoTuristico.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.tipoEstabelecimentoTuristico.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.tipoEstabelecimentoTuristico.create({ data: data });
    }
  }

  console.log(`   ✅ ${tiposEstabelecimentoTuristicoData.length} tipos de estabelecimentos turísticos criados`);
}

// ========================================
// MODALIDADES ESPORTIVAS
// ========================================


export async function seedModalidadesEsportivas() {
  console.log('   ⚽ Modalidades Esportivas...');

  for (const data of modalidadesEsportivasData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.modalidadeEsportiva.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.modalidadeEsportiva.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.modalidadeEsportiva.create({ data: data });
    }
  }

  console.log(`   ✅ ${modalidadesEsportivasData.length} modalidades esportivas criadas`);
}

// ========================================
// TIPOS DE ATIVIDADES CULTURAIS
// ========================================


export async function seedTiposAtividadeCultural() {
  console.log('   🎨 Tipos de Atividades Culturais...');

  for (const data of tiposAtividadeCulturalData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.tipoAtividadeCultural.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.tipoAtividadeCultural.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.tipoAtividadeCultural.create({ data: data });
    }
  }

  console.log(`   ✅ ${tiposAtividadeCulturalData.length} tipos de atividades culturais criados`);
}

// ========================================
// TIPOS DE OCORRÊNCIAS
// ========================================


export async function seedTiposOcorrencia() {
  console.log('   🚨 Tipos de Ocorrências...');

  for (const data of tiposOcorrenciaData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.tipoOcorrencia.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.tipoOcorrencia.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.tipoOcorrencia.create({ data: data });
    }
  }

  console.log(`   ✅ ${tiposOcorrenciaData.length} tipos de ocorrências criados`);
}

// ========================================
// CURSOS PROFISSIONALIZANTES
// ========================================


export async function seedCursosProfissionalizantes() {
  console.log('   📚 Cursos Profissionalizantes...');

  for (const data of cursosProfissionalizantesData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.cursoProfissionalizante.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.cursoProfissionalizante.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.cursoProfissionalizante.create({ data: data });
    }
  }

  console.log(`   ✅ ${cursosProfissionalizantesData.length} cursos profissionalizantes criados`);
}

// ========================================
// PROGRAMAS HABITACIONAIS
// ========================================


export async function seedProgramasHabitacionais() {
  console.log('   🏡 Programas Habitacionais...');

  for (const data of programasHabitacionaisData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.programaHabitacional.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.programaHabitacional.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.programaHabitacional.create({ data: data });
    }
  }

  console.log(`   ✅ ${programasHabitacionaisData.length} programas habitacionais criados`);
}

// ========================================
// PROGRAMAS AMBIENTAIS
// ========================================


export async function seedProgramasAmbientais() {
  console.log('   🌱 Programas Ambientais...');

  for (const data of programasAmbientaisData) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.programaAmbiental.findFirst({ where: { nome: data.nome } });
    if (existing) {
      await prisma.programaAmbiental.update({ where: { id: existing.id }, data: data });
    } else {
      await prisma.programaAmbiental.create({ data: data });
    }
  }

  console.log(`   ✅ ${programasAmbientaisData.length} programas ambientais criados`);
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

export async function seedCategoriasTipos() {
  console.log('\n═══ CATEGORIAS E TIPOS ═══\n');

  await seedProgramasSociais();
  await seedTiposObraServico();
  await seedEspecialidadesMedicas();
  await seedTiposProducaoAgricola();
  await seedMaquinasAgricolas();
  await seedEspeciesArvore();
  await seedTiposEstabelecimentoTuristico();
  await seedModalidadesEsportivas();
  await seedTiposAtividadeCultural();
  await seedTiposOcorrencia();
  await seedCursosProfissionalizantes();
  await seedProgramasHabitacionais();
  await seedProgramasAmbientais();

  console.log('\n✅ Categorias e Tipos criados com sucesso!\n');
}
