import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamSchedulerService } from './exam-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ExamModule } from '../exam/exam.module';
import { SeatingModule } from '../seating/seating.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, ExamModule, SeatingModule],
  providers: [ExamSchedulerService],
})
export class SchedulerModule {}
