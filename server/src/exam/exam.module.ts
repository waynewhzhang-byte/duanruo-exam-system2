import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { PositionController } from './position.controller';
import { FormTemplateController } from './form-template.controller';
import { ScoreController } from './score.controller';
import { ScoreService } from './score.service';
import { PublishedExamController } from './published-exam.controller';
import { PublicExamController } from './public-exam.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PositionService } from './position.service';
import { NotificationModule } from '../common/notification/notification.module';
import { TicketModule } from '../ticket/ticket.module';
import { ApplicationModule } from '../application/application.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    TicketModule,
    ApplicationModule,
    UserModule,
  ],
  providers: [ExamService, PositionService, ScoreService],
  controllers: [
    ExamController,
    PositionController,
    PublicExamController,
    PublishedExamController,
    FormTemplateController,
    ScoreController,
  ],
  exports: [ExamService, PositionService, ScoreService],
})
export class ExamModule {}
