import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { AutoReviewService } from './auto-review.service';
import { ReviewController } from './review.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReviewService, AutoReviewService],
  controllers: [ReviewController],
  exports: [ReviewService, AutoReviewService],
})
export class ReviewModule {}
