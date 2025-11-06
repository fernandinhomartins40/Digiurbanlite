/**
 * Base Handler - Classe base para todos os handlers especializados
 */

import { ModuleAction } from '../../types/module-handler';

export abstract class BaseModuleHandler {
  abstract moduleType: string;
  abstract entityName: string;

  /**
   * Executa a ação do módulo
   */
  abstract execute(action: ModuleAction, tx: any): Promise<any>;

  /**
   * Verifica se este handler pode processar a ação
   */
  canHandle(action: ModuleAction): boolean {
    return action.type === this.moduleType && action.entity === this.entityName;
  }
}
