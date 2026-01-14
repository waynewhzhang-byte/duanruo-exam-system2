import { Module } from '@nestjs/common';
import { SeatingService } from './seating.service';
import { SeatingController } from './seating.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SeatingService],
  controllers: [SeatingController],
  exports: [SeatingService],
})
export class SeatingModule {}
