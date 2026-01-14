import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { PublishedExamController } from './published-exam.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PositionService } from './position.service';

@Module({
  imports: [PrismaModule],
  providers: [ExamService, PositionService],
  controllers: [ExamController, PublishedExamController],
  exports: [ExamService, PositionService],
})
export class ExamModule { }
