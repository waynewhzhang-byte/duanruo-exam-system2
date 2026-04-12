# SonarQube 问题详情分析

本文档对照 **SonarQube 扩展插件**（SonarLint / SonarQube）在 IDE 中报告的问题，按规则类型整理原因与修复建议。Dashboard 显示：**Reliability C（186）**、**Maintainability A（1k+）**、**Coverage 0%**、**Duplication 14.1%**。

---

## 一、Reliability（可靠性 / Bug）— 186 个

与“可能产生错误行为”的代码有关，扩展中常标为 **Bug**。

### 1. 使用 `any` 导致类型不安全

**规则（典型）**：`typescript:S6602`、`typescript:S3747` 等（禁用 any / 类型断言滥用）

**高发文件示例**：

| 文件 | 说明 |
|------|------|
| `server/src/exam/score.service.ts` | 多处 `any`（约 12 处） |
| `server/src/exam/exam.controller.ts` | 约 8 处 |
| `server/src/exam/form-template.controller.ts` | 约 8 处 |
| `server/src/review/auto-review.service.ts` | 约 15 处 |
| `server/src/prisma/tenant-pool.wrapper.ts` | 约 15 处 |
| `web/src/lib/api.ts` | `data: any`、`(d: any)`、`as any`（约 7 处） |
| `web/src/lib/api-hooks.ts` | 约 11 处 |
| `web/src/app/[tenantSlug]/admin/exams/[examId]/positions/[positionId]/rules/page.tsx` | 约 18 处 |
| `web/src/app/candidate/tickets/[applicationId]/page.tsx` | 约 31 处 |
| `web/src/data/form-templates.ts` | 约 24 处 |

**修复建议**：  
- 用具体类型或 `unknown` + 类型收窄替代 `any`。  
- 在 `api.ts` 中：为 `data` 定义 `unknown` 或 `ApiResult<T>`，为 `extractMessage` 的参数定义 `{ error?: { message?: unknown }; message?: unknown }` 等接口。

### 2. 非空断言 `!` 可能引发运行时错误

**规则**：`typescript:S6575`（no-null-assertion）

**涉及文件（示例）**：  
`server/src/ticket/ticket.service.ts`、`server/src/seating/seating.service.ts`、`web/src/components/admin/exam-detail/ExamApplicationForm.tsx`、`ExamScores.tsx`、`web/src/app/[tenantSlug]/admin/reviews/ReviewsPageClient.tsx` 等。

**修复建议**：  
用可选链 `?.` 或显式 `if (x != null) { ... }` 替代 `!`，避免在 null/undefined 时崩溃。

### 3. 未处理的 Promise / 异步错误

**规则**：`typescript:S6544`（no-floating-promises）等

**修复建议**：  
所有 `async` 调用都要 `await` 或 `.catch(...)`，尤其在 `useEffect`、事件回调里。扩展会标出“浮动 Promise”的具体行。

---

## 二、Maintainability（可维护性 / Code Smell）— 1k+

与“难维护、技术债”相关，扩展中常标为 **Code Smell**。

### 1. 使用 `console`（生产代码）

**规则**：`typescript:S2228`（no-console）

**高发位置示例**：

| 文件 | 行号附近 | 建议 |
|------|----------|------|
| `web/src/app/[tenantSlug]/candidate/exams/[id]/apply/page.tsx` | 255–257, 283–285, 305 | 删除或改为 logger/上报，勿留 `console.log` |
| `server/src/main.ts` | 65–66 | 可保留启动日志或改为 Logger |
| `web/src/app/admin/analytics/page.tsx` | 68 | 删除或实现真实导出并打日志 |
| `web/src/components/ui/error-boundary.tsx` | 36, 72 | 可保留 `console.error` 或改为错误上报服务 |
| 多处 `console.error` / `console.warn` | 见下方列表 | 生产环境建议统一用 Logger 或监控上报 |

**建议**：  
- 业务/调试用 `console.log`：删除或换成可配置的 logger。  
- 错误类：保留 `console.error` 或改为集中错误上报，避免散落。

### 2. TODO / FIXME 注释

**规则**：`typescript:S1135`（no-todo）

**部分位置**：

- `web/src/app/super-admin/settings/page.tsx`：59, 72（保存支付/通知设置 API）
- `web/src/app/admin/analytics/page.tsx`：67（导出）
- `web/src/app/[tenantSlug]/reviewer/history/page.tsx`：79（导出）
- `web/src/app/[tenantSlug]/my-applications/[applicationId]/ticket/page.tsx`：56（PDF 下载）
- `web/src/app/[tenantSlug]/exams/[examId]/apply/page.tsx`：327（保存草稿）
- `web/src/app/candidate/files/enhanced/page.tsx`：124, 135, 140（上传列表/下载/预览）
- `server/src/exam/exam.service.ts`：217（发布到全局目录）
- `server/src/scheduler/exam-scheduler.service.ts`：110（发准考证逻辑）
- `web/src/app/[tenantSlug]/reviewer/applications/[id]/page.tsx`：138, 156（taskId 从后端获取）

**修复建议**：  
- 若已实现：删除 TODO 或改为普通注释说明。  
- 若未实现：在 issue/backlog 中建档，注释中可留 `TODO(issue-xxx): ...`，或先删 TODO 避免被 Sonar 计为技术债。

### 3. 认知复杂度过高（长函数 / 深层嵌套）

**规则**：`typescript:S3776`（cognitive-complexity）

**常见于**：  
大页面组件、大 service 文件（如 `server/src/exam/exam.service.ts`、`server/src/seating/seating.service.ts`、`web/src/components/admin/exam-detail/ExamSeating.tsx`、`web/src/app/candidate/applications/new/page.tsx` 等）。

**修复建议**：  
- 按职责拆成小函数/子组件。  
- 减少 if/else 嵌套，用 early return、查表或策略函数。  
- 扩展会标出“认知复杂度 > 15”的函数，优先拆这些。

### 4. 重复代码（Duplication 14.1%）

**规则**：复制粘贴检测（CPD）

**已知提示**：  
`web/src/lib/api/generated-types.ts` 曾有“重复组过多，仅保留前 100 组”的告警，多为生成或样板代码。

**修复建议**：  
- 对业务重复：提取公共函数/组件/常量。  
- 对生成文件：在 `sonar-project.properties` 中对该路径做排除，或接受为已知技术债并在质量门禁中单独处理。

---

## 三、Coverage 0% 与 Hotspots 0%

- **Coverage**：当前扫描未上传覆盖率。  
  - 修复：先执行 `cd server && npm run test:cov`，再执行 `npm run sonar`（已配置 `server/coverage/lcov.info`），即可在 Dashboard 看到覆盖率。
- **Hotspots Reviewed**：在 SonarQube Web 的 **Security Hotspots** 中逐条评审并标记为 Safe/Fixed，百分比会上升。

---

## 四、在 IDE 中配合 SonarQube 扩展使用

1. **绑定项目**  
   - 若使用 **SonarLint**：在设置中连接本地 SonarQube（如 `http://localhost:9000`），并绑定项目 `duanruo-exam-system`，即可在编辑器中看到与服务器一致的规则与问题。

2. **查看问题详情**  
   - 打开 **Problems / SonarQube 面板**，点击某条 issue 可看到：**规则键**（如 `typescript:S6602`）、**消息**、**文件与行号**。  
   - 本页中的“规则”和“高发文件”可与这些规则键对应，便于批量修。

3. **按规则筛选**  
   - 在 SonarQube Web：**Project → Issues**，按 **Rule** 或 **Type (Bug/Code Smell)** 筛选。  
   - 在 IDE：在 SonarQube/SonarLint 面板中按规则或严重程度筛选，优先处理 **Reliability (Bug)** 再处理 **Maintainability (Code Smell)**。

4. **快速定位**  
   - 用本文档中的“文件 + 行号/模式”在项目中搜索，或直接点扩展中的问题跳转到对应行。

---

## 五、建议处理顺序

1. **Reliability**：先修 **Blocker/Critical** 的 Bug（尤其是 `any`、null 断言、浮动 Promise）。  
2. **Maintainability**：先删或替换 **console**、清理 **TODO**，再按扩展提示降低认知复杂度和重复代码。  
3. **Coverage**：接入 `test:cov` + 扫描，再在质量门禁中设定覆盖率要求。  
4. **Hotspots**：在 Web 端完成安全热点评审。

如需我按**单个文件**或**某条规则**列出具体修改示例（含补丁），可以指定文件路径或规则键。
