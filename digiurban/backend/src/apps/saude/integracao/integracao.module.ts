import { Module } from '@nestjs/common';
import { LEDIConverterService } from './ledi-converter.service';
import { ESusApiService } from './esus-api.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LEDIConverterService, ESusApiService],
  exports: [LEDIConverterService, ESusApiService],
})
export class IntegracaoModule {}
