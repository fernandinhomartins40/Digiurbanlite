import { z } from 'zod';

/**
 * Schema MINIMALISTA de módulo
 *
 * Apenas mapeia ID → moduleType
 * Sem campos fixos! O formSchema vem do ServiceSimplified em runtime.
 */
export const moduleConfigSchema = z.object({
  id: z.string().min(1).describe('ID do módulo (usado na rota)'),
  moduleType: z.string().nullable().describe('ModuleType do ServiceSimplified (null = serviços gerais)')
});

export type ModuleConfig = z.infer<typeof moduleConfigSchema>;
