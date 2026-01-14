import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MockGatewayService } from './mock-gateway.service';
import { MockGatewayController } from './mock-gateway.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [PaymentService, MockGatewayService],
  controllers: [PaymentController, MockGatewayController],
  exports: [PaymentService],
})
export class PaymentModule {}
