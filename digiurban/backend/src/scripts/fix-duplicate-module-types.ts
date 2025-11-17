/**
 * Script para corrigir moduleTypes duplicados antes de aplicar constraint UNIQUE
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDuplicateModuleTypes() {
  console.log('🔍 Buscando moduleTypes duplicados...\n')

  // Buscar serviços agrupados por moduleType
  const services = await prisma.serviceSimplified.findMany({
    where: {
      moduleType: { not: null }
    },
    orderBy: [
      { moduleType: 'asc' },
      { createdAt: 'asc' }
    ],
    select: {
      id: true,
      name: true,
      moduleType: true,
      createdAt: true,
      isActive: true
    }
  })

  // Agrupar por moduleType
  const grouped = new Map<string, typeof services>()

  for (const service of services) {
    if (!service.moduleType) continue

    if (!grouped.has(service.moduleType)) {
      grouped.set(service.moduleType, [])
    }
    grouped.get(service.moduleType)!.push(service)
  }

  // Encontrar duplicados
  const duplicates = Array.from(grouped.entries())
    .filter(([_, services]) => services.length > 1)

  if (duplicates.length === 0) {
    console.log('✅ Nenhum moduleType duplicado encontrado!')
    return
  }

  console.log(`⚠️  Encontrados ${duplicates.length} moduleTypes duplicados:\n`)

  let fixed = 0
  let errors = 0

  for (const [moduleType, duplicateServices] of duplicates) {
    console.log(`\n📋 moduleType: "${moduleType}" (${duplicateServices.length} serviços)`)

    // Manter o primeiro (mais antigo), renomear os outros
    const [keep, ...rename] = duplicateServices

    console.log(`   ✅ Mantendo: ${keep.name} (${keep.id})`)

    for (let i = 0; i < rename.length; i++) {
      const service = rename[i]
      const newModuleType = `${moduleType}_${i + 1}`

      try {
        await prisma.serviceSimplified.update({
          where: { id: service.id },
          data: { moduleType: newModuleType }
        })

        console.log(`   🔄 Renomeado: ${service.name}`)
        console.log(`      ${moduleType} → ${newModuleType}`)
        fixed++
      } catch (error) {
        console.error(`   ❌ Erro ao renomear ${service.name}:`, error)
        errors++
      }
    }
  }

  console.log(`\n✅ Resumo:`)
  console.log(`   Duplicados encontrados: ${duplicates.reduce((acc, [_, services]) => acc + services.length - 1, 0)}`)
  console.log(`   Corrigidos: ${fixed}`)
  console.log(`   Erros: ${errors}`)
}

async function main() {
  try {
    await fixDuplicateModuleTypes()
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
