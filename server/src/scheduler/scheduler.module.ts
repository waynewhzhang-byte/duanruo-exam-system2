import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamSchedulerService } from './exam-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [ExamSchedulerService],
})
export class SchedulerModule { }
