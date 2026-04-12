import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { AnalyticsController } from './analytics.controller';
import { StatisticsService } from './statistics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StatisticsController, AnalyticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
