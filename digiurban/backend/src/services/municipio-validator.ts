/**
 * Serviço de Validação de Municípios Brasileiros
 * Garante consistência usando dados oficiais do IBGE
 */

import * as fs from 'fs';
import * as path from 'path';

// Estrutura de dados do município no arquivo JSON
export interface MunicipioBrasil {
  codigo_ibge: string;
  nome: string;
  uf: string;
  regiao: string;
  populacao: number;
  capital: boolean;
  latitude: number;
  longitude: number;
  ddd: number;
  cnpj: string | null;
}

// Cache em memória da lista completa de municípios
let municipiosBrasilCache: MunicipioBrasil[] | null = null;

/**
 * DIA 3: DISABLED - Função desabilitada em modo single-tenant
 * Este JSON era usado para validar municípios no sistema multi-tenant
 * Em single-tenant, não precisamos mais validar contra lista do IBGE
 */
function carregarMunicipiosBrasil(): MunicipioBrasil[] {
  if (municipiosBrasilCache) {
    return municipiosBrasilCache;
  }

  // Retornar array vazio - serviço desabilitado
  console.log('⚠️  Validador de municípios DESABILITADO - Single-tenant mode');
  municipiosBrasilCache = [];
  return municipiosBrasilCache;
}

/**
 * Validar se município existe no IBGE usando código IBGE
 */
export function validarMunicipioPorCodigoIbge(codigoIbge: string): MunicipioBrasil | null {
  const municipios = carregarMunicipiosBrasil();
  const municipio = municipios.find(m => m.codigo_ibge === codigoIbge);

  if (!municipio) {
    console.warn(`⚠️ Município com código IBGE ${codigoIbge} não encontrado`);
    return null;
  }

  return municipio;
}

/**
 * Validar se município existe no IBGE usando nome + UF
 */
export function validarMunicipioPorNomeEUF(nome: string, uf: string): MunicipioBrasil | null {
  const municipios = carregarMunicipiosBrasil();

  // Normalizar para comparação (sem acentos, minúsculas)
  const nomeNormalizado = normalizarTexto(nome);
  const ufNormalizada = uf.toUpperCase().trim();

  const municipio = municipios.find(m => {
    const nomeArquivo = normalizarTexto(m.nome);
    return nomeArquivo === nomeNormalizado && m.uf === ufNormalizada;
  });

  if (!municipio) {
    console.warn(`⚠️ Município "${nome} - ${uf}" não encontrado`);
    return null;
  }

  return municipio;
}

/**
 * Buscar município com validação inteligente (por código IBGE ou nome+UF)
 */
export function buscarMunicipioValidado(params: {
  codigoIbge?: string;
  nome?: string;
  uf?: string;
}): MunicipioBrasil | null {
  // Prioridade 1: Código IBGE (mais confiável)
  if (params.codigoIbge) {
    return validarMunicipioPorCodigoIbge(params.codigoIbge);
  }

  // Prioridade 2: Nome + UF
  if (params.nome && params.uf) {
    return validarMunicipioPorNomeEUF(params.nome, params.uf);
  }

  console.warn('⚠️ Parâmetros insuficientes para buscar município');
  return null;
}

/**
 * Gerar CNPJ fictício baseado no código IBGE
 * Formato: {codigoIBGE}{timestamp}{checkdigits}
 */
export function gerarCnpjFicticio(codigoIbge: string): string {
  // Usar código IBGE (7 dígitos) + timestamp parcial (6 dígitos) + padding = 14 dígitos
  const base = `${codigoIbge}${Date.now().toString().slice(-7)}`;
  return base.padEnd(14, '0').substring(0, 14);
}

/**
 * Gerar slug (domain) para o município
 * Exemplo: "sao-paulo-sp"
 */
export function gerarSlugMunicipio(nome: string, uf: string): string {
  const nomeSlug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-') // Espaços viram hífens
    .replace(/-+/g, '-') // Múltiplos hífens viram um só
    .trim();

  const ufSlug = uf.toLowerCase();

  return `${nomeSlug}-${ufSlug}`;
}

/**
 * Normalizar texto (sem acentos, minúsculas, sem espaços extras)
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Obter informações completas do município para metadados
 */
export function obterMetadadosMunicipio(municipio: MunicipioBrasil) {
  return {
    codigoIbge: municipio.codigo_ibge,
    nome: municipio.nome,
    uf: municipio.uf,
    regiao: municipio.regiao,
    populacao: municipio.populacao,
    capital: municipio.capital,
    ddd: municipio.ddd,
    coordenadas: {
      latitude: municipio.latitude,
      longitude: municipio.longitude
        },
    cnpjOficial: municipio.cnpj
        };
}
