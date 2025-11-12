/**
 * Module Handler Registry - Sistema de registro de handlers
 * Este arquivo permite que os handlers sejam registrados no sistema
 */

class ModuleHandlerRegistry {
  private handlers: Map<string, any> = new Map();

  register(key: string, handler: any) {
    this.handlers.set(key, handler);
    console.log(`📝 Handler registrado: ${key}`);
  }

  get(key: string) {
    return this.handlers.get(key);
  }

  has(key: string): boolean {
    return this.handlers.has(key);
  }

  getAll() {
    return Array.from(this.handlers.entries());
  }
}

export const moduleHandlerRegistry = new ModuleHandlerRegistry();
