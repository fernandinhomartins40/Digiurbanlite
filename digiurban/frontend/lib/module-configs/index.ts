/**
 * ============================================================================
 * MODULE CONFIGURATIONS INDEX
 * ============================================================================
 *
 * Centralizador de configurações de todos os módulos
 */

import { ModuleConfig } from './types';
import { agricultureModules } from './agriculture';
import { educacaoModuleConfigs } from './educacao';
import {
  atendimentosObrasPublicasConfig,
  reparosDeViasConfig,
  vistoriasTecnicasConfig,
  cadastroDeObrasConfig,
  inspecaoDeObrasConfig,
  consultaContratosConfig,
  consultaMapaObrasConfig,
} from './obras-publicas';
import { configsPlanejamentoUrbano } from './planejamento-urbano';
import { servicosPublicosConfigs } from './servicos-publicos';

// Módulos de Obras Públicas (5 COM_DADOS + 2 INFORMATIVOS = 7 TOTAL)
export const obrasPublicasModuleConfigs: Record<string, ModuleConfig> = {
  'atendimentos-obras-publicas': atendimentosObrasPublicasConfig,
  'reparos-de-vias': reparosDeViasConfig,
  'vistorias-tecnicas': vistoriasTecnicasConfig,
  'cadastro-de-obras': cadastroDeObrasConfig,
  'inspecao-de-obras': inspecaoDeObrasConfig,
  'consulta-contratos': consultaContratosConfig,
  'consulta-mapa-obras': consultaMapaObrasConfig,
};

// Módulos de Planejamento Urbano (7 COM_DADOS + 2 INFORMATIVOS = 9 TOTAL)
export const planejamentoUrbanoModuleConfigs = configsPlanejamentoUrbano;

// Módulos de Serviços Públicos (9 COM_DADOS)
export const servicosPublicosModuleConfigs = servicosPublicosConfigs;

// Registry de todas as configurações de módulos
const moduleRegistry: Record<string, Record<string, ModuleConfig>> = {
  agriculture: agricultureModules,
  education: educacaoModuleConfigs,
  obrasPublicas: obrasPublicasModuleConfigs,
  planejamentoUrbano: configsPlanejamentoUrbano,
  'servicos-publicos': servicosPublicosConfigs,
};

/**
 * Busca configuração de um módulo específico
 */
export function getModuleConfig(
  departmentType: string,
  moduleKey: string
): ModuleConfig | null {
  const departmentModules = moduleRegistry[departmentType];
  if (!departmentModules) return null;

  return departmentModules[moduleKey] || null;
}

/**
 * Lista todos os módulos de um departamento
 */
export function getDepartmentModules(departmentType: string): ModuleConfig[] {
  const departmentModules = moduleRegistry[departmentType];
  if (!departmentModules) return [];

  return Object.values(departmentModules);
}

/**
 * Verifica se um módulo existe
 */
export function hasModule(departmentType: string, moduleKey: string): boolean {
  return getModuleConfig(departmentType, moduleKey) !== null;
}

// Re-exportar tipos
export * from './types';
export { agricultureModules } from './agriculture';
export { educacaoModuleConfigs } from './educacao';
