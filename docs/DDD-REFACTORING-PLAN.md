# DDD 重构实施计划

> 端若数智考盟 - NestJS 后端 DDD 架构重构

---

## 一、重构目标

### 1.1 当前架构问题

```
现状 (传统三层架构):
┌─────────────────────────────────────────────┐
│                 Controller                    │
│  (处理HTTP请求、参数验证、路由)              │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│                  Service                     │
│  (业务逻辑 + 数据库访问 混合)                │
│  this.prisma.application.findUnique(...)    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│                Prisma Client                 │
│  (直接操作数据库)                            │
└─────────────────────────────────────────────┘
```

### 1.2 目标架构 (DDD)

```
目标 (DDD 架构):
┌─────────────────────────────────────────────┐
│                 Controller                    │
│  (处理HTTP请求、参数验证)                    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              Application Service              │
│  (用例 orchestration, 事务管理)              │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              Domain Service                  │
│  (领域逻辑、领域事件)                        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           Repository Interface              │
│  (仓库接口 - 抽象)                          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Repository Implementation            │
│  (Prisma 实现 - 基础设施)                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│                Prisma Client                 │
└─────────────────────────────────────────────┘
```

---

## 二、重构范围

### 2.1 需要重构的模块

| 模块 | 优先级 | 复杂度 | 备注 |
|------|--------|--------|------|
| Application (报名) | P0 | 高 | 核心业务，优先重构 |
| Exam (考试) | P0 | 高 | 核心业务 |
| Review (审核) | P0 | 高 | 核心业务 |
| Payment (支付) | P1 | 中 | 业务逻辑相对简单 |
| Ticket (准考证) | P1 | 中 | |
| Seating (座位) | P1 | 中 | |
| File (文件) | P2 | 低 | 基础设施相关 |
| Tenant (租户) | P1 | 高 | 多租户核心 |
| User (用户) | P1 | 中 | |
| Auth (认证) | P0 | 中 | 安全相关，谨慎重构 |

---

## 三、重构步骤

### 3.1 阶段一：基础设施准备 (1-2周)

#### 3.1.1 创建项目结构

```
server/src/
├── domain/                    # 领域层 (NEW)
│   ├── entities/            # 领域实体
│   │   ├── Exam.ts
│   │   ├── Application.ts
│   │   ├── Position.ts
│   │   └── ...
│   ├── value-objects/      # 值对象 (NEW)
│   │   ├── ExamStatus.ts
│   │   ├── ApplicationStatus.ts
│   │   └── ...
│   ├── aggregates/          # 聚合根 (NEW)
│   │   ├── ExamAggregate.ts
│   │   └── ApplicationAggregate.ts
│   ├── repositories/        # 仓库接口
│   │   ├── IExamRepository.ts
│   │   ├── IApplicationRepository.ts
│   │   └── ...
│   ├── services/            # 领域服务
│   │   └── ...
│   └── events/             # 领域事件 (NEW)
│       └── ...
│
├── application/              # 应用层 (NEW)
│   ├── dto/                # 应用 DTO
│   ├── services/           # 应用服务
│   ├── commands/           # 命令 (CQRS)
│   └── queries/            # 查询 (CQRS)
│
├── infrastructure/           # 基础设施层 (NEW)
│   ├── repositories/       # 仓库实现
│   │   ├── PrismaExamRepository.ts
│   │   └── ...
│   ├── mappers/            # 对象映射
│   └── ...
│
└── modules/                 # 现有模块 (保留，逐步迁移)
    ├── exam/
    ├── application/
    └── ...
```

#### 3.1.2 创建基础类

**Value Object 示例**:
```typescript
// domain/value-objects/ExamStatus.ts
export class ExamStatus {
  private readonly value: string;
  
  static readonly DRAFT = new ExamStatus('DRAFT');
  static readonly REGISTRATION_OPEN = new ExamStatus('REGISTRATION_OPEN');
  static readonly OPEN = new ExamStatus('OPEN');
  static readonly CLOSED = new ExamStatus('CLOSED');
  
  private constructor(value: string) {
    this.value = value;
  }
  
  get value(): string {
    return this.value;
  }
  
  equals(other: ExamStatus): boolean {
    return this.value === other.value;
  }
}
```

**Entity 示例**:
```typescript
// domain/entities/Exam.ts
export class Exam {
  private readonly id: string;
  private title: string;
  private code: string;
  private status: ExamStatus;
  private readonly createdAt: Date;
  private updatedAt: Date;
  
  // 私有构造函数，强制通过工厂方法创建
  private constructor(props: ExamProps) {
    this.id = props.id;
    this.title = props.title;
    this.code = props.code;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
  
  // 工厂方法
  static create(props: CreateExamProps): Exam {
    // 业务规则验证
    if (!props.title || props.title.length < 2) {
      throw new DomainException('考试标题至少2个字符');
    }
    
    return new Exam({
      id: props.id || generateUuid(),
      title: props.title,
      code: props.code,
      status: ExamStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  // 领域行为
  publish(): void {
    if (this.status !== ExamStatus.DRAFT) {
      throw new DomainException('只有草稿状态的考试可以发布');
    }
    this.status = ExamStatus.REGISTRATION_OPEN;
    this.updatedAt = new Date();
  }
  
  // Getters
  getId(): string { return this.id; }
  getTitle(): string { return this.title; }
  getStatus(): ExamStatus { return this.status; }
}
```

**Repository 接口示例**:
```typescript
// domain/repositories/IExamRepository.ts
export interface IExamRepository {
  findById(id: string): Promise<Exam | null>;
  findByCode(code: string): Promise<Exam | null>;
  findAll(filter?: ExamFilter): Promise<PaginatedResult<Exam>>;
  save(exam: Exam): Promise<Exam>;
  delete(id: string): Promise<void>;
}
```

---

### 3.2 阶段二：核心模块重构 (3-4周)

#### 3.2.1 Application 模块重构

**步骤**:

1. **创建 Domain Layer**
   - 定义 `Application` 实体
   - 定义 `ApplicationStatus` 值对象
   - 创建 `ApplicationAggregate`

2. **创建 Repository**
   - 定义 `IApplicationRepository` 接口
   - 实现 `PrismaApplicationRepository`

3. **创建 Application Service**
   - 提取现有 Service 中的业务逻辑
   - 定义 Command/Query (可选：CQRS)

4. **更新 Controller**
   - 依赖注入改为接口
   - 逐步迁移端点

**示例代码**:
```typescript
// domain/aggregates/ApplicationAggregate.ts
export class ApplicationAggregate {
  private application: Application;
  private attachments: FileRecord[] = [];
  private reviews: Review[] = [];
  
  constructor(application: Application) {
    this.application = application;
  }
  
  // 领域行为：提交报名
  submit(payload: ApplicationPayload): void {
    // 业务规则验证
    if (this.application.getStatus() !== ApplicationStatus.DRAFT) {
      throw new DomainException('只有草稿状态可以提交');
    }
    
    this.application.setPayload(payload);
    this.application.submit();
    
    // 触发领域事件
    this.addDomainEvent(new ApplicationSubmittedEvent(this.application));
  }
  
  // 领域行为：通过审核
  approve(reviewerId: string, comment: string): void {
    if (this.application.getStatus() !== ApplicationStatus.PENDING_PRIMARY_REVIEW) {
      throw new DomainException('当前状态不允许审核');
    }
    
    this.application.approve();
    this.addDomainEvent(new ApplicationApprovedEvent(this.application, reviewerId, comment));
  }
  
  // 获取聚合根
  getApplication(): Application {
    return this.application;
  }
}
```

```typescript
// application/services/SubmitApplicationHandler.ts
@Injectable()
export class SubmitApplicationHandler {
  constructor(
    private readonly applicationRepo: IApplicationRepository,
    private readonly eventBus: DomainEventBus,
  ) {}
  
  async execute(command: SubmitApplicationCommand): Promise<Result<Application, Error>> {
    // 1. 创建聚合根
    const aggregate = ApplicationAggregate.create({
      candidateId: command.candidateId,
      examId: command.examId,
      positionId: command.positionId,
      payload: command.payload,
    });
    
    // 2. 执行领域行为
    try {
      aggregate.submit(command.payload);
    } catch (error) {
      return Result.fail(error);
    }
    
    // 3. 保存
    const savedApplication = await this.applicationRepo.save(
      aggregate.getApplication()
    );
    
    // 4. 发布领域事件
    await this.eventBus.publish(aggregate.getDomainEvents());
    
    return Result.ok(savedApplication);
  }
}
```

---

### 3.3 阶段三：其他模块重构 (2-3周)

按照优先级依次重构:
1. Exam 模块
2. Review 模块
3. Payment 模块
4. 其他模块

---

### 3.4 阶段四：清理与优化 (1周)

1. 移除旧的 Service 中的重复逻辑
2. 统一错误处理
3. 添加单元测试
4. 更新文档

---

## 四、重构详细任务

### 4.1 任务清单

#### Phase 1: 基础设施

| 任务ID | 任务 | 预估工时 | 依赖 |
|--------|------|----------|------|
| T1.1 | 创建 domain/ 目录结构 | 1d | - |
| T1.2 | 创建 value-objects 基类 | 1d | T1.1 |
| T1.3 | 创建 entity 基类 | 1d | T1.1 |
| T1.4 | 创建 repository 接口基类 | 1d | T1.1 |
| T1.5 | 创建 DomainEvent 基类 | 1d | T1.1 |
| T1.6 | 创建 Result/Either 类型 | 0.5d | - |

#### Phase 2: Application 模块

| 任务ID | 任务 | 预估工时 | 依赖 |
|--------|------|----------|------|
| T2.1 | 创建 Application 实体 | 2d | T1.2,T1.3 |
| T2.2 | 创建 ApplicationStatus 值对象 | 1d | T1.2 |
| T2.3 | 创建 IApplicationRepository | 1d | T1.4 |
| T2.4 | 实现 PrismaApplicationRepository | 2d | T2.3 |
| T2.5 | 创建 ApplicationAggregate | 2d | T2.1 |
| T2.6 | 创建 SubmitApplicationHandler | 2d | T2.5 |
| T2.7 | 更新 ApplicationController | 1d | T2.6 |
| T2.8 | 添加单元测试 | 2d | T2.7 |

#### Phase 3: Exam 模块

| 任务ID | 任务 | 预估工时 | 依赖 |
|--------|------|----------|------|
| T3.1 | 创建 Exam/Position/Subject 实体 | 3d | T1.2,T1.3 |
| T3.2 | 创建 ExamRepository | 2d | T1.4 |
| T3.3 | 创建 ExamAggregate | 2d | T3.1 |
| T3.4 | 创建 ExamService handlers | 3d | T3.3 |
| T3.5 | 更新 ExamController | 1d | T3.4 |

#### Phase 4: Review 模块

| 任务ID | 任务 | 预估工时 | 依赖 |
|--------|------|----------|------|
| T4.1 | 创建 Review 实体 | 2d | T1.3 |
| T4.2 | 创建 IReviewRepository | 1d | T1.4 |
| T4.3 | 创建 ReviewAggregate | 2d | T4.1 |
| T4.4 | 创建 ReviewHandlers | 3d | T4.3 |

#### Phase 5: 其他模块

| 任务ID | 任务 | 预估工时 | 依赖 |
|--------|------|----------|------|
| T5.1 | Payment 模块重构 | 2d | T1.x |
| T5.2 | Ticket 模块重构 | 2d | T1.x |
| T5.3 | Seating 模块重构 | 2d | T1.x |

#### Phase 6: 清理

| 任务ID | 任务 | 预估工时 | 依赖 |
|--------|------|----------|------|
| T6.1 | 移除旧 Service 重复代码 | 2d | All |
| T6.2 | 统一错误处理 | 1d | - |
| T6.3 | 补充单元测试 | 3d | All |
| T6.4 | 更新文档 | 1d | - |

---

## 五、技术细节

### 5.1 目录结构

```
server/src/
├── main.ts
├── app.module.ts
│
├── domain/                           # 领域层
│   ├── entities/
│   │   ├── base/
│   │   │   ├── Entity.ts          # 实体基类
│   │   │   └── AuditableEntity.ts # 可审计实体
│   │   ├── Exam.ts
│   │   ├── Application.ts
│   │   ├── Position.ts
│   │   └── ...
│   │
│   ├── value-objects/
│   │   ├── base/
│   │   │   └── ValueObject.ts     # 值对象基类
│   │   ├── ExamStatus.ts
│   │   ├── ApplicationStatus.ts
│   │   └── ...
│   │
│   ├── aggregates/
│   │   ├── ExamAggregate.ts
│   │   └── ApplicationAggregate.ts
│   │
│   ├── repositories/
│   │   ├── IExamRepository.ts
│   │   ├── IApplicationRepository.ts
│   │   └── ...
│   │
│   ├── services/
│   │   └── ...
│   │
│   ├── events/
│   │   ├── DomainEvent.ts
│   │   ├── DomainEventBus.ts
│   │   └── handlers/
│   │       └── ...
│   │
│   └── exceptions/
│       └── DomainException.ts
│
├── application/                      # 应用层
│   ├── dto/
│   │   ├── exam/
│   │   └── application/
│   │
│   ├── commands/
│   │   ├── exam/
│   │   │   ├── CreateExamCommand.ts
│   │   │   └── ...
│   │   └── application/
│   │
│   ├── queries/
│   │   ├── exam/
│   │   └── application/
│   │
│   └── services/
│       ├── ExamApplicationService.ts
│       └── ...
│
├── infrastructure/                    # 基础设施层
│   ├── repositories/
│   │   ├── prisma/
│   │   │   ├── PrismaExamRepository.ts
│   │   │   └── ...
│   │   └── mappers/
│   │       ├── ExamMapper.ts
│   │       └── ...
│   │
│   ├── events/
│   │   └── PrismaEventBus.ts
│   │
│   └── ...
│
└── modules/                          # 现有模块 (保留)
    ├── auth/
    ├── tenant/
    ├── user/
    └── ...
```

### 5.2 核心类型定义

```typescript
// domain/base/Entity.ts
export abstract class Entity<T> {
  protected readonly props: T;
  
  constructor(props: T) {
    this.props = Object.freeze(props);
  }
  
  equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    return this === entity;
  }
}

// domain/base/ValueObject.ts
export abstract class ValueObject<T> {
  protected readonly props: T;
  
  constructor(props: T) {
    this.props = Object.freeze(props);
  }
  
  equals(vo?: ValueObject<T>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(vo?.props);
  }
}

// application/common/Result.ts
export class Result<T> {
  private constructor(
    private isSuccess: boolean,
    private error?: Error,
    private value?: T,
  ) {}
  
  static ok<T>(value: T): Result<T> {
    return new Result(true, undefined, value);
  }
  
  static fail<T>(error: Error): Result<T> {
    return new Result(false, error);
  }
  
  get isOk(): boolean { return this.isSuccess; }
  get isErr(): boolean { return !this.isSuccess; }
  
  unwrap(): T {
    if (this.isErr) throw this.error;
    return this.value!;
  }
}
```

---

## 六、风险与缓解

### 6.1 主要风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 重构破坏现有功能 | 高 | 1. 逐步迁移而非一次性重写 |
| | | 2. 保留旧端点，逐步切换 |
| | | 3. 充分的测试覆盖 |
| 性能下降 | 中 | 1. 注意 Repository 实现细节 |
| | | 2. 避免不必要的对象转换 |
| 团队学习成本 | 中 | 1. 充分的文档 |
| | | 2. 代码审查 |
| 时间延期 | 中 | 1. 预留缓冲时间 |
| | | 2. 优先级排序 |

### 6.2 回滚计划

1. 保留旧的 Service 端点
2. 使用功能开关切换新旧实现
3. 每日构建验证

---

## 七、验收标准

### 7.1 重构完成标准

- [ ] 所有核心模块完成 DDD 重构
- [ ] Repository 模式全面实施
- [ ] Domain Entity 替代 Prisma 模型
- [ ] 单元测试覆盖率达到 80%
- [ ] 所有现有功能正常工作
- [ ] API 响应时间无明显下降

### 7.2 质量标准

- [ ] 代码无新增 ESLint 错误
- [ ] TypeScript 类型检查通过
- [ ] 单元测试全部通过
- [ ] E2E 测试全部通过

---

## 八、时间计划

| 阶段 | 内容 | 周期 |
|------|------|------|
| Phase 1 | 基础设施准备 | 1-2周 |
| Phase 2 | Application 模块 | 3-4周 |
| Phase 3 | 其他核心模块 | 2-3周 |
| Phase 4 | 清理与优化 | 1周 |
| **总计** | | **7-10周** |

---

## 九、立即行动

### 9.1 第一周任务

1. **创建目录结构**
   ```bash
   mkdir -p server/src/domain/{entities/base,value-objects/base,aggregates,repositories,services,events,exceptions}
   mkdir -p server/src/application/{dto,commands,queries,services}
   mkdir -p server/src/infrastructure/{repositories/prisma,mappers}
   ```

2. **创建基础类**
   - Entity.ts
   - ValueObject.ts
   - Result.ts
   - DomainException.ts

3. **开始 Application 模块分析**
   - 分析现有 ApplicationService
   - 设计 Application 实体
   - 设计聚合根

---

*计划结束 - 待续*
