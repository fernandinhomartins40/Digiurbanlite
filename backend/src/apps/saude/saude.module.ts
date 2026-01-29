import { Module } from '@nestjs/common';
import { CadastrosSaudeModule } from './cadastros/cadastros.module.js';

@Module({
  imports: [CadastrosSaudeModule],
  exports: [CadastrosSaudeModule],
})
export class SaudeModule {}
