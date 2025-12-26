import axios from 'axios'

interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress?: string
  provider: 'nominatim' | 'geoapify' | 'manual'
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
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
 * Estratégia de fallback:
 * 1. Nominatim (OpenStreetMap) - Grátis ilimitado
 * 2. Geoapify - 3.000 requisições/dia grátis
 */
export class GeocodingService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
  private static readonly GEOAPIFY_URL = 'https://api.geoapify.com/v1/geocode/search'
  private static readonly GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || ''

  // Rate limiting para Nominatim (1 req/sec)
  private static lastNominatimRequest = 0
  private static readonly NOMINATIM_DELAY = 1000

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
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
          provider: 'nominatim'
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
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
          provider: 'nominatim'
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
