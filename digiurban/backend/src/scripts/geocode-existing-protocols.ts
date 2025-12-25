import { PrismaClient } from '@prisma/client'
import { GeocodingService } from '../services/geocoding.service'

const prisma = new PrismaClient()

interface ProtocolToGeocode {
  id: string
  number: string
  address: string | null
  specificLocation: string | null
  citizen?: {
    address?: string | null
  }
}

/**
 * Script para geocodificar protocolos existentes
 *
 * Comportamento:
 * 1. Busca protocolos sem latitude/longitude
 * 2. Tenta usar specificLocation (se disponível)
 * 3. Fallback para address do protocolo
 * 4. Fallback para endereço do cidadão
 * 5. Atualiza protocolo com coordenadas
 */
async function geocodeExistingProtocols() {
  console.log('🚀 Iniciando geocodificação de protocolos existentes...\n')

  try {
    // Buscar todos os protocolos sem geolocalização
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        id: true,
        number: true,
        address: true,
        specificLocation: true,
        citizenId: true
      }
    })

    // Buscar dados dos cidadãos para obter endereços
    const protocolsWithCitizen = await Promise.all(
      protocols.map(async (protocol) => {
        const citizen = await prisma.citizen.findUnique({
          where: { id: protocol.citizenId },
          select: { address: true }
        })
        return {
          ...protocol,
          citizen
        }
      })
    )

    console.log(`📊 Encontrados ${protocolsWithCitizen.length} protocolos para geocodificar\n`)

    if (protocolsWithCitizen.length === 0) {
      console.log('✅ Nenhum protocolo necessita geocodificação!')
      return
    }

    let successCount = 0
    let failCount = 0
    const failedProtocols: string[] = []

    // Processar cada protocolo
    for (const protocol of protocolsWithCitizen) {
      console.log(`\n🔄 Processando protocolo ${protocol.number}...`)

      // Determinar qual endereço usar (ordem de prioridade)
      let addressToGeocode: string | null = null
      let locationType: string = 'CITIZEN_ADDRESS'

      if (protocol.specificLocation) {
        addressToGeocode = protocol.specificLocation
        locationType = 'SPECIFIC_LOCATION'
        console.log(`  📍 Usando localização específica: ${addressToGeocode}`)
      } else if (protocol.address) {
        addressToGeocode = protocol.address
        locationType = 'CITIZEN_ADDRESS'
        console.log(`  📍 Usando endereço do protocolo: ${addressToGeocode}`)
      } else if (protocol.citizen?.address) {
        // citizen.address é Json, então precisamos formatar corretamente
        let citizenAddress: string

        if (typeof protocol.citizen.address === 'string') {
          citizenAddress = protocol.citizen.address
        } else if (typeof protocol.citizen.address === 'object' && protocol.citizen.address !== null) {
          // Formatar objeto de endereço em string legível
          const addr = protocol.citizen.address as any
          const parts = [
            addr.logradouro,
            addr.numero,
            addr.complemento,
            addr.bairro,
            addr.cidade,
            addr.uf,
            addr.cep
          ].filter(Boolean)
          citizenAddress = parts.join(', ')
        } else {
          citizenAddress = JSON.stringify(protocol.citizen.address)
        }

        addressToGeocode = citizenAddress
        locationType = 'CITIZEN_ADDRESS'
        console.log(`  📍 Usando endereço do cidadão: ${addressToGeocode}`)
      }

      if (!addressToGeocode) {
        console.log(`  ⚠️ Nenhum endereço disponível para geocodificar`)
        failCount++
        failedProtocols.push(protocol.number)
        continue
      }

      // Geocodificar
      const result = await GeocodingService.geocodeAddress(addressToGeocode)

      if (result) {
        // Validar coordenadas
        if (!GeocodingService.isValidBrazilCoordinates(result.latitude, result.longitude)) {
          console.log(`  ❌ Coordenadas fora do Brasil: ${result.latitude}, ${result.longitude}`)
          failCount++
          failedProtocols.push(protocol.number)
          continue
        }

        // Atualizar protocolo
        await prisma.protocolSimplified.update({
          where: { id: protocol.id },
          data: {
            latitude: result.latitude,
            longitude: result.longitude,
            address: result.formattedAddress || addressToGeocode,
            locationType,
            geocodingProvider: result.provider
          }
        })

        console.log(`  ✅ Geocodificado: ${result.latitude}, ${result.longitude} (${result.provider})`)
        successCount++
      } else {
        console.log(`  ❌ Falha ao geocodificar`)
        failCount++
        failedProtocols.push(protocol.number)
      }

      // Pequeno delay entre requisições (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 1100))
    }

    // Resumo
    console.log('\n' + '='.repeat(60))
    console.log('📈 RESUMO DA GEOCODIFICAÇÃO')
    console.log('='.repeat(60))
    console.log(`✅ Sucessos: ${successCount}`)
    console.log(`❌ Falhas: ${failCount}`)
    console.log(`📊 Total processado: ${protocolsWithCitizen.length}`)
    console.log(`📈 Taxa de sucesso: ${((successCount / protocolsWithCitizen.length) * 100).toFixed(1)}%`)

    if (failedProtocols.length > 0) {
      console.log('\n⚠️ Protocolos que falharam:')
      failedProtocols.forEach(number => console.log(`  - ${number}`))
    }

    console.log('\n✅ Script finalizado!')
  } catch (error) {
    console.error('\n❌ Erro ao executar script:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar script
geocodeExistingProtocols()
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
