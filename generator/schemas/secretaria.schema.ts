import { z } from 'zod';
import { moduleConfigSchema } from './module.schema';

/**
 * Schema MINIMALISTA de configuração de secretaria
 *
 * Apenas metadados básicos + lista de módulos (id + moduleType)
 */
export const secretariaConfigSchema = z.object({
  id: z.string().min(1).describe('ID da secretaria (slug)'),
  name: z.string().min(1).describe('Nome completo da secretaria'),
  slug: z.string().min(1).describe('Slug para URLs'),
  departmentId: z.string().min(1).describe('ID do Department no banco'),

  modules: z.array(moduleConfigSchema).min(1).describe('Lista de módulos da secretaria')
});

export type SecretariaConfig = z.infer<typeof secretariaConfigSchema>;
