import { Module } from '@nestjs/common';
import { StatesController } from './states.controller';
import { PrismaService } from 'src/prisma.service';
import { StatesService } from './states.services';

@Module({
  controllers: [StatesController],
  providers: [StatesService, PrismaService],
  exports: [StatesService],
})
export class StatesModule {}
