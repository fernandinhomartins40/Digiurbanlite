import axios from 'axios'
import { prisma } from '../lib/prisma'
import { runAsPlatform } from '../lib/tenant-context'
import { getMapsSettings } from './maps/maps-settings.service'

interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress?: string
  provider: 'nominatim' | 'geoapify' | 'google' | 'manual' | 'confirmado'
  placeId?: string
  precision?: 'house' | 'street' | 'neighborhood' | 'city' | 'unknown'
  confidence?: number // 0-10 scale
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
  address?: {
    house_number?: string
    road?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
  }
  type?: string // Result type: house, street, neighbourhood, city, etc
  place_rank?: number // Lower = more precise (1-30 scale)
}

interface GeoapifyResponse {
  results: Array<{
    lat: number
    lon: number
    formatted: string
  }>
}

/**
 * Serviço de Geocodificação
 * Converte endereços em coordenadas geográficas (latitude/longitude)
 *
 * Ordem (economiza o serviço pago):
 * 0. Arquivo de endereços já procurados (GeoCache) — não consulta ninguém
 * 1. Nominatim (OpenStreetMap) - grátis; guardado sem prazo
 * 2. Geoapify - grátis até 3.000/dia (se houver chave)
 * 3. Google Geocoding - só se configurado no painel (chave do servidor) e os
 *    grátis não acharem; guardado pelo prazo do painel (padrão 30 dias, regra
 *    do Google; o operador pode escolher mais ou "para sempre")
 * "Não achou" fica guardado 7 dias.
 */
export class GeocodingService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
  private static readonly GEOAPIFY_URL = 'https://api.geoapify.com/v1/geocode/search'
  private static readonly GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || ''

  // Rate limiting para Nominatim (1 req/sec)
  private static lastNominatimRequest = 0
  private static readonly NOMINATIM_DELAY = 1000

  /**
   * Determina a precisão do resultado de geocodificação
   */
  private static determinePrecision(result: NominatimResponse): {
    precision: 'house' | 'street' | 'neighborhood' | 'city' | 'unknown'
    confidence: number
  } {
    // Verificar se tem número de casa no resultado
    const hasHouseNumber = result.address?.house_number !== undefined
    const type = result.type?.toLowerCase() || ''
    const placeRank = result.place_rank || 30

    // Precisão baseada no tipo de resultado
    if (type === 'house' || hasHouseNumber) {
      return { precision: 'house', confidence: 10 }
    }

    if (type === 'street' || type === 'road' || type === 'residential') {
      return { precision: 'street', confidence: 7 }
    }

    if (type.includes('neighbourhood') || type.includes('suburb') || type === 'quarter') {
      return { precision: 'neighborhood', confidence: 5 }
    }

    if (type.includes('city') || type.includes('town') || type.includes('village')) {
      return { precision: 'city', confidence: 3 }
    }

    // Fallback: usar place_rank (1-15 = house, 16-20 = street, 21-25 = neighbourhood, 26+ = city)
    if (placeRank <= 15) return { precision: 'house', confidence: 9 }
    if (placeRank <= 20) return { precision: 'street', confidence: 7 }
    if (placeRank <= 25) return { precision: 'neighborhood', confidence: 5 }
    if (placeRank <= 28) return { precision: 'city', confidence: 3 }

    return { precision: 'unknown', confidence: 2 }
  }

  /**
   * Tenta parsear endereço estruturado (JSON)
   */
  private static parseStructuredAddress(address: string): any | null {
    try {
      // Tentar detectar se é JSON
      if (address.trim().startsWith('{')) {
        const parsed = JSON.parse(address)
        if (parsed.logradouro || parsed.cidade) {
          return parsed
        }
      }
    } catch {
      // Não é JSON, retornar null
    }
    return null
  }

  /**
   * Geocodifica usando busca estruturada (mais preciso para cidades pequenas)
   */
  private static async geocodeStructured(addressObj: any): Promise<GeocodingResult | null> {
    try {
      // Rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastNominatimRequest
      if (timeSinceLastRequest < this.NOMINATIM_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.NOMINATIM_DELAY - timeSinceLastRequest))
      }
      this.lastNominatimRequest = Date.now()

      // Montar query estruturada
      const params: any = {
        format: 'json',
        limit: 1,
        addressdetails: 1,
        countrycodes: 'br'
      }

      // Adicionar campos estruturados
      if (addressObj.logradouro && addressObj.numero) {
        params.street = `${addressObj.logradouro} ${addressObj.numero}`
      } else if (addressObj.logradouro) {
        params.street = addressObj.logradouro
      }

      if (addressObj.cidade) params.city = addressObj.cidade
      if (addressObj.uf) params.state = addressObj.uf
      if (addressObj.cep) params.postalcode = addressObj.cep
      params.country = 'Brasil'

      console.log(`  🔍 Busca estruturada: ${JSON.stringify(params)}`)

      const response = await axios.get<NominatimResponse[]>(this.NOMINATIM_URL, {
        params,
        headers: {
          'User-Agent': 'DigiUrban/1.0 (contato@digiurban.com.br)'
        },
        timeout: 10000
      })

      if (response.data && response.data.length > 0) {
        const result = response.data[0]
        const { precision, confidence } = this.determinePrecision(result)

        console.log(`  ✅ Geocodificado com precisão: ${precision} (confiança: ${confidence}/10)`)

        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
          provider: 'nominatim',
          precision,
          confidence
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao geocodificar estruturado:', error)
      return null
    }
  }

  /**
   * Geocodifica um endereço usando Nominatim (OpenStreetMap)
   */
  private static async geocodeWithNominatim(address: string): Promise<GeocodingResult | null> {
    try {
      // Tentar busca estruturada primeiro se for JSON
      const structuredAddress = this.parseStructuredAddress(address)
      if (structuredAddress) {
        console.log('  📋 Detectado endereço estruturado, usando busca avançada')
        const structuredResult = await this.geocodeStructured(structuredAddress)
        if (structuredResult) {
          return structuredResult
        }
        console.log('  ⚠️ Busca estruturada falhou, tentando busca por texto')
      }

      // Busca por texto livre (fallback)
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastNominatimRequest
      if (timeSinceLastRequest < this.NOMINATIM_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.NOMINATIM_DELAY - timeSinceLastRequest))
      }
      this.lastNominatimRequest = Date.now()

      const response = await axios.get<NominatimResponse[]>(this.NOMINATIM_URL, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'br' // Priorizar resultados do Brasil
        },
        headers: {
          'User-Agent': 'DigiUrban/1.0 (contato@digiurban.com.br)' // Nominatim requer User-Agent
        },
        timeout: 10000
      })

      if (response.data && response.data.length > 0) {
        const result = response.data[0]
        const { precision, confidence } = this.determinePrecision(result)

        console.log(`  ✅ Geocodificado com precisão: ${precision} (confiança: ${confidence}/10)`)

        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
          provider: 'nominatim',
          precision,
          confidence
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao geocodificar com Nominatim:', error)
      return null
    }
  }

  /**
   * Geocodifica um endereço usando Geoapify (fallback)
   */
  private static async geocodeWithGeoapify(address: string): Promise<GeocodingResult | null> {
    if (!this.GEOAPIFY_API_KEY) {
      console.warn('GEOAPIFY_API_KEY não configurada, pulando fallback')
      return null
    }

    try {
      const response = await axios.get<GeoapifyResponse>(this.GEOAPIFY_URL, {
        params: {
          text: address,
          apiKey: this.GEOAPIFY_API_KEY,
          limit: 1,
          filter: 'countrycode:br' // Filtrar apenas Brasil
        },
        timeout: 10000
      })

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0]
        return {
          latitude: result.lat,
          longitude: result.lon,
          formattedAddress: result.formatted,
          provider: 'geoapify'
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao geocodificar com Geoapify:', error)
      return null
    }
  }

  /**
   * Geocodifica um endereço completo
   * Tenta Nominatim primeiro, depois Geoapify como fallback
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim().length === 0) {
      return null
    }
    const query = address.trim().slice(0, 500)
    const key = `geo:${normalizeQuery(query)}`

    const cached = await readCache(key)
    if (cached !== undefined) return cached

    let result = await this.geocodeWithFreeProviders(query)
    if (!result) result = await this.geocodeWithGoogle(query)
    await writeCache(key, query, 'GEOCODE', result)
    return result
  }

  /** Google Geocoding (chave do servidor, do painel). Só quando os grátis não acham. */
  private static async geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
    try {
      const settings = await getMapsSettings()
      if (!settings.enabled || !settings.serverKey) return null
      const response = await axios.get<any>('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address: plainAddress(address), key: settings.serverKey, region: 'br', language: 'pt-BR' },
        timeout: 10000,
      })
      const first = response.data?.results?.[0]
      if (response.data?.status !== 'OK' || !first) return null
      const locationType = first.geometry?.location_type
      return {
        latitude: first.geometry.location.lat,
        longitude: first.geometry.location.lng,
        formattedAddress: first.formatted_address,
        provider: 'google',
        placeId: first.place_id,
        precision: locationType === 'ROOFTOP' ? 'house' : locationType === 'APPROXIMATE' ? 'city' : 'street',
      }
    } catch (error) {
      console.warn('Google Geocoding indisponível:', error instanceof Error ? error.message : error)
      return null
    }
  }

  /** Nominatim e Geoapify (grátis) */
  private static async geocodeWithFreeProviders(address: string): Promise<GeocodingResult | null> {
    // Limpar e normalizar endereço
    const cleanAddress = address.trim()

    console.log(`🌍 Geocodificando: "${cleanAddress}"`)

    // Tentar Nominatim primeiro
    const nominatimResult = await this.geocodeWithNominatim(cleanAddress)
    if (nominatimResult) {
      console.log(`✅ Geocodificado com Nominatim: ${nominatimResult.latitude}, ${nominatimResult.longitude}`)
      return nominatimResult
    }

    console.log('⚠️ Nominatim não retornou resultado, tentando Geoapify...')

    // Fallback para Geoapify
    const geoapifyResult = await this.geocodeWithGeoapify(cleanAddress)
    if (geoapifyResult) {
      console.log(`✅ Geocodificado com Geoapify: ${geoapifyResult.latitude}, ${geoapifyResult.longitude}`)
      return geoapifyResult
    }

    console.log('❌ Nenhum provedor conseguiu geocodificar o endereço')
    return null
  }

  /**
   * Geocodifica múltiplos endereços em lote
   * Adiciona delay entre requisições para respeitar rate limits
   */
  static async geocodeBatch(addresses: string[]): Promise<Map<string, GeocodingResult | null>> {
    const results = new Map<string, GeocodingResult | null>()

    for (const address of addresses) {
      const result = await this.geocodeAddress(address)
      results.set(address, result)

      // Pequeno delay entre requisições em lote
      await new Promise(resolve => setTimeout(resolve, 1100))
    }

    return results
  }

  /**
   * Valida se coordenadas estão dentro do Brasil (aproximado)
   */
  static isValidBrazilCoordinates(latitude: number, longitude: number): boolean {
    // Brasil: lat aproximadamente -33.75 a 5.27, lon aproximadamente -73.99 a -34.79
    return (
      latitude >= -34 && latitude <= 6 &&
      longitude >= -74 && longitude <= -34
    )
  }

  /**
   * Geocodificação reversa: coordenadas -> endereço
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    // o mesmo ponto (≈ 1 m) não consulta de novo
    const key = `rev:${latitude.toFixed(5)},${longitude.toFixed(5)}`
    const cached = await readCache(key)
    if (cached !== undefined) return cached?.formattedAddress || null
    const address = await this.reverseGeocodeUncached(latitude, longitude)
    await writeCache(key, `${latitude},${longitude}`, 'REVERSE', address ? { latitude, longitude, formattedAddress: address, provider: 'nominatim' } : null)
    return address
  }

  private static async reverseGeocodeUncached(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastNominatimRequest
      if (timeSinceLastRequest < this.NOMINATIM_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.NOMINATIM_DELAY - timeSinceLastRequest))
      }
      this.lastNominatimRequest = Date.now()

      const response = await axios.get<NominatimResponse>(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'DigiUrban/1.0 (contato@digiurban.com.br)'
          },
          timeout: 10000
        }
      )

      if (response.data && response.data.display_name) {
        return response.data.display_name
      }

      return null
    } catch (error) {
      console.error('Erro ao fazer geocodificação reversa:', error)
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// Arquivo de endereços já procurados (GeoCache)
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000

/** Endereço guardado como JSON ({logradouro, numero, ...}) vira texto */
function plainAddress(text: string): string {
  if (!text.trim().startsWith('{')) return text
  try {
    const value = JSON.parse(text)
    return [value.logradouro || value.street, value.numero || value.number, value.bairro || value.neighborhood, value.cidade || value.city, value.uf || value.state, value.cep || value.zipcode, 'Brasil']
      .filter(Boolean)
      .join(', ')
  } catch {
    return text
  }
}

/** Mesma busca, mesma chave: minúsculas, sem acento, sem pontuação repetida */
export function normalizeQuery(text: string): string {
  return plainAddress(String(text || ''))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ brasil$/, '')
    .slice(0, 400)
}

/**
 * Ponto confirmado por uma pessoa (GPS do celular ou alfinete no mapa) para um
 * endereço: dado próprio, guardado sem prazo e com prioridade sobre qualquer
 * busca — a próxima consulta do mesmo endereço já sai daqui.
 */
export async function rememberConfirmedLocation(address: string, latitude: number, longitude: number) {
  const text = String(address || '').trim()
  if (!text || !GeocodingService.isValidBrazilCoordinates(latitude, longitude)) return
  const queryKey = `geo:${normalizeQuery(text)}`
  const data = {
    query: plainAddress(text).slice(0, 500),
    kind: 'GEOCODE',
    provider: 'confirmado',
    latitude,
    longitude,
    formattedAddress: plainAddress(text).slice(0, 500),
    precision: 'house',
    placeId: null,
    expiresAt: null,
  }
  await runAsPlatform(async () => prisma.geoCache.upsert({ where: { queryKey }, create: { queryKey, ...data }, update: data })).catch(() => undefined)
}

/**
 * Validade: grátis = sem prazo; Google = prazo do painel (padrão 30 dias, a regra
 * do Google; 0 = para sempre); "não achou" = 7 dias
 */
export function cacheExpiry(provider: string | null, now = new Date(), googleDays = 30): Date | null {
  if (!provider) return new Date(now.getTime() + 7 * DAY)
  if (provider === 'google') return googleDays > 0 ? new Date(now.getTime() + googleDays * DAY) : null
  return null
}

/** undefined = não está no arquivo (ou venceu); null = já procurado e não achou */
async function readCache(queryKey: string): Promise<GeocodingResult | null | undefined> {
  try {
    const row = await runAsPlatform(async () => prisma.geoCache.findUnique({ where: { queryKey } }))
    if (!row || (row.expiresAt && row.expiresAt < new Date())) return undefined
    await runAsPlatform(async () => prisma.geoCache.update({ where: { id: row.id }, data: { hits: { increment: 1 } } })).catch(() => undefined)
    if (row.latitude === null || row.longitude === null) return null
    return {
      latitude: row.latitude,
      longitude: row.longitude,
      formattedAddress: row.formattedAddress || undefined,
      provider: row.provider as GeocodingResult['provider'],
      precision: (row.precision as GeocodingResult['precision']) || undefined,
      placeId: row.placeId || undefined,
    }
  } catch {
    return undefined
  }
}

async function writeCache(queryKey: string, query: string, kind: 'GEOCODE' | 'REVERSE', result: GeocodingResult | null) {
  const googleDays = result?.provider === 'google' ? (await getMapsSettings().catch(() => null))?.googleRetentionDays ?? 30 : 30
  const data = {
    query: query.slice(0, 500),
    kind,
    provider: result?.provider || 'none',
    latitude: result?.latitude ?? null,
    longitude: result?.longitude ?? null,
    formattedAddress: result?.formattedAddress?.slice(0, 500) || null,
    precision: result?.precision || null,
    placeId: result?.placeId || null,
    expiresAt: cacheExpiry(result?.provider || null, new Date(), googleDays),
  }
  await runAsPlatform(async () =>
    prisma.geoCache.upsert({ where: { queryKey }, create: { queryKey, ...data }, update: data })
  ).catch(() => undefined)
}

/** Números do arquivo (painel do Super-admin) */
export async function geoCacheStats() {
  return runAsPlatform(async () => {
    const [byProvider, hits, total] = await Promise.all([
      prisma.geoCache.groupBy({ by: ['provider'], _count: { _all: true } }),
      prisma.geoCache.aggregate({ _sum: { hits: true } }),
      prisma.geoCache.count(),
    ])
    return {
      total,
      reaproveitadas: hits._sum.hits || 0,
      porFonte: Object.fromEntries(byProvider.map((item) => [item.provider, item._count._all])),
    }
  })
}
