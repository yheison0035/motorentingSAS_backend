import { Module } from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { MotivationController } from './motivation.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [MotivationController],
  providers: [MotivationService, PrismaService],
})
export class MotivationModule {}
