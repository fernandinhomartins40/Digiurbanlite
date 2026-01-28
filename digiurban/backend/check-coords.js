const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCoordinates() {
  try {
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        number: true,
        title: true,
        latitude: true,
        longitude: true,
        locationType: true,
        address: true,
        department: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    console.log(`\n📍 Total de protocolos com geolocalização: ${protocols.length}\n`)

    // Agrupar por coordenadas
    const coordsMap = new Map()

    protocols.forEach(p => {
      const key = `${p.latitude},${p.longitude}`
      if (!coordsMap.has(key)) {
        coordsMap.set(key, [])
      }
      coordsMap.get(key).push(p)
    })

    console.log(`📊 Coordenadas únicas: ${coordsMap.size}`)
    console.log(`⚠️  Protocolos na mesma coordenada: ${protocols.length - coordsMap.size}\n`)

    // Mostrar coordenadas duplicadas
    console.log('🔍 Análise de coordenadas:\n')

    let duplicateCount = 0
    coordsMap.forEach((protocolList, coords) => {
      if (protocolList.length > 1) {
        duplicateCount++
        console.log(`\n🚨 ${protocolList.length} protocolos na coordenada: ${coords}`)
        protocolList.forEach(p => {
          console.log(`   - #${p.number} | ${p.department?.name || 'Sem dept'} | ${p.locationType || 'N/A'}`)
          console.log(`     "${p.title.substring(0, 60)}..."`)
          if (p.address) {
            console.log(`     📍 ${p.address.substring(0, 60)}`)
          }
        })
      }
    })

    console.log(`\n\n📌 Resumo:`)
    console.log(`   Total de protocolos: ${protocols.length}`)
    console.log(`   Coordenadas únicas: ${coordsMap.size}`)
    console.log(`   Grupos com duplicatas: ${duplicateCount}`)

    // Mostrar amostra de coordenadas únicas
    console.log(`\n\n✅ Amostra de coordenadas únicas (primeiros 5):`)
    let count = 0
    coordsMap.forEach((protocolList, coords) => {
      if (protocolList.length === 1 && count < 5) {
        const p = protocolList[0]
        console.log(`\n   📍 ${coords}`)
        console.log(`   - #${p.number} | ${p.department?.name || 'Sem dept'}`)
        console.log(`     "${p.title.substring(0, 60)}..."`)
        count++
      }
    })

  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCoordinates()
