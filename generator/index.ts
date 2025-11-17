#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs-extra';
import { TemplateEngine } from './utils/template-engine.js';
import { ConfigValidator } from './utils/validator.js';
import { FileWriter } from './utils/file-writer.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('secretaria-generator')
  .description('Gerador automático de código para secretarias')
  .version('1.0.0');

program
  .command('generate')
  .description('Gerar código para uma ou todas as secretarias')
  .option('-s, --secretaria <name>', 'Nome da secretaria (ex: saude)')
  .option('-a, --all', 'Gerar todas as secretarias')
  .option('-d, --dry-run', 'Preview sem gerar arquivos')
  .option('-f, --force', 'Sobrescrever arquivos existentes')
  .action(async (options) => {
    const spinner = ora();

    try {
      // Configurações
      const projectRoot = path.resolve(__dirname, '..');
      const templatesDir = path.join(__dirname, 'templates');
      const configsDir = path.join(__dirname, 'configs', 'secretarias');
      const backendOutputDir = path.join(projectRoot, 'digiurban', 'backend', 'src', 'routes');

      const templateEngine = new TemplateEngine(templatesDir);
      const validator = new ConfigValidator();
      const fileWriter = new FileWriter(options.dryRun);

      let secretariasToGenerate: string[] = [];

      if (options.all) {
        // Listar todos os arquivos de config
        const configFiles = await fs.readdir(configsDir);
        secretariasToGenerate = configFiles
          .filter(f => f.endsWith('.config.ts'))
          .map(f => f.replace('.config.ts', ''));
      } else if (options.secretaria) {
        secretariasToGenerate = [options.secretaria];
      } else {
        console.log(chalk.red('\n❌ Especifique --secretaria ou --all\n'));
        process.exit(1);
      }

      console.log(chalk.blue('\n🚀 Iniciando geração...\n'));
      console.log(chalk.gray(`Secretarias: ${secretariasToGenerate.join(', ')}`));
      console.log(chalk.gray(`Modo: ${options.dryRun ? 'DRY-RUN' : 'PRODUÇÃO'}\n`));

      for (const secretariaName of secretariasToGenerate) {
        spinner.start(`Gerando ${secretariaName}...`);

        try {
          // Carregar config
          const configPath = path.join(configsDir, `${secretariaName}.config.ts`);

          if (!await fs.pathExists(configPath)) {
            spinner.fail(`Config não encontrada: ${secretariaName}`);
            continue;
          }

          const configFileURL = pathToFileURL(configPath).href;
          const configModule = await import(configFileURL);
          // Converter kebab-case para camelCase
          const configExportName = secretariaName.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'Config';
          const config = configModule[configExportName];

          if (!config) {
            spinner.fail(`Config inválida: ${secretariaName}`);
            continue;
          }

          // Validar config
          const validation = validator.validate(config);

          if (!validation.valid) {
            spinner.fail(`Validação falhou: ${secretariaName}`);
            validator.printErrors(validation.errors);
            continue;
          }

          // Dados para o template
          const templateData = {
            ...validation.data,
            timestamp: new Date().toISOString()
          };

          // Gerar backend
          const backendOutput = path.join(backendOutputDir, `secretarias-${secretariaName}.ts`);

          // Verificar se arquivo existe
          if (await fileWriter.exists(backendOutput) && !options.force && !options.dryRun) {
            spinner.warn(`${secretariaName}: Arquivo já existe (use --force para sobrescrever)`);
            continue;
          }

          const backendCode = await templateEngine.render('backend', templateData);
          await fileWriter.write(backendOutput, backendCode);

          spinner.succeed(`${secretariaName}: Backend gerado com sucesso`);

        } catch (error: any) {
          spinner.fail(`${secretariaName}: ${error.message}`);
          console.error(error);
        }
      }

      console.log(chalk.green('\n✅ Geração concluída!\n'));

      if (options.dryRun) {
        console.log(chalk.yellow('⚠️  Modo DRY-RUN: Nenhum arquivo foi criado\n'));
      } else {
        console.log(chalk.blue('📝 Próximos passos:'));
        console.log(chalk.gray('  1. Verifique os arquivos gerados'));
        console.log(chalk.gray('  2. Execute: cd digiurban/backend && npx tsc --noEmit'));
        console.log(chalk.gray('  3. Teste as rotas'));
        console.log(chalk.gray('  4. Commit e push\n'));
      }

    } catch (error: any) {
      spinner.fail(`Erro fatal: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validar configuração de uma secretaria')
  .option('-s, --secretaria <name>', 'Nome da secretaria')
  .action(async (options) => {
    if (!options.secretaria) {
      console.log(chalk.red('\n❌ Especifique --secretaria\n'));
      process.exit(1);
    }

    const spinner = ora(`Validando ${options.secretaria}...`).start();

    try {
      const configPath = path.join(__dirname, 'configs', 'secretarias', `${options.secretaria}.config.ts`);

      if (!await fs.pathExists(configPath)) {
        spinner.fail('Config não encontrada');
        process.exit(1);
      }

      const configFileURL = pathToFileURL(configPath).href;
      const configModule = await import(configFileURL);
      const config = configModule[`${options.secretaria}Config`];

      const validator = new ConfigValidator();
      const validation = validator.validate(config);

      if (validation.valid) {
        spinner.succeed('Configuração válida!');
        console.log(chalk.green(`\n✅ ${options.secretaria} está pronta para ser gerada\n`));
        console.log(chalk.gray(`Módulos: ${validation.data!.modules.length}`));
        console.log(chalk.gray(`IDs: ${validation.data!.modules.map(m => m.id).join(', ')}\n`));
      } else {
        spinner.fail('Validação falhou');
        validator.printErrors(validation.errors);
        process.exit(1);
      }

    } catch (error: any) {
      spinner.fail(`Erro: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Remover arquivos gerados (legado)')
  .option('-s, --secretaria <name>', 'Nome da secretaria')
  .option('-a, --all', 'Remover todas')
  .option('--confirm', 'Confirmar remoção')
  .action(async (options) => {
    if (!options.confirm) {
      console.log(chalk.red('\n❌ Use --confirm para confirmar a remoção\n'));
      process.exit(1);
    }

    const spinner = ora();
    const projectRoot = path.resolve(__dirname, '..');
    const backendDir = path.join(projectRoot, 'digiurban', 'backend', 'src', 'routes');
    const fileWriter = new FileWriter(false);

    let filesToDelete: string[] = [];

    if (options.all) {
      const files = await fs.readdir(backendDir);
      filesToDelete = files
        .filter(f => f.startsWith('secretarias-') && f.endsWith('.ts'))
        .map(f => path.join(backendDir, f));
    } else if (options.secretaria) {
      filesToDelete = [path.join(backendDir, `secretarias-${options.secretaria}.ts`)];
    } else {
      console.log(chalk.red('\n❌ Especifique --secretaria ou --all\n'));
      process.exit(1);
    }

    console.log(chalk.yellow(`\n⚠️  Arquivos a serem removidos: ${filesToDelete.length}\n`));

    for (const file of filesToDelete) {
      spinner.start(`Removendo ${path.basename(file)}...`);
      await fileWriter.delete(file);
      spinner.succeed(`Removido: ${path.basename(file)}`);
    }

    console.log(chalk.green('\n✅ Limpeza concluída!\n'));
  });

program.parse();
