import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-yet';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ReviewModule } from './review/review.module';
import { StatisticsModule } from './statistics/statistics.module';
import { PaymentModule } from './payment/payment.module';
import { TicketModule } from './ticket/ticket.module';
import { SeatingModule } from './seating/seating.module';
import { CommonModule } from './common/common.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ExamModule } from './exam/exam.module';
import { ApplicationModule } from './application/application.module';
import { FileModule } from './file/file.module';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { NotificationModule } from './common/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.get('REDIS_URL') || 'redis://localhost:6379',
          ttl: 3600,
        }),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    FileModule,
    TenantModule,
    AuthModule,
    UserModule,
    ExamModule,
    ApplicationModule,
    ReviewModule,
    StatisticsModule,
    PaymentModule,
    TicketModule,
    SeatingModule,
    CommonModule,
    SchedulerModule,
    SuperAdminModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*')
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
