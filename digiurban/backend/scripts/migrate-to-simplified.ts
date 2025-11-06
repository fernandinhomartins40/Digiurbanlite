/**
 * SCRIPT DE MIGRA\u00c7\u00c3O PARA SISTEMA SIMPLIFICADO
 *
 * Este script migra todos os dados do sistema antigo para o novo sistema simplificado
 * Cobre 108 servi\u00e7os com mapeamento expl\u00edcito (284 varia\u00e7\u00f5es de nomes)
 *
 * Data: 29/10/2025
 */

import { PrismaClient } from '@prisma/client'
import { MODULE_MAPPING } from '../src/config/module-mapping'

const prisma = new PrismaClient()

// ========================================
// FUN\u00c7\u00c3O PRINCIPAL
// ========================================

async function main() {
  console.log('\n========================================')
  console.log('  MIGRA\u00c7\u00c3O PARA SISTEMA SIMPLIFICADO')
  console.log('========================================\n')

  try {
    // 1. Migrar servi\u00e7os
    console.log('\u23f3 ETAPA 1: Migrando servi\u00e7os...\n')
    const servicesResult = await migrateServices()
    console.log(`\n\u2705 ${servicesResult.migrated} servi\u00e7os migrados`)
    console.log(`\u26a0\ufe0f  ${servicesResult.skipped} servi\u00e7os ignorados (duplicados/inv\u00e1lidos)`)

    // 2. Migrar protocolos
    console.log('\n\u23f3 ETAPA 2: Migrando protocolos...\n')
    const protocolsResult = await migrateProtocols()
    console.log(`\n\u2705 ${protocolsResult.migrated} protocolos migrados`)
    console.log(`\u2705 ${protocolsResult.historyMigrated} registros de hist\u00f3rico migrados`)
    console.log(`\u2705 ${protocolsResult.evaluationsMigrated} avalia\u00e7\u00f5es migradas`)
    console.log(`\u26a0\ufe0f  ${protocolsResult.skipped} protocolos ignorados (sem servi\u00e7o correspondente)`)

    // 3. Validar migra\u00e7\u00e3o
    console.log('\n\u23f3 ETAPA 3: Validando migra\u00e7\u00e3o...\n')
    await validateMigration()

    console.log('\n========================================')
    console.log('\u2705 MIGRA\u00c7\u00c3O CONCLU\u00cdDA COM SUCESSO!')
    console.log('========================================\n')
  } catch (error) {
    console.error('\n\u274c ERRO NA MIGRA\u00c7\u00c3O:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// ========================================
// MIGRA\u00c7\u00c3O DE SERVI\u00c7OS
// ========================================

async function migrateServices() {
  const oldServices = await prisma.service.findMany({
    include: {
      department: true,
      customForm: true,
      customFields: true
    }
  })

  let migrated = 0
  let skipped = 0

  for (const oldService of oldServices) {
    try {
      // Verificar se j\u00e1 existe
      const existing = await prisma.serviceSimplified.findFirst({
        where: {
          name: oldService.name,
          departmentId: oldService.departmentId,
          tenantId: oldService.tenantId
        }
      })

      if (existing) {
        console.log(`  \u26a0\ufe0f  Servi\u00e7o j\u00e1 existe: ${oldService.name}`)
        skipped++
        continue
      }

      // Determinar serviceType
      const serviceType = determineServiceType(oldService)

      // Determinar moduleType
      const moduleType = serviceType === 'COM_DADOS'
        ? determineModuleType(oldService)
        : null

      // Criar formSchema
      const formSchema = serviceType === 'COM_DADOS'
        ? await buildFormSchema(oldService)
        : null

      // Criar servi\u00e7o simplificado
      await prisma.serviceSimplified.create({
        data: {
          name: oldService.name,
          description: oldService.description,
          departmentId: oldService.departmentId,
          serviceType,
          moduleType,
          formSchema,
          isActive: oldService.isActive,
          requiresDocuments: oldService.requiresDocuments,
          requiredDocuments: oldService.requiredDocuments,
          estimatedDays: oldService.estimatedDays,
          priority: oldService.priority,
          category: oldService.category,
          icon: oldService.icon,
          color: oldService.color,
          tenantId: oldService.tenantId
        }
      })

      console.log(`  \u2713 ${oldService.name} [${serviceType}${moduleType ? ` -> ${moduleType}` : ''}]`)
      migrated++
    } catch (error) {
      console.error(`  \u274c Erro ao migrar servi\u00e7o ${oldService.name}:`, error)
      skipped++
    }
  }

  return { migrated, skipped, total: oldServices.length }
}

// ========================================
// MIGRA\u00c7\u00c3O DE PROTOCOLOS
// ========================================

async function migrateProtocols() {
  const oldProtocols = await prisma.protocol.findMany({
    include: {
      service: true,
      history: true,
      evaluations: true
    },
    orderBy: { createdAt: 'asc' }
  })

  let migrated = 0
  let skipped = 0
  let historyMigrated = 0
  let evaluationsMigrated = 0

  for (const oldProtocol of oldProtocols) {
    try {
      // Verificar se j\u00e1 existe
      const existing = await prisma.protocolSimplified.findUnique({
        where: { number: oldProtocol.number }
      })

      if (existing) {
        console.log(`  \u26a0\ufe0f  Protocolo j\u00e1 existe: ${oldProtocol.number}`)
        skipped++
        continue
      }

      // Buscar servi\u00e7o correspondente no novo sistema
      const newService = await prisma.serviceSimplified.findFirst({
        where: {
          name: oldProtocol.service?.name,
          tenantId: oldProtocol.tenantId
        }
      })

      if (!newService) {
        console.warn(`  \u26a0\ufe0f  Servi\u00e7o n\u00e3o encontrado para protocolo ${oldProtocol.number}`)
        skipped++
        continue
      }

      // Criar protocolo simplificado
      const newProtocol = await prisma.protocolSimplified.create({
        data: {
          number: oldProtocol.number,
          title: oldProtocol.title,
          description: oldProtocol.description,
          status: oldProtocol.status as any,
          priority: oldProtocol.priority,
          citizenId: oldProtocol.citizenId,
          serviceId: newService.id,
          departmentId: oldProtocol.departmentId,
          tenantId: oldProtocol.tenantId,
          customData: oldProtocol.customData,
          moduleType: newService.moduleType,
          latitude: oldProtocol.latitude,
          longitude: oldProtocol.longitude,
          address: oldProtocol.endereco,
          documents: oldProtocol.documents,
          attachments: oldProtocol.attachments,
          assignedUserId: oldProtocol.assignedUserId,
          createdById: oldProtocol.createdById,
          createdAt: oldProtocol.createdAt,
          updatedAt: oldProtocol.updatedAt,
          dueDate: oldProtocol.dueDate,
          concludedAt: oldProtocol.concludedAt
        }
      })

      // Migrar hist\u00f3rico
      for (const history of oldProtocol.history) {
        await prisma.protocolHistorySimplified.create({
          data: {
            protocolId: newProtocol.id,
            action: history.action,
            comment: history.comment,
            timestamp: history.timestamp,
            userId: history.userId
          }
        })
        historyMigrated++
      }

      // Migrar avalia\u00e7\u00f5es
      for (const evaluation of oldProtocol.evaluations) {
        await prisma.protocolEvaluationSimplified.create({
          data: {
            protocolId: newProtocol.id,
            rating: evaluation.rating,
            comment: evaluation.comment,
            wouldRecommend: evaluation.wouldRecommend,
            createdAt: evaluation.createdAt
          }
        })
        evaluationsMigrated++
      }

      console.log(`  \u2713 ${oldProtocol.number}`)
      migrated++
    } catch (error) {
      console.error(`  \u274c Erro ao migrar protocolo ${oldProtocol.number}:`, error)
      skipped++
    }
  }

  return {
    migrated,
    skipped,
    historyMigrated,
    evaluationsMigrated,
    total: oldProtocols.length
  }
}

// ========================================
// FUN\u00c7\u00c3O: DETERMINAR TIPO DE SERVI\u00c7O
// ========================================

function determineServiceType(service: any): 'INFORMATIVO' | 'COM_DADOS' {
  // 1. Se j\u00e1 tem moduleEntity definido = COM_DADOS
  if (service.moduleEntity) {
    return 'COM_DADOS'
  }

  // 2. Se tem flags de captura de dados = COM_DADOS
  if (service.hasCustomForm || service.hasCustomFields) {
    return 'COM_DADOS'
  }

  // 3. Lista de servi\u00e7os informativos (12 servi\u00e7os)
  const informativeServices = [
    'Calend\u00e1rio Escolar',
    'Agenda de Eventos Culturais',
    'Calend\u00e1rio Cultural',
    'Agenda de Eventos Esportivos',
    'Calend\u00e1rio Esportivo',
    'Consulta de Programas Habitacionais',
    'Acompanhamento de Obras',
    'Progresso de Obras',
    'Mapa de Obras',
    'Consultas P\u00fablicas',
    'Audi\u00eancia P\u00fablica',
    'Mapa Urbano',
    'Zoneamento',
    'Estat\u00edsticas de Seguran\u00e7a',
    'Estat\u00edsticas Regionais',
    'Registro de Problema com Foto',
    'Mapa Tur\u00edstico',
    'Guia da Cidade',
    'Guia Tur\u00edstico da Cidade',
    'Informa\u00e7\u00f5es Tur\u00edsticas'
  ]

  const serviceLower = service.name.toLowerCase()
  if (informativeServices.some(name => serviceLower.includes(name.toLowerCase()))) {
    return 'INFORMATIVO'
  }

  // 4. Por padr\u00e3o, servi\u00e7os que geram protocolo = COM_DADOS
  return 'COM_DADOS'
}

// ========================================
// FUN\u00c7\u00c3O: DETERMINAR TIPO DE M\u00d3DULO (284 MAPEAMENTOS)
// ========================================

function determineModuleType(service: any): string | null {
  // 1. Se j\u00e1 tem moduleEntity, usar diretamente
  if (service.moduleEntity) {
    return service.moduleEntity
  }

  // 2. Mapeamento COMPLETO por nome de servi\u00e7o (284 varia\u00e7\u00f5es)
  const serviceNameMapping: Record<string, string | null> = {
    // ========================================
    // SECRETARIA DE SA\u00daDE (11 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Sa\u00fade': 'ATENDIMENTOS_SAUDE',
    'Atendimentos Sa\u00fade': 'ATENDIMENTOS_SAUDE',
    'Atendimento Sa\u00fade': 'ATENDIMENTOS_SAUDE',
    'Agendamento de Consulta': 'AGENDAMENTOS_MEDICOS',
    'Agendamentos M\u00e9dicos': 'AGENDAMENTOS_MEDICOS',
    'Agendar Consulta': 'AGENDAMENTOS_MEDICOS',
    'Controle de Medicamentos': 'CONTROLE_MEDICAMENTOS',
    'Farm\u00e1cia B\u00e1sica': 'CONTROLE_MEDICAMENTOS',
    'Medica\u00e7\u00e3o': 'CONTROLE_MEDICAMENTOS',
    'Campanhas de Sa\u00fade': 'CAMPANHAS_SAUDE',
    'Vacina\u00e7\u00e3o': 'VACINACAO',
    'Campanha de Vacina\u00e7\u00e3o': 'CAMPANHAS_SAUDE',
    'Programas de Sa\u00fade': 'PROGRAMAS_SAUDE',
    'Programa de Sa\u00fade': 'PROGRAMAS_SAUDE',
    'Encaminhamentos TFD': 'ENCAMINHAMENTOS_TFD',
    'TFD': 'ENCAMINHAMENTOS_TFD',
    'Tratamento Fora do Domic\u00edlio': 'ENCAMINHAMENTOS_TFD',
    'Exames': 'EXAMES',
    'Solicita\u00e7\u00e3o de Exame': 'EXAMES',
    'Exame M\u00e9dico': 'EXAMES',
    'Transporte de Pacientes': 'TRANSPORTE_PACIENTES',
    'Ambul\u00e2ncia': 'TRANSPORTE_PACIENTES',
    'Transporte Sa\u00fade': 'TRANSPORTE_PACIENTES',
    'Cadastro de Paciente': 'CADASTRO_PACIENTE',
    'Paciente': 'CADASTRO_PACIENTE',
    'Gest\u00e3o ACS': 'GESTAO_ACS',
    'Agentes Comunit\u00e1rios': 'GESTAO_ACS',
    'ACS': 'GESTAO_ACS',

    // ========================================
    // SECRETARIA DE EDUCA\u00c7\u00c3O (11 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Educa\u00e7\u00e3o': 'ATENDIMENTOS_EDUCACAO',
    'Atendimentos Educa\u00e7\u00e3o': 'ATENDIMENTOS_EDUCACAO',
    'Atendimento Educacional': 'ATENDIMENTOS_EDUCACAO',
    'Matr\u00edcula de Aluno': 'MATRICULA_ALUNO',
    'Matr\u00edcula Escolar': 'MATRICULA_ALUNO',
    'Nova Matr\u00edcula': 'MATRICULA_ALUNO',
    'Matr\u00edcula': 'MATRICULA_ALUNO',
    'Transporte Escolar': 'TRANSPORTE_ESCOLAR',
    'Solicita\u00e7\u00e3o de Transporte': 'TRANSPORTE_ESCOLAR',
    'Transporte de Aluno': 'TRANSPORTE_ESCOLAR',
    '\u00d4nibus Escolar': 'TRANSPORTE_ESCOLAR',
    'Registro de Ocorr\u00eancia Escolar': 'REGISTRO_OCORRENCIA_ESCOLAR',
    'Ocorr\u00eancia Disciplinar': 'REGISTRO_OCORRENCIA_ESCOLAR',
    'Ocorr\u00eancia Escolar': 'REGISTRO_OCORRENCIA_ESCOLAR',
    'Solicita\u00e7\u00e3o de Documento Escolar': 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    'Hist\u00f3rico Escolar': 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    'Documento Escolar': 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    'Certid\u00e3o Escolar': 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    'Transfer\u00eancia Escolar': 'TRANSFERENCIA_ESCOLAR',
    'Transfer\u00eancia de Aluno': 'TRANSFERENCIA_ESCOLAR',
    'Consulta de Frequ\u00eancia': 'CONSULTA_FREQUENCIA',
    'Frequ\u00eancia Escolar': 'CONSULTA_FREQUENCIA',
    'Consulta de Notas': 'CONSULTA_NOTAS',
    'Boletim': 'CONSULTA_NOTAS',
    'Boletim Escolar': 'CONSULTA_NOTAS',
    'Gest\u00e3o Escolar': 'GESTAO_ESCOLAR',
    'Administra\u00e7\u00e3o Escolar': 'GESTAO_ESCOLAR',
    'Gest\u00e3o de Merenda': 'GESTAO_MERENDA',
    'Merenda Escolar': 'GESTAO_MERENDA',
    'Alimenta\u00e7\u00e3o Escolar': 'GESTAO_MERENDA',
    'Calend\u00e1rio Escolar': null, // INFORMATIVO

    // ========================================
    // SECRETARIA DE ASSIST\u00caNCIA SOCIAL (10 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Assist\u00eancia Social': 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    'Atendimentos Assist\u00eancia': 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    'Atendimento Social': 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    'Cadastro \u00danico': 'CADASTRO_UNICO',
    'Cad\u00danico': 'CADASTRO_UNICO',
    'Fam\u00edlias Vulner\u00e1veis': 'CADASTRO_UNICO',
    'CadUnico': 'CADASTRO_UNICO',
    'Solicita\u00e7\u00e3o de Benef\u00edcio': 'SOLICITACAO_BENEFICIO',
    'Benef\u00edcio Social': 'SOLICITACAO_BENEFICIO',
    'Benef\u00edcio': 'SOLICITACAO_BENEFICIO',
    'Entrega Emergencial': 'ENTREGA_EMERGENCIAL',
    'Cesta B\u00e1sica': 'ENTREGA_EMERGENCIAL',
    'Aux\u00edlio Emergencial': 'ENTREGA_EMERGENCIAL',
    'Inscri\u00e7\u00e3o em Grupo': 'INSCRICAO_GRUPO_OFICINA',
    'Oficina Social': 'INSCRICAO_GRUPO_OFICINA',
    'Grupo Social': 'INSCRICAO_GRUPO_OFICINA',
    'Visitas Domiciliares': 'VISITAS_DOMICILIARES',
    'Visita T\u00e9cnica': 'VISITAS_DOMICILIARES',
    'Visita Social': 'VISITAS_DOMICILIARES',
    'Inscri\u00e7\u00e3o em Programa Social': 'INSCRICAO_PROGRAMA_SOCIAL',
    'Programa Social': 'INSCRICAO_PROGRAMA_SOCIAL',
    'Agendamento de Atendimento Social': 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
    'Agendar Atendimento Social': 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
    'Gest\u00e3o CRAS': 'GESTAO_CRAS_CREAS',
    'Gest\u00e3o CREAS': 'GESTAO_CRAS_CREAS',
    'CRAS': 'GESTAO_CRAS_CREAS',
    'CREAS': 'GESTAO_CRAS_CREAS',

    // ========================================
    // SECRETARIA DE AGRICULTURA (6 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Agricultura': 'ATENDIMENTOS_AGRICULTURA',
    'Atendimentos Agricultura': 'ATENDIMENTOS_AGRICULTURA',
    'Atendimento Rural': 'ATENDIMENTOS_AGRICULTURA',
    'Cadastro de Produtor': 'CADASTRO_PRODUTOR',
    'Cadastro de Produtor Rural': 'CADASTRO_PRODUTOR',
    'Produtor Rural': 'CADASTRO_PRODUTOR',
    'Cadastro Produtor': 'CADASTRO_PRODUTOR',
    'Assist\u00eancia T\u00e9cnica': 'ASSISTENCIA_TECNICA',
    'ATER': 'ASSISTENCIA_TECNICA',
    'Assist\u00eancia Rural': 'ASSISTENCIA_TECNICA',
    'Inscri\u00e7\u00e3o em Curso Rural': 'INSCRICAO_CURSO_RURAL',
    'Capacita\u00e7\u00e3o Rural': 'INSCRICAO_CURSO_RURAL',
    'Curso Agr\u00edcola': 'INSCRICAO_CURSO_RURAL',
    'Treinamento Rural': 'INSCRICAO_CURSO_RURAL',
    'Inscri\u00e7\u00e3o em Programa Rural': 'INSCRICAO_PROGRAMA_RURAL',
    'Programa Agr\u00edcola': 'INSCRICAO_PROGRAMA_RURAL',
    'Programa Rural': 'INSCRICAO_PROGRAMA_RURAL',
    'Cadastro de Propriedade Rural': 'CADASTRO_PROPRIEDADE_RURAL',
    'Propriedade Rural': 'CADASTRO_PROPRIEDADE_RURAL',
    'Im\u00f3vel Rural': 'CADASTRO_PROPRIEDADE_RURAL',

    // ========================================
    // SECRETARIA DE CULTURA (9 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Cultura': 'ATENDIMENTOS_CULTURA',
    'Atendimentos Cultura': 'ATENDIMENTOS_CULTURA',
    'Atendimento Cultural': 'ATENDIMENTOS_CULTURA',
    'Reserva de Espa\u00e7o Cultural': 'RESERVA_ESPACO_CULTURAL',
    'Agendamento de Espa\u00e7o': 'RESERVA_ESPACO_CULTURAL',
    'Teatro Municipal': 'RESERVA_ESPACO_CULTURAL',
    'Centro Cultural': 'RESERVA_ESPACO_CULTURAL',
    'Inscri\u00e7\u00e3o em Oficina Cultural': 'INSCRICAO_OFICINA_CULTURAL',
    'Oficina de Arte': 'INSCRICAO_OFICINA_CULTURAL',
    'Oficina Cultural': 'INSCRICAO_OFICINA_CULTURAL',
    'Cadastro de Grupo Art\u00edstico': 'CADASTRO_GRUPO_ARTISTICO',
    'Grupo Cultural': 'CADASTRO_GRUPO_ARTISTICO',
    'Grupo Art\u00edstico': 'CADASTRO_GRUPO_ARTISTICO',
    'Projeto Cultural': 'PROJETO_CULTURAL',
    'Elabora\u00e7\u00e3o Projeto Cultural': 'PROJETO_CULTURAL',
    'Submiss\u00e3o de Projeto': 'SUBMISSAO_PROJETO_CULTURAL',
    'Lei de Incentivo': 'SUBMISSAO_PROJETO_CULTURAL',
    'Incentivo Cultural': 'SUBMISSAO_PROJETO_CULTURAL',
    'Cadastro de Evento Cultural': 'CADASTRO_EVENTO_CULTURAL',
    'Evento Cultural': 'CADASTRO_EVENTO_CULTURAL',
    'Registro de Manifesta\u00e7\u00e3o Cultural': 'REGISTRO_MANIFESTACAO_CULTURAL',
    'Patrim\u00f4nio Cultural': 'REGISTRO_MANIFESTACAO_CULTURAL',
    'Manifesta\u00e7\u00e3o Cultural': 'REGISTRO_MANIFESTACAO_CULTURAL',
    'Agenda de Eventos Culturais': null, // INFORMATIVO
    'Calend\u00e1rio Cultural': null, // INFORMATIVO

    // ========================================
    // SECRETARIA DE ESPORTES (9 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Esportes': 'ATENDIMENTOS_ESPORTES',
    'Atendimentos Esportes': 'ATENDIMENTOS_ESPORTES',
    'Atendimento Esportivo': 'ATENDIMENTOS_ESPORTES',
    'Inscri\u00e7\u00e3o em Escolinha': 'INSCRICAO_ESCOLINHA',
    'Escolinha Esportiva': 'INSCRICAO_ESCOLINHA',
    'Escola de Esportes': 'INSCRICAO_ESCOLINHA',
    'Cadastro de Atleta': 'CADASTRO_ATLETA',
    'Atleta Federado': 'CADASTRO_ATLETA',
    'Registro de Atleta': 'CADASTRO_ATLETA',
    'Reserva de Espa\u00e7o Esportivo': 'RESERVA_ESPACO_ESPORTIVO',
    'Quadra Esportiva': 'RESERVA_ESPACO_ESPORTIVO',
    'Gin\u00e1sio': 'RESERVA_ESPACO_ESPORTIVO',
    'Campo de Futebol': 'RESERVA_ESPACO_ESPORTIVO',
    'Inscri\u00e7\u00e3o em Competi\u00e7\u00e3o': 'INSCRICAO_COMPETICAO',
    'Campeonato': 'INSCRICAO_COMPETICAO',
    'Competi\u00e7\u00e3o Esportiva': 'INSCRICAO_COMPETICAO',
    'Cadastro de Equipe Esportiva': 'CADASTRO_EQUIPE_ESPORTIVA',
    'Equipe Municipal': 'CADASTRO_EQUIPE_ESPORTIVA',
    'Time Esportivo': 'CADASTRO_EQUIPE_ESPORTIVA',
    'Inscri\u00e7\u00e3o em Torneio': 'INSCRICAO_TORNEIO',
    'Torneio': 'INSCRICAO_TORNEIO',
    'Torneio Esportivo': 'INSCRICAO_TORNEIO',
    'Cadastro de Modalidade': 'CADASTRO_MODALIDADE',
    'Modalidade Esportiva': 'CADASTRO_MODALIDADE',
    'Esporte': 'CADASTRO_MODALIDADE',
    'Agenda de Eventos Esportivos': null, // INFORMATIVO
    'Calend\u00e1rio Esportivo': null, // INFORMATIVO

    // ========================================
    // SECRETARIA DE HABITA\u00c7\u00c3O (7 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Habita\u00e7\u00e3o': 'ATENDIMENTOS_HABITACAO',
    'Atendimentos Habita\u00e7\u00e3o': 'ATENDIMENTOS_HABITACAO',
    'Atendimento Habitacional': 'ATENDIMENTOS_HABITACAO',
    'Inscri\u00e7\u00e3o em Programa Habitacional': 'INSCRICAO_PROGRAMA_HABITACIONAL',
    'Minha Casa Minha Vida': 'INSCRICAO_PROGRAMA_HABITACIONAL',
    'Programa Habitacional': 'INSCRICAO_PROGRAMA_HABITACIONAL',
    'Casa Popular': 'INSCRICAO_PROGRAMA_HABITACIONAL',
    'Regulariza\u00e7\u00e3o Fundi\u00e1ria': 'REGULARIZACAO_FUNDIARIA',
    'T\u00edtulo de Propriedade': 'REGULARIZACAO_FUNDIARIA',
    'Escritura': 'REGULARIZACAO_FUNDIARIA',
    'Solicita\u00e7\u00e3o de Aux\u00edlio Aluguel': 'SOLICITACAO_AUXILIO_ALUGUEL',
    'Aux\u00edlio Moradia': 'SOLICITACAO_AUXILIO_ALUGUEL',
    'Aux\u00edlio Aluguel': 'SOLICITACAO_AUXILIO_ALUGUEL',
    'Cadastro de Unidade Habitacional': 'CADASTRO_UNIDADE_HABITACIONAL',
    'Unidade Habitacional': 'CADASTRO_UNIDADE_HABITACIONAL',
    'Casa Popular': 'CADASTRO_UNIDADE_HABITACIONAL',
    'Inscri\u00e7\u00e3o na Fila de Habita\u00e7\u00e3o': 'INSCRICAO_FILA_HABITACAO',
    'Fila de Espera': 'INSCRICAO_FILA_HABITACAO',
    'Lista de Habita\u00e7\u00e3o': 'INSCRICAO_FILA_HABITACAO',
    'Consulta de Programas Habitacionais': null, // INFORMATIVO

    // ========================================
    // SECRETARIA DE MEIO AMBIENTE (7 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Meio Ambiente': 'ATENDIMENTOS_MEIO_AMBIENTE',
    'Atendimentos Meio Ambiente': 'ATENDIMENTOS_MEIO_AMBIENTE',
    'Atendimento Ambiental': 'ATENDIMENTOS_MEIO_AMBIENTE',
    'Licen\u00e7a Ambiental': 'LICENCA_AMBIENTAL',
    'Licenciamento': 'LICENCA_AMBIENTAL',
    'Licenciamento Ambiental': 'LICENCA_AMBIENTAL',
    'Den\u00fancia Ambiental': 'DENUNCIA_AMBIENTAL',
    'Reclama\u00e7\u00e3o Ambiental': 'DENUNCIA_AMBIENTAL',
    'Crime Ambiental': 'DENUNCIA_AMBIENTAL',
    'Programa Ambiental': 'PROGRAMA_AMBIENTAL',
    'Educa\u00e7\u00e3o Ambiental': 'PROGRAMA_AMBIENTAL',
    'Projeto Ambiental': 'PROGRAMA_AMBIENTAL',
    'Autoriza\u00e7\u00e3o de Poda': 'AUTORIZACAO_PODA_CORTE',
    'Corte de \u00c1rvore': 'AUTORIZACAO_PODA_CORTE',
    'Poda de \u00c1rvore': 'AUTORIZACAO_PODA_CORTE',
    'Vistoria Ambiental': 'VISTORIA_AMBIENTAL',
    'Inspe\u00e7\u00e3o Ambiental': 'VISTORIA_AMBIENTAL',
    'Fiscaliza\u00e7\u00e3o Ambiental': 'VISTORIA_AMBIENTAL',
    'Gest\u00e3o de \u00c1reas Protegidas': 'GESTAO_AREAS_PROTEGIDAS',
    'APP': 'GESTAO_AREAS_PROTEGIDAS',
    '\u00c1rea de Preserva\u00e7\u00e3o': 'GESTAO_AREAS_PROTEGIDAS',

    // ========================================
    // SECRETARIA DE OBRAS P\u00daBLICAS (7 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Obras': 'ATENDIMENTOS_OBRAS',
    'Atendimentos Obras': 'ATENDIMENTOS_OBRAS',
    'Atendimento de Obras': 'ATENDIMENTOS_OBRAS',
    'Solicita\u00e7\u00e3o de Reparo de Via': 'SOLICITACAO_REPARO_VIA',
    'Buraco na Rua': 'SOLICITACAO_REPARO_VIA',
    'Pavimenta\u00e7\u00e3o': 'SOLICITACAO_REPARO_VIA',
    'Reparo de Rua': 'SOLICITACAO_REPARO_VIA',
    'Tapa Buraco': 'SOLICITACAO_REPARO_VIA',
    'Vistoria T\u00e9cnica': 'VISTORIA_TECNICA_OBRAS',
    'Inspe\u00e7\u00e3o de Obra': 'VISTORIA_TECNICA_OBRAS',
    'Vistoria de Obras': 'VISTORIA_TECNICA_OBRAS',
    'Cadastro de Obra P\u00fablica': 'CADASTRO_OBRA_PUBLICA',
    'Obra Municipal': 'CADASTRO_OBRA_PUBLICA',
    'Obra P\u00fablica': 'CADASTRO_OBRA_PUBLICA',
    'Inspe\u00e7\u00e3o de Obra': 'INSPECAO_OBRA',
    'Fiscaliza\u00e7\u00e3o de Obra': 'INSPECAO_OBRA',
    'Acompanhamento de Obras': null, // INFORMATIVO
    'Progresso de Obras': null, // INFORMATIVO
    'Mapa de Obras': null, // INFORMATIVO

    // ========================================
    // SECRETARIA DE PLANEJAMENTO URBANO (9 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Planejamento': 'ATENDIMENTOS_PLANEJAMENTO',
    'Atendimentos Planejamento': 'ATENDIMENTOS_PLANEJAMENTO',
    'Atendimento Urbano': 'ATENDIMENTOS_PLANEJAMENTO',
    'Aprova\u00e7\u00e3o de Projeto': 'APROVACAO_PROJETO',
    'Projeto Arquitet\u00f4nico': 'APROVACAO_PROJETO',
    'An\u00e1lise de Projeto': 'APROVACAO_PROJETO',
    'Alvar\u00e1 de Constru\u00e7\u00e3o': 'ALVARA_CONSTRUCAO',
    'Licen\u00e7a de Constru\u00e7\u00e3o': 'ALVARA_CONSTRUCAO',
    'Alvar\u00e1 de Obra': 'ALVARA_CONSTRUCAO',
    'Alvar\u00e1 de Funcionamento': 'ALVARA_FUNCIONAMENTO',
    'Licen\u00e7a Comercial': 'ALVARA_FUNCIONAMENTO',
    'Alvar\u00e1 Comercial': 'ALVARA_FUNCIONAMENTO',
    'Solicita\u00e7\u00e3o de Certid\u00e3o': 'SOLICITACAO_CERTIDAO',
    'Certid\u00e3o Municipal': 'SOLICITACAO_CERTIDAO',
    'Certid\u00e3o': 'SOLICITACAO_CERTIDAO',
    'Den\u00fancia de Constru\u00e7\u00e3o Irregular': 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    'Obra Irregular': 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    'Constru\u00e7\u00e3o Irregular': 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    'Cadastro de Loteamento': 'CADASTRO_LOTEAMENTO',
    'Loteamento': 'CADASTRO_LOTEAMENTO',
    'Parcelamento do Solo': 'CADASTRO_LOTEAMENTO',
    'Consultas P\u00fablicas': null, // INFORMATIVO
    'Audi\u00eancia P\u00fablica': null, // INFORMATIVO
    'Mapa Urbano': null, // INFORMATIVO
    'Zoneamento': null, // INFORMATIVO

    // ========================================
    // SECRETARIA DE SEGURAN\u00c7A P\u00daBLICA (11 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Seguran\u00e7a': 'ATENDIMENTOS_SEGURANCA',
    'Atendimentos Seguran\u00e7a': 'ATENDIMENTOS_SEGURANCA',
    'Atendimento de Seguran\u00e7a': 'ATENDIMENTOS_SEGURANCA',
    'Registro de Ocorr\u00eancia': 'REGISTRO_OCORRENCIA',
    'Boletim de Ocorr\u00eancia': 'REGISTRO_OCORRENCIA',
    'BO': 'REGISTRO_OCORRENCIA',
    'Ocorr\u00eancia Policial': 'REGISTRO_OCORRENCIA',
    'Solicita\u00e7\u00e3o de Ronda': 'SOLICITACAO_RONDA',
    'Ronda Policial': 'SOLICITACAO_RONDA',
    'Patrulhamento': 'SOLICITACAO_RONDA',
    'Solicita\u00e7\u00e3o de C\u00e2mera de Seguran\u00e7a': 'SOLICITACAO_CAMERA_SEGURANCA',
    'C\u00e2mera de Monitoramento': 'SOLICITACAO_CAMERA_SEGURANCA',
    'Videomonitoramento': 'SOLICITACAO_CAMERA_SEGURANCA',
    'Den\u00fancia An\u00f4nima': 'DENUNCIA_ANONIMA',
    'Disque Den\u00fancia': 'DENUNCIA_ANONIMA',
    'Den\u00fancia Sigilosa': 'DENUNCIA_ANONIMA',
    'Cadastro de Ponto Cr\u00edtico': 'CADASTRO_PONTO_CRITICO',
    '\u00c1rea de Risco': 'CADASTRO_PONTO_CRITICO',
    'Local Perigoso': 'CADASTRO_PONTO_CRITICO',
    'Alerta de Seguran\u00e7a': 'ALERTA_SEGURANCA',
    'Aviso de Seguran\u00e7a': 'ALERTA_SEGURANCA',
    'Comunica\u00e7\u00e3o de Risco': 'ALERTA_SEGURANCA',
    'Registro de Patrulha': 'REGISTRO_PATRULHA',
    'Patrulhamento': 'REGISTRO_PATRULHA',
    'Ronda': 'REGISTRO_PATRULHA',
    'Gest\u00e3o da Guarda Municipal': 'GESTAO_GUARDA_MUNICIPAL',
    'Guarda Municipal': 'GESTAO_GUARDA_MUNICIPAL',
    'GM': 'GESTAO_GUARDA_MUNICIPAL',
    'Gest\u00e3o de Vigil\u00e2ncia': 'GESTAO_VIGILANCIA',
    'Central de Monitoramento': 'GESTAO_VIGILANCIA',
    'Centro de Opera\u00e7\u00f5es': 'GESTAO_VIGILANCIA',
    'Estat\u00edsticas de Seguran\u00e7a': null, // INFORMATIVO
    'Estat\u00edsticas Regionais': null, // INFORMATIVO

    // ========================================
    // SECRETARIA DE SERVI\u00c7OS P\u00daBLICOS (9 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Servi\u00e7os P\u00fablicos': 'ATENDIMENTOS_SERVICOS_PUBLICOS',
    'Atendimentos Servi\u00e7os': 'ATENDIMENTOS_SERVICOS_PUBLICOS',
    'Atendimento P\u00fablico': 'ATENDIMENTOS_SERVICOS_PUBLICOS',
    'Ilumina\u00e7\u00e3o P\u00fablica': 'ILUMINACAO_PUBLICA',
    'Poste Queimado': 'ILUMINACAO_PUBLICA',
    'L\u00e2mpada': 'ILUMINACAO_PUBLICA',
    'Luz de Rua': 'ILUMINACAO_PUBLICA',
    'Limpeza Urbana': 'LIMPEZA_URBANA',
    'Varri\u00e7\u00e3o': 'LIMPEZA_URBANA',
    'Coleta de Lixo': 'LIMPEZA_URBANA',
    'Lixo': 'LIMPEZA_URBANA',
    'Coleta Especial': 'COLETA_ESPECIAL',
    'Entulho': 'COLETA_ESPECIAL',
    'M\u00f3veis Velhos': 'COLETA_ESPECIAL',
    'Descarte': 'COLETA_ESPECIAL',
    'Solicita\u00e7\u00e3o de Capina': 'SOLICITACAO_CAPINA',
    'Capina': 'SOLICITACAO_CAPINA',
    'Mato Alto': 'SOLICITACAO_CAPINA',
    'Ro\u00e7ada': 'SOLICITACAO_CAPINA',
    'Solicita\u00e7\u00e3o de Desobstru\u00e7\u00e3o': 'SOLICITACAO_DESOBSTRUCAO',
    'Boca de Lobo': 'SOLICITACAO_DESOBSTRUCAO',
    'Bueiro Entupido': 'SOLICITACAO_DESOBSTRUCAO',
    'Drenagem': 'SOLICITACAO_DESOBSTRUCAO',
    'Solicita\u00e7\u00e3o de Poda': 'SOLICITACAO_PODA',
    'Poda de \u00c1rvore': 'SOLICITACAO_PODA',
    'Poda': 'SOLICITACAO_PODA',
    'Registro de Problema com Foto': null, // FUNCIONALIDADE TRANSVERSAL
    'Gest\u00e3o de Equipes': 'GESTAO_EQUIPES_SERVICOS',
    'Programa\u00e7\u00e3o de Equipes': 'GESTAO_EQUIPES_SERVICOS',
    'Escala de Servi\u00e7o': 'GESTAO_EQUIPES_SERVICOS',

    // ========================================
    // SECRETARIA DE TURISMO (9 servi\u00e7os + varia\u00e7\u00f5es)
    // ========================================
    'Atendimentos - Turismo': 'ATENDIMENTOS_TURISMO',
    'Atendimentos Turismo': 'ATENDIMENTOS_TURISMO',
    'Atendimento Tur\u00edstico': 'ATENDIMENTOS_TURISMO',
    'Cadastro de Estabelecimento Tur\u00edstico': 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    'Hotel': 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    'Pousada': 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    'Restaurante': 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    'Estabelecimento Tur\u00edstico': 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    'Cadastro de Guia Tur\u00edstico': 'CADASTRO_GUIA_TURISTICO',
    'Guia de Turismo': 'CADASTRO_GUIA_TURISTICO',
    'Guia Tur\u00edstico': 'CADASTRO_GUIA_TURISTICO',
    'Inscri\u00e7\u00e3o em Programa Tur\u00edstico': 'INSCRICAO_PROGRAMA_TURISTICO',
    'Programa de Turismo': 'INSCRICAO_PROGRAMA_TURISTICO',
    'Programa Tur\u00edstico': 'INSCRICAO_PROGRAMA_TURISTICO',
    'Registro de Atrativo Tur\u00edstico': 'REGISTRO_ATRATIVO_TURISTICO',
    'Ponto Tur\u00edstico': 'REGISTRO_ATRATIVO_TURISTICO',
    'Atra\u00e7\u00e3o Tur\u00edstica': 'REGISTRO_ATRATIVO_TURISTICO',
    'Cadastro de Roteiro Tur\u00edstico': 'CADASTRO_ROTEIRO_TURISTICO',
    'Roteiro': 'CADASTRO_ROTEIRO_TURISTICO',
    'Roteiro Tur\u00edstico': 'CADASTRO_ROTEIRO_TURISTICO',
    'Cadastro de Evento Tur\u00edstico': 'CADASTRO_EVENTO_TURISTICO',
    'Evento Tur\u00edstico': 'CADASTRO_EVENTO_TURISTICO',
    'Festival': 'CADASTRO_EVENTO_TURISTICO',
    'Mapa Tur\u00edstico': null, // INFORMATIVO
    'Guia da Cidade': null, // INFORMATIVO
    'Informa\u00e7\u00f5es Tur\u00edsticas': null, // INFORMATIVO
  }

  // 3. Buscar no mapeamento exato
  const mappedModule = serviceNameMapping[service.name]
  if (mappedModule !== undefined) {
    return mappedModule
  }

  // 4. Tentativa de match parcial (case-insensitive)
  const serviceLower = service.name.toLowerCase()
  for (const [key, value] of Object.entries(serviceNameMapping)) {
    if (serviceLower.includes(key.toLowerCase()) || key.toLowerCase().includes(serviceLower)) {
      return value
    }
  }

  // 5. Fallback: tentar pela categoria do departamento
  if (service.department?.name) {
    const deptName = service.department.name.toLowerCase()
    const categoryMapping: Record<string, string> = {
      'sa\u00fade': 'ATENDIMENTOS_SAUDE',
      'saude': 'ATENDIMENTOS_SAUDE',
      'educa\u00e7\u00e3o': 'ATENDIMENTOS_EDUCACAO',
      'educacao': 'ATENDIMENTOS_EDUCACAO',
      'assist\u00eancia': 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
      'assistencia': 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
      'social': 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
      'agricultura': 'ATENDIMENTOS_AGRICULTURA',
      'rural': 'ATENDIMENTOS_AGRICULTURA',
      'cultura': 'ATENDIMENTOS_CULTURA',
      'esporte': 'ATENDIMENTOS_ESPORTES',
      'esportes': 'ATENDIMENTOS_ESPORTES',
      'habita\u00e7\u00e3o': 'ATENDIMENTOS_HABITACAO',
      'habitacao': 'ATENDIMENTOS_HABITACAO',
      'ambiente': 'ATENDIMENTOS_MEIO_AMBIENTE',
      'ambiental': 'ATENDIMENTOS_MEIO_AMBIENTE',
      'obras': 'ATENDIMENTOS_OBRAS',
      'planejamento': 'ATENDIMENTOS_PLANEJAMENTO',
      'urbano': 'ATENDIMENTOS_PLANEJAMENTO',
      'seguran\u00e7a': 'ATENDIMENTOS_SEGURANCA',
      'seguranca': 'ATENDIMENTOS_SEGURANCA',
      'servi\u00e7os': 'ATENDIMENTOS_SERVICOS_PUBLICOS',
      'servicos': 'ATENDIMENTOS_SERVICOS_PUBLICOS',
      'turismo': 'ATENDIMENTOS_TURISMO',
    }

    for (const [key, value] of Object.entries(categoryMapping)) {
      if (deptName.includes(key)) {
        return value
      }
    }
  }

  // 6. \u00daltimo fallback
  console.warn(`\u26a0\ufe0f  M\u00f3dulo n\u00e3o mapeado para servi\u00e7o: ${service.name}`)
  return null
}

// ========================================
// FUN\u00c7\u00c3O: CONSTRUIR FORM SCHEMA
// ========================================

async function buildFormSchema(service: any): Promise<any> {
  // 1. Se j\u00e1 tem customForm definido, usar
  if (service.customForm && typeof service.customForm === 'object') {
    return convertServiceFormToJsonSchema(service.customForm)
  }

  // 2. Se tem customFields array, converter para JSON Schema
  if (service.customFields && Array.isArray(service.customFields) && service.customFields.length > 0) {
    return convertCustomFieldsToJsonSchema(service.customFields)
  }

  // 3. Se tem campos no formato antigo, converter
  if (service.fields) {
    return convertLegacyFieldsToSchema(service.fields)
  }

  // 4. Schema vazio para servi\u00e7os sem formul\u00e1rio
  return null
}

// Fun\u00e7\u00e3o auxiliar: Converter ServiceForm para JSON Schema
function convertServiceFormToJsonSchema(serviceForm: any): any {
  if (serviceForm.fields && Array.isArray(serviceForm.fields)) {
    return convertCustomFieldsToJsonSchema(serviceForm.fields)
  }

  return serviceForm
}

// Fun\u00e7\u00e3o auxiliar: Converter customFields para JSON Schema
function convertCustomFieldsToJsonSchema(fields: any[]): any {
  const properties: Record<string, any> = {}
  const required: string[] = []

  for (const field of fields) {
    const fieldKey = field.key || field.name || field.id

    properties[fieldKey] = {
      type: mapFieldType(field.type),
      title: field.label || field.title || fieldKey,
      description: field.description || field.helpText,
      ...(field.options && { enum: field.options }),
      ...(field.placeholder && { placeholder: field.placeholder }),
      ...(field.validation && { validation: field.validation })
    }

    if (field.required) {
      required.push(fieldKey)
    }
  }

  return {
    type: 'object',
    properties,
    required,
    title: 'Formul\u00e1rio de Servi\u00e7o'
  }
}

// Fun\u00e7\u00e3o auxiliar: Mapear tipo de campo
function mapFieldType(type: string): string {
  const typeMapping: Record<string, string> = {
    'text': 'string',
    'textarea': 'string',
    'number': 'number',
    'email': 'string',
    'phone': 'string',
    'date': 'string',
    'time': 'string',
    'datetime': 'string',
    'select': 'string',
    'checkbox': 'boolean',
    'radio': 'string',
    'file': 'string',
    'boolean': 'boolean'
  }

  return typeMapping[type] || 'string'
}

// Fun\u00e7\u00e3o auxiliar: Converter campos legados
function convertLegacyFieldsToSchema(fields: any): any {
  if (typeof fields === 'string') {
    try {
      fields = JSON.parse(fields)
    } catch {
      return null
    }
  }

  if (Array.isArray(fields)) {
    return convertCustomFieldsToJsonSchema(fields)
  }

  return fields
}

// ========================================
// FUN\u00c7\u00c3O: VALIDAR MIGRA\u00c7\u00c3O
// ========================================

async function validateMigration() {
  // Contar registros migrados
  const servicesCount = await prisma.serviceSimplified.count()
  const protocolsCount = await prisma.protocolSimplified.count()
  const historyCount = await prisma.protocolHistorySimplified.count()
  const evaluationsCount = await prisma.protocolEvaluationSimplified.count()

  console.log('Registros migrados:')
  console.log(`  \u2705 Servi\u00e7os: ${servicesCount}`)
  console.log(`  \u2705 Protocolos: ${protocolsCount}`)
  console.log(`  \u2705 Hist\u00f3rico: ${historyCount}`)
  console.log(`  \u2705 Avalia\u00e7\u00f5es: ${evaluationsCount}`)

  // Verificar integridade
  console.log('\nVerificando integridade...')

  const servicesWithoutDept = await prisma.serviceSimplified.count({
    where: { department: null }
  })

  const protocolsWithoutService = await prisma.protocolSimplified.count({
    where: { service: null }
  })

  if (servicesWithoutDept > 0) {
    console.warn(`  \u26a0\ufe0f  ${servicesWithoutDept} servi\u00e7os sem departamento`)
  }

  if (protocolsWithoutService > 0) {
    console.warn(`  \u26a0\ufe0f  ${protocolsWithoutService} protocolos sem servi\u00e7o`)
  }

  // Amostra de protocolo migrado
  const sampleProtocol = await prisma.protocolSimplified.findFirst({
    include: {
      citizen: {
        select: { id: true, name: true, cpf: true }
      },
      service: {
        select: { id: true, name: true, serviceType: true, moduleType: true }
      },
      history: {
        take: 3,
        orderBy: { timestamp: 'desc' }
      }
    }
  })

  if (sampleProtocol) {
    console.log('\nAmostra de protocolo migrado:')
    console.log(`  N\u00famero: ${sampleProtocol.number}`)
    console.log(`  T\u00edtulo: ${sampleProtocol.title}`)
    console.log(`  Status: ${sampleProtocol.status}`)
    console.log(`  Servi\u00e7o: ${sampleProtocol.service.name}`)
    console.log(`  Tipo: ${sampleProtocol.service.serviceType}`)
    console.log(`  M\u00f3dulo: ${sampleProtocol.moduleType || 'N/A'}`)
    console.log(`  Hist\u00f3rico: ${sampleProtocol.history.length} registros`)
  }

  console.log('\n\u2705 Valida\u00e7\u00e3o conclu\u00edda')
}

// Executar migra\u00e7\u00e3o
main()
  .catch((e) => {
    console.error('\n\u274c ERRO FATAL:', e)
    process.exit(1)
  })
