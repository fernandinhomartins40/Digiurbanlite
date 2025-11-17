import { secretariaConfigSchema, SecretariaConfig } from '../schemas/secretaria.schema';
import chalk from 'chalk';

export class ConfigValidator {
  validate(config: any): { valid: boolean; errors: string[]; data?: SecretariaConfig } {
    try {
      const validated = secretariaConfigSchema.parse(config);
      return { valid: true, errors: [], data: validated };
    } catch (error: any) {
      const errors = error.errors.map((err: any) =>
        `${err.path.join('.')}: ${err.message}`
      );
      return { valid: false, errors };
    }
  }

  printErrors(errors: string[]): void {
    console.log(chalk.red('\n❌ Erros de validação:\n'));
    errors.forEach(error => {
      console.log(chalk.red(`  • ${error}`));
    });
    console.log();
  }

  printSuccess(secretariaName: string): void {
    console.log(chalk.green(`\n✅ Configuração de ${secretariaName} válida!\n`));
  }
}
