# 项目编译构建及启动指南

本文档总结了多租户考试报名系统后端与前端的常用编译、构建与运行命令，确保开发与测试环境对齐。所有命令在项目根目录执行，除非另有说明。

## 1. 前置条件

- **后端**：JDK 21、Maven 3.9+、PostgreSQL 15+（开发默认库 `duanruo-exam-system`）、MinIO（可选但推荐用于文件存储）、Redis（缓存）、以及可选的 JWT/加密环境变量（请参考 `exam-bootstrap/src/main/resources/application*.yml`）。
- **前端**：Node 18+ / npm 10+，或与项目 `package.json` 兼容的版本管理器（推荐使用 `corepack enable && npm install -g pnpm` 后按需切换）。
- **备案**：务必配置 `.env` 或环境变量，至少包含后端的 `DATABASE_*`/`JWT_SECRET`/`ENCRYPTION_KEY`，及前端的 `NEXT_PUBLIC_API_URL`（通常指向 `http://localhost:8081/api/v1`）。

## 2. 后端编译与运行

### 2.1 通用编译与测试流程

```powershell
mvn clean install                   # 编译全部模块并运行单元与集成测试
mvn test                            # 仅运行所有单元测试
mvn verify                          # 运行包含集成测试（一般含 Testcontainers）
```

> **提示**：默认 Profile 为 `dev`，可通过 `-Pdev` 或额外 Flag 切换。所有依赖与 Flyway 信息集中在 `exam-bootstrap` 及相应模块的 `application*.yml`。

### 2.2 启动方式

- **推荐（PowerShell）**

```powershell
./scripts/start-backend.ps1              # 默认 dev profile
./scripts/start-backend.ps1 -Profile dev # 指定运行配置
```

- **兼容批处理**

```bat
scripts\start-backend.bat        # 默认 dev
scripts\start-backend.bat prod   # 指定 production profile
```

- **手动启动**

```powershell
mvn clean compile
cd exam-bootstrap
mvn spring-boot:run
```

如需指定 Port 或额外 JVM 参数：

```powershell
mvn -f exam-bootstrap/pom.xml -DskipTests spring-boot:run `
  -Dspring-boot.run.profiles=dev `
  -Dspring-boot.run.jvmArguments="-Dserver.port=8081"
```

### 2.3 数据库与多租户

- 生产/开发数据库配置读取自环境变量（`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`）。
- 租户 Schema 由 `SchemaManagementService` 管理，可以用脚本 `./scripts/create-new-tenant-via-api.ps1` 预建。
- 若报错 `Tenant schema not found`，请确认租户存在或重新执行租户创建脚本。

## 3. 前端编译与运行

进入前端目录后执行命令：

```bash
cd web
npm install                # 安装依赖
npm run dev                # 启动开发服务器（默认 http://localhost:3000）
npm run build              # 生产打包
npm run start              # 启动生产构建（需先 build）
npm run lint               # ESLint 检查
npm run type-check         # TypeScript 编译检查

# 其它测试
npm run test:e2e           # Playwright 全量 E2E
npm run test:bdd           # Cucumber BDD
```

开发时务必确保浏览器 token/tenant 配置与后端一致，`lib/api/client.ts` 会自动携带 `Authorization` 与 `X-Tenant-Id`。

## 4. 常用验证与脚本

- `mvn checkstyle:check`、`mvn spotbugs:check`、`mvn pmd:check`、`mvn jacoco:report`（代码质量与覆盖）。
- `npm run test:e2e:headed` / `:debug` 用于调试 Playwright。
- `scripts` 目录含常用辅助脚本，例如 `check-tenants.ps1`、`verify-migration*.sql`、`run-ui-tests.ps1` 等。

## 5. 启动顺序建议

1. 确保 PostgreSQL、Redis、MinIO 可用并已配置连接。
2. 启动后端（建议使用 `scripts/start-backend.ps1`）。
3. 启动前端（`cd web && npm run dev`）。
4. 若需要预置数据，可调用 `scripts/create-tenant-and-admin.js` 等脚本。

## 6. 故障排查速查

- 若后端启动失败：查看 `backend-startup.log`、`server-out.log`，确认 Flyway/Schema 不冲突。
- 若前端 API 报 401/403：检查 `NEXT_PUBLIC_API_URL` 与后端 JWT 策略、`localStorage` 中的 token/tenant。
- 若多租户 Schema 缺失：检查 `SchemaManagementService` 日志并手动执行 `scripts/run-flyway-migration.bat`。

