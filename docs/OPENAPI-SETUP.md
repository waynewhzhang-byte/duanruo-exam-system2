# OpenAPI/Swagger 文档配置指南

本项目当前未安装 Swagger。如需启用 API 文档，请按以下步骤操作：

## 1. 安装依赖

```bash
cd server
npm install @nestjs/swagger @nestjs/common@latest
```

## 2. 在 main.ts 中配置 Swagger

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('端若数智考盟 API')
    .setDescription('考试报名管理系统 API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', '认证相关')
    .addTag('exams', '考试管理')
    .addTag('applications', '报名管理')
    .addTag('reviews', '审核管理')
    .addTag('tickets', '准考证管理')
    .addTag('seating', '座位安排')
    .addTag('files', '文件管理')
    .addTag('statistics', '统计分析')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(8081);
}
bootstrap();
```

## 3. 在 DTO 中添加 Swagger 装饰器

示例 - 用户 DTO:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@example.com', description: '邮箱' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', description: '全名' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '13800138000', description: '手机号' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
```

## 4. API 响应类型装饰器

使用 `ApiResponse` 装饰器定义端点的响应:

```typescript
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('exams')
@Controller('exams')
export class ExamController {
  @Get()
  @ApiResponse({ 
    status: 200, 
    description: '考试列表查询成功',
    type: [ExamResponse]
  })
  @ApiResponse({ 
    status: 401, 
    description: '未授权' 
  })
  async findAll() {
    // ...
  }
}
```

## 5. 访问 Swagger UI

启动服务后访问: http://localhost:8081/api/docs

## 当前 API 端点清单

### 认证 (Auth)
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册

### 考试 (Exams)
- `GET /api/v1/exams` - 考试列表
- `GET /api/v1/exams/:id` - 考试详情
- `POST /api/v1/exams` - 创建考试
- `PUT /api/v1/exams/:id` - 更新考试
- `DELETE /api/v1/exams/:id` - 删除考试

### 报名 (Applications)
- `GET /api/v1/applications` - 报名列表
- `GET /api/v1/applications/my` - 我的报名
- `POST /api/v1/applications` - 提交报名
- `GET /api/v1/applications/:id` - 报名详情

### 审核 (Reviews)
- `POST /api/v1/reviews/pull-task` - 拉取审核任务
- `POST /api/v1/reviews/decision` - 审核决策
- `POST /api/v1/reviews/batch` - 批量审核

### 准考证 (Tickets)
- `GET /api/v1/tickets/application/:applicationId` - 查询准考证
- `POST /api/v1/tickets/batch-generate/:examId` - 批量生成准考证

### 座位安排 (Seating)
- `POST /api/v1/seating/:examId/allocate` - 分配座位
- `GET /api/v1/seating/:examId/assignments` - 查看座位分配

### 文件 (Files)
- `POST /api/v1/files/upload-url` - 获取上传 URL
- `POST /api/v1/files/confirm` - 确认上传
- `DELETE /api/v1/files/:id` - 删除文件

### 统计分析 (Statistics)
- `GET /api/v1/statistics/exam/:examId` - 考试统计
- `GET /api/v1/statistics/application` - 报名统计
- `GET /api/v1/statistics/review` - 审核统计

## 注意事项

1. **多租户**: 大多数端点需要 `X-Tenant-ID` 请求头
2. **认证**: 需要 `Authorization: Bearer <token>` 请求头
3. **权限**: 使用 `@Permissions()` 装饰器控制访问
