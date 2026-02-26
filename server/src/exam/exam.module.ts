import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { FormTemplateController } from './form-template.controller';
import { ScoreController } from './score.controller';
import { ScoreService } from './score.service';
import { PublishedExamController } from './published-exam.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PositionService } from './position.service';
import { NotificationModule } from '../common/notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [ExamService, PositionService, ScoreService],
  controllers: [ExamController, PublishedExamController, FormTemplateController, ScoreController],
  exports: [ExamService, PositionService, ScoreService],
})
export class ExamModule { }
