import 'dotenv/config';
// Prisma maps User.version to BigInt; JSON.stringify throws without this.
Object.defineProperty(BigInt.prototype, 'toJSON', {
  value(this: bigint) {
    return this.toString();
  },
  configurable: true,
});
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : process.env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('端若数智考盟 API')
    .setDescription(
      '多租户招聘考试报名管理系统 API 文档\n\n## 认证说明\n所有需要租户上下文的 API 必须在请求头中传递:\n- `Authorization: Bearer <token>` - JWT 令牌\n- `X-Tenant-ID: <tenant-id>` - 租户 ID\n\n## API 列表\n### 公开 API\n- POST /auth/login - 用户登录\n\n### 需要认证的 API\n- 大部分 API 需要在 Authorization header 中传递 JWT token\n- 租户相关操作需要额外传递 X-Tenant-ID header',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', '认证管理 - 登录、令牌刷新')
    .addTag('users', '用户管理')
    .addTag('tenants', '租户管理')
    .addTag('exams', '考试管理 - 考试 CRUD、状态管理')
    .addTag('positions', '岗位管理 - 岗位 CRUD')
    .addTag('subjects', '科目管理 - 科目 CRUD')
    .addTag('applications', '报名管理')
    .addTag('reviews', '审核管理')
    .addTag('payments', '支付管理')
    .addTag('tickets', '准考证管理')
    .addTag('seating', '座位管理 - 考场、座位分配')
    .addTag('scores', '成绩管理 - 成绩录入、统计、排名')
    .addTag('form-templates', '表单模板管理')
    .addTag('statistics', '统计分析')
    .addTag('files', '文件管理')
    .addTag('super-admin', '平台管理')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 8081;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
void bootstrap();
