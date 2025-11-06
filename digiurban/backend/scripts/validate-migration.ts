/**
 * SCRIPT DE VALIDA\u00c7\u00c3O DE MIGRA\u00c7\u00c3O
 *
 * Valida a integridade dos dados ap\u00f3s a migra\u00e7\u00e3o
 * Verifica consist\u00eancia, completude e qualidade dos dados
 *
 * Data: 29/10/2025
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ========================================
// FUN\u00c7\u00c3O PRINCIPAL
// ========================================

async function main() {
  console.log('\n========================================')
  console.log('  VALIDA\u00c7\u00c3O DE MIGRA\u00c7\u00c3O')
  console.log('========================================\n')

  try {
    // 1. Estat\u00edsticas gerais
    await validateGeneralStats()

    // 2. Integridade referencial
    await validateReferentialIntegrity()

    // 3. Qualidade dos dados
    await validateDataQuality()

    // 4. Mapeamento de m\u00f3dulos
    await validateModuleMapping()

    // 5. Hist\u00f3rico e avalia\u00e7\u00f5es
    await validateHistoryAndEvaluations()

    // 6. Amostragem
    await showSamples()

    console.log('\n========================================')
    console.log('\u2705 VALIDA\u00c7\u00c3O CONCLU\u00cdDA COM SUCESSO!')
    console.log('========================================\n')
  } catch (error) {
    console.error('\n\u274c ERRO NA VALIDA\u00c7\u00c3O:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// ========================================
// 1. ESTAT\u00cdSTICAS GERAIS
// ========================================

async function validateGeneralStats() {
  console.log('\u23f3 1. Estat\u00edsticas Gerais\n')

  const [
    servicesCount,
    protocolsCount,
    historyCount,
    evaluationsCount
  ] = await Promise.all([
    prisma.serviceSimplified.count(),
    prisma.protocolSimplified.count(),
    prisma.protocolHistorySimplified.count(),
    prisma.protocolEvaluationSimplified.count()
  ])

  console.log('  Registros migrados:')
  console.log(`    Servi\u00e7os: ${servicesCount}`)
  console.log(`    Protocolos: ${protocolsCount}`)
  console.log(`    Hist\u00f3rico: ${historyCount}`)
  console.log(`    Avalia\u00e7\u00f5es: ${evaluationsCount}`)

  // Estat\u00edsticas por tipo de servi\u00e7o
  const servicesByType = await prisma.serviceSimplified.groupBy({
    by: ['serviceType'],
    _count: true
  })

  console.log('\n  Servi\u00e7os por tipo:')
  for (const item of servicesByType) {
    console.log(`    ${item.serviceType}: ${item._count}`)
  }

  // Estat\u00edsticas por status de protocolo
  const protocolsByStatus = await prisma.protocolSimplified.groupBy({
    by: ['status'],
    _count: true
  })

  console.log('\n  Protocolos por status:')
  for (const item of protocolsByStatus) {
    console.log(`    ${item.status}: ${item._count}`)
  }

  console.log('\n  \u2705 Estat\u00edsticas gerais validadas\n')
}

// ========================================
// 2. INTEGRIDADE REFERENCIAL
// ========================================

async function validateReferentialIntegrity() {
  console.log('\u23f3 2. Integridade Referencial\n')

  let issues = 0

  // Servi\u00e7os sem departamento
  const servicesWithoutDept = await prisma.serviceSimplified.count({
    where: { departmentId: null }
  })

  if (servicesWithoutDept > 0) {
    console.log(`  \u26a0\ufe0f  ${servicesWithoutDept} servi\u00e7os sem departamento`)
    issues++
  } else {
    console.log(`  \u2713 Todos os servi\u00e7os t\u00eam departamento`)
  }

  // Protocolos sem servi\u00e7o
  const protocolsWithoutService = await prisma.protocolSimplified.count({
    where: { serviceId: null }
  })

  if (protocolsWithoutService > 0) {
    console.log(`  \u26a0\ufe0f  ${protocolsWithoutService} protocolos sem servi\u00e7o`)
    issues++
  } else {
    console.log(`  \u2713 Todos os protocolos t\u00eam servi\u00e7o`)
  }

  // Protocolos sem cidad\u00e3o
  const protocolsWithoutCitizen = await prisma.protocolSimplified.count({
    where: { citizenId: null }
  })

  if (protocolsWithoutCitizen > 0) {
    console.log(`  \u26a0\ufe0f  ${protocolsWithoutCitizen} protocolos sem cidad\u00e3o`)
    issues++
  } else {
    console.log(`  \u2713 Todos os protocolos t\u00eam cidad\u00e3o`)
  }

  // Hist\u00f3rico sem protocolo
  const historyWithoutProtocol = await prisma.protocolHistorySimplified.count({
    where: { protocolId: null }
  })

  if (historyWithoutProtocol > 0) {
    console.log(`  \u26a0\ufe0f  ${historyWithoutProtocol} registros de hist\u00f3rico sem protocolo`)
    issues++
  } else {
    console.log(`  \u2713 Todo hist\u00f3rico est\u00e1 vinculado a protocolos`)
  }

  if (issues === 0) {
    console.log('\n  \u2705 Integridade referencial validada\n')
  } else {
    console.log(`\n  \u26a0\ufe0f  ${issues} problemas de integridade encontrados\n`)
  }
}

// ========================================
// 3. QUALIDADE DOS DADOS
// ========================================

async function validateDataQuality() {
  console.log('\u23f3 3. Qualidade dos Dados\n')

  let warnings = 0

  // Servi\u00e7os sem nome
  const servicesWithoutName = await prisma.serviceSimplified.count({
    where: {
      OR: [
        { name: null },
        { name: '' }
      ]
    }
  })

  if (servicesWithoutName > 0) {
    console.log(`  \u26a0\ufe0f  ${servicesWithoutName} servi\u00e7os sem nome`)
    warnings++
  } else {
    console.log(`  \u2713 Todos os servi\u00e7os t\u00eam nome`)
  }

  // Protocolos sem t\u00edtulo
  const protocolsWithoutTitle = await prisma.protocolSimplified.count({
    where: {
      OR: [
        { title: null },
        { title: '' }
      ]
    }
  })

  if (protocolsWithoutTitle > 0) {
    console.log(`  \u26a0\ufe0f  ${protocolsWithoutTitle} protocolos sem t\u00edtulo`)
    warnings++
  } else {
    console.log(`  \u2713 Todos os protocolos t\u00eam t\u00edtulo`)
  }

  // Protocolos sem n\u00famero
  const protocolsWithoutNumber = await prisma.protocolSimplified.count({
    where: {
      OR: [
        { number: null },
        { number: '' }
      ]
    }
  })

  if (protocolsWithoutNumber > 0) {
    console.log(`  \u26a0\ufe0f  ${protocolsWithoutNumber} protocolos sem n\u00famero`)
    warnings++
  } else {
    console.log(`  \u2713 Todos os protocolos t\u00eam n\u00famero`)
  }

  // Servi\u00e7os COM_DADOS sem moduleType
  const comDadosWithoutModule = await prisma.serviceSimplified.count({
    where: {
      serviceType: 'COM_DADOS',
      moduleType: null
    }
  })

  if (comDadosWithoutModule > 0) {
    console.log(`  \u26a0\ufe0f  ${comDadosWithoutModule} servi\u00e7os COM_DADOS sem moduleType`)
    warnings++
  } else {
    console.log(`  \u2713 Todos os servi\u00e7os COM_DADOS t\u00eam moduleType`)
  }

  if (warnings === 0) {
    console.log('\n  \u2705 Qualidade dos dados validada\n')
  } else {
    console.log(`\n  \u26a0\ufe0f  ${warnings} avisos de qualidade encontrados\n`)
  }
}

// ========================================
// 4. MAPEAMENTO DE M\u00d3DULOS
// ========================================

async function validateModuleMapping() {
  console.log('\u23f3 4. Mapeamento de M\u00f3dulos\n')

  // Contar servi\u00e7os COM_DADOS
  const comDadosCount = await prisma.serviceSimplified.count({
    where: { serviceType: 'COM_DADOS' }
  })

  // Contar servi\u00e7os INFORMATIVOS
  const informativosCount = await prisma.serviceSimplified.count({
    where: { serviceType: 'INFORMATIVO' }
  })

  console.log(`  Servi\u00e7os COM_DADOS: ${comDadosCount}`)
  console.log(`  Servi\u00e7os INFORMATIVOS: ${informativosCount}`)

  // M\u00f3dulos mais usados
  const topModules = await prisma.serviceSimplified.groupBy({
    by: ['moduleType'],
    _count: true,
    where: {
      moduleType: { not: null }
    },
    orderBy: {
      _count: {
        moduleType: 'desc'
      }
    },
    take: 10
  })

  console.log('\n  Top 10 m\u00f3dulos mais usados:')
  for (const module of topModules) {
    console.log(`    ${module.moduleType}: ${module._count}`)
  }

  // Servi\u00e7os por secretaria
  const servicesByDept = await prisma.serviceSimplified.findMany({
    select: {
      department: {
        select: {
          name: true
        }
      },
      serviceType: true
    }
  })

  const deptStats: Record<string, { comDados: number; informativos: number }> = {}

  for (const service of servicesByDept) {
    const deptName = service.department.name
    if (!deptStats[deptName]) {
      deptStats[deptName] = { comDados: 0, informativos: 0 }
    }

    if (service.serviceType === 'COM_DADOS') {
      deptStats[deptName].comDados++
    } else {
      deptStats[deptName].informativos++
    }
  }

  console.log('\n  Servi\u00e7os por secretaria:')
  for (const [dept, stats] of Object.entries(deptStats)) {
    console.log(`    ${dept}: ${stats.comDados} COM_DADOS, ${stats.informativos} INFORMATIVOS`)
  }

  console.log('\n  \u2705 Mapeamento de m\u00f3dulos validado\n')
}

// ========================================
// 5. HIST\u00d3RICO E AVALIA\u00c7\u00d5ES
// ========================================

async function validateHistoryAndEvaluations() {
  console.log('\u23f3 5. Hist\u00f3rico e Avalia\u00e7\u00f5es\n')

  // Protocolos com hist\u00f3rico
  const protocolsWithHistory = await prisma.protocolSimplified.count({
    where: {
      history: {
        some: {}
      }
    }
  })

  const totalProtocols = await prisma.protocolSimplified.count()
  const historyPercentage = ((protocolsWithHistory / totalProtocols) * 100).toFixed(1)

  console.log(`  Protocolos com hist\u00f3rico: ${protocolsWithHistory}/${totalProtocols} (${historyPercentage}%)`)

  // Protocolos com avalia\u00e7\u00e3o
  const protocolsWithEvaluation = await prisma.protocolSimplified.count({
    where: {
      evaluations: {
        some: {}
      }
    }
  })

  const evaluationPercentage = ((protocolsWithEvaluation / totalProtocols) * 100).toFixed(1)

  console.log(`  Protocolos com avalia\u00e7\u00e3o: ${protocolsWithEvaluation}/${totalProtocols} (${evaluationPercentage}%)`)

  // M\u00e9dia de registros de hist\u00f3rico por protocolo
  const avgHistory = await prisma.protocolHistorySimplified.count() / totalProtocols

  console.log(`  M\u00e9dia de hist\u00f3rico por protocolo: ${avgHistory.toFixed(2)}`)

  // Distribui\u00e7\u00e3o de ratings
  const ratingDistribution = await prisma.protocolEvaluationSimplified.groupBy({
    by: ['rating'],
    _count: true,
    orderBy: {
      rating: 'asc'
    }
  })

  console.log('\n  Distribui\u00e7\u00e3o de avalia\u00e7\u00f5es:')
  for (const item of ratingDistribution) {
    const stars = '\u2605'.repeat(item.rating)
    console.log(`    ${stars} (${item.rating}): ${item._count}`)
  }

  console.log('\n  \u2705 Hist\u00f3rico e avalia\u00e7\u00f5es validados\n')
}

// ========================================
// 6. AMOSTRAGEM
// ========================================

async function showSamples() {
  console.log('\u23f3 6. Amostragem de Dados\n')

  // Amostra de servi\u00e7o COM_DADOS
  const comDadosSample = await prisma.serviceSimplified.findFirst({
    where: { serviceType: 'COM_DADOS' },
    include: {
      department: {
        select: { name: true }
      }
    }
  })

  if (comDadosSample) {
    console.log('  Amostra de Servi\u00e7o COM_DADOS:')
    console.log(`    Nome: ${comDadosSample.name}`)
    console.log(`    Departamento: ${comDadosSample.department.name}`)
    console.log(`    M\u00f3dulo: ${comDadosSample.moduleType}`)
    console.log(`    Form Schema: ${comDadosSample.formSchema ? 'Presente' : 'Ausente'}`)
  }

  // Amostra de servi\u00e7o INFORMATIVO
  const informativoSample = await prisma.serviceSimplified.findFirst({
    where: { serviceType: 'INFORMATIVO' },
    include: {
      department: {
        select: { name: true }
      }
    }
  })

  if (informativoSample) {
    console.log('\n  Amostra de Servi\u00e7o INFORMATIVO:')
    console.log(`    Nome: ${informativoSample.name}`)
    console.log(`    Departamento: ${informativoSample.department.name}`)
    console.log(`    M\u00f3dulo: ${informativoSample.moduleType || 'N/A'}`)
  }

  // Amostra de protocolo
  const protocolSample = await prisma.protocolSimplified.findFirst({
    include: {
      citizen: {
        select: { id: true, name: true, cpf: true }
      },
      service: {
        select: { name: true, serviceType: true, moduleType: true }
      },
      department: {
        select: { name: true }
      },
      history: {
        take: 3,
        orderBy: { timestamp: 'desc' }
      },
      evaluations: true
    }
  })

  if (protocolSample) {
    console.log('\n  Amostra de Protocolo:')
    console.log(`    N\u00famero: ${protocolSample.number}`)
    console.log(`    T\u00edtulo: ${protocolSample.title}`)
    console.log(`    Status: ${protocolSample.status}`)
    console.log(`    Prioridade: ${protocolSample.priority}`)
    console.log(`    Cidad\u00e3o: ${protocolSample.citizen.name} (${protocolSample.citizen.cpf})`)
    console.log(`    Servi\u00e7o: ${protocolSample.service.name}`)
    console.log(`    Tipo: ${protocolSample.service.serviceType}`)
    console.log(`    M\u00f3dulo: ${protocolSample.moduleType || 'N/A'}`)
    console.log(`    Departamento: ${protocolSample.department.name}`)
    console.log(`    Hist\u00f3rico: ${protocolSample.history.length} registros`)
    console.log(`    Avalia\u00e7\u00f5es: ${protocolSample.evaluations.length}`)

    if (protocolSample.history.length > 0) {
      console.log('\n    \u00daltimas a\u00e7\u00f5es:')
      for (const h of protocolSample.history) {
        console.log(`      - ${h.action} em ${h.timestamp.toISOString()}`)
      }
    }
  }

  console.log('\n  \u2705 Amostragem conclu\u00edda\n')
}

// Executar valida\u00e7\u00e3o
main()
  .catch((e) => {
    console.error('\n\u274c ERRO FATAL:', e)
    process.exit(1)
  })
