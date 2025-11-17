import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export class FileWriter {
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
  }

  async write(filePath: string, content: string): Promise<void> {
    if (this.dryRun) {
      console.log(chalk.blue(`[DRY-RUN] Seria criado: ${filePath}`));
      return;
    }

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(chalk.green(`✓ Criado: ${filePath}`));
  }

  async delete(filePath: string): Promise<void> {
    if (this.dryRun) {
      console.log(chalk.yellow(`[DRY-RUN] Seria deletado: ${filePath}`));
      return;
    }

    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(chalk.red(`✗ Deletado: ${filePath}`));
    }
  }

  async exists(filePath: string): Promise<boolean> {
    return await fs.pathExists(filePath);
  }
}
