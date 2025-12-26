import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProtocolsWithGeo() {
  try {
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      take: 5,
      select: {
        number: true,
        title: true,
        latitude: true,
        longitude: true,
        address: true
      }
    })

    console.log('Protocolos com geolocalização:', JSON.stringify(protocols, null, 2))
    console.log(`Total encontrados: ${protocols.length}`)
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProtocolsWithGeo()
