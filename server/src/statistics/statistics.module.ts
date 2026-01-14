import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [StatisticsController],
})
export class StatisticsModule { }
