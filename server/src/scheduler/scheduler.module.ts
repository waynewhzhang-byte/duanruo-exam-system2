import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamSchedulerService } from './exam-scheduler.service';
import { FileCleanupService } from './file-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [ExamSchedulerService, FileCleanupService],
})
export class SchedulerModule { }
