import { Module } from '@nestjs/common';
import { ESusConfigController } from './esus-config.controller';
import { ESusConfigService } from './esus-config.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ESusConfigController],
  providers: [ESusConfigService],
  exports: [ESusConfigService],
})
export class ESusConfigModule {}
