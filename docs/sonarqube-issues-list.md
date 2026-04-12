# SonarQube 更新后错误列表

通过 SonarQube API 拉取，时间：当前扫描结果。

---

## 总览

| 维度 | 数量 |
|------|------|
| **总议题数** | 1139 |
| **按严重程度** | CRITICAL: 19，MAJOR: 188，MINOR: 288，INFO: 5 |
| **按类型** | BUG: 16，CODE_SMELL: 484（注：API 返回 500 条/页，上述为当前页统计） |

---

## 按规则 Top 15

| 规则 | 数量 | 说明 |
|------|------|------|
| typescript:S1128 | 112 | 移除未使用的 import |
| typescript:S3358 | 49 | 嵌套三元改为独立语句 |
| typescript:S7764 | 33 | （见 Sonar 规则说明） |
| typescript:S1854 | 30 | 移除无用赋值 |
| typescript:S6819 | 29 | 用 button/语义标签替代 div+onClick |
| typescript:S7773 | 26 | （见 Sonar 规则说明） |
| typescript:S6759 | 24 | （见 Sonar 规则说明） |
| typescript:S6582 | 17 | 使用可选链 ?. |
| typescript:S7781 | 17 | （见 Sonar 规则说明） |
| typescript:S3776 | 16 | 认知复杂度过高，需拆到 ≤15 |
| typescript:S1082 | 15 | 可点击元素需键盘可访问 |
| typescript:S6848 | 15 | （见 Sonar 规则说明） |
| typescript:S6853 | 13 | 表单 label 须关联控件 |
| typescript:S7735 | 10 | （见 Sonar 规则说明） |
| typescript:S2486 | 9 | （见 Sonar 规则说明） |

---

## CRITICAL / BLOCKER（27 条）

| 文件 | 行 | 规则 | 消息摘要 |
|------|----|------|----------|
| server/src/prisma/tenant-pool.wrapper.ts | 55 | S3776 | 认知复杂度过高 |
| server/src/seating/seating.service.ts | 42 | S3776 | 认知复杂度过高 |
| server/src/tenant/tenant.middleware.ts | 22 | S3776 | 认知复杂度过高 |
| server/src/tenant/tenant.service.ts | 418 | S3776 | 认知复杂度过高 |
| server/src/user/profile.service.ts | 131 | S3776 | 认知复杂度过高 |
| web/src/app/[tenantSlug]/admin/applications/[id]/page.tsx | 136 | S3776 | 认知复杂度过高 |
| web/src/app/[tenantSlug]/admin/exams/[examId]/scores/import/page.tsx | 215 | S2004 | 嵌套层级超过 4 层 |
| web/src/app/[tenantSlug]/reviewer/applications/[id]/page.tsx | 384, 487 | S3776 | 认知复杂度过高 |
| web/src/app/login/page.tsx | 67 | S3776 | 认知复杂度过高 |
| web/src/lib/api.ts | 36 | S4123 | 对非 Promise 使用 await |
| web/src/lib/api.ts | 50, 101 | S3776 | 认知复杂度过高 |
| web/src/middleware.ts | 27 | S3776 | 认知复杂度过高 |
| web/src/app/[tenantSlug]/admin/reviews/ReviewsPageClient.tsx | 56 | S3776 | 认知复杂度过高 |
| web/src/app/my-scores/page.tsx | 69 | S3776 | 认知复杂度过高 |
| web/src/app/[tenantSlug]/login/page.tsx | 62 | S3776 | 认知复杂度过高 |
| web/src/app/candidate/scores/[applicationId]/page.tsx | 44 | S3776 | 认知复杂度过高 |
| web/src/components/admin/exam-detail/ExamApplicationForm.tsx | 137 | S2004 | 嵌套超过 4 层 |
| web/src/components/forms/DynamicField.tsx | 276 | S2004 | 嵌套超过 4 层 |
| web/src/components/examples/ApiHooksExample.tsx | 25 | S3776 | 认知复杂度过高 |
| web/src/components/forms/DynamicForm.tsx | 100 | S2004 | 嵌套超过 4 层 |
| web/src/components/forms/EducationBackgroundField.tsx | 168 | S2004 | 嵌套超过 4 层 |
| web/src/components/ui/fileupload.tsx | 103 | S2004 | 嵌套超过 4 层 |
| web/src/components/ui/formfileupload.tsx | 133 | S2004 | 嵌套超过 4 层 |
| web/src/components/ui/qrcodedisplay.tsx | 77 | S3776 | 认知复杂度过高 |
| web/src/lib/error-handling.ts | 217 | S3776 | 认知复杂度过高 |

---

## BUG 类型（37 条）

- **S1082**（可点击元素需键盘支持）：admin applications [id]、ReviewPageClient、my-applications、reviewer applications [id]、candidate/files、formfileupload、auto-review-rules、positions/rules、candidate/page、candidate/applications/template、tenants、SeatMap、ExamPositionsAndSubjects、FormBuilderCanvas、DateRangePicker、ApiHooksExample、DashboardLayout、MobileCard、MobileSheet、PaymentForm 等。
- **S6439**（条件泄漏）：candidate/exams/[id]/page、[tenantSlug]/exams/[examId]/page。
- **S6959**（reduce 需初始值）：AppNavigation。
- **S5256**（table 需有效表头）：components/ui/table.tsx。
- **S3923**（重复分支）：hooks/useErrorHandler.ts。

---

## 说明

- 列表来自 `GET /api/issues/search?componentKeys=duanruo-exam-system&ps=500`，分页限制 500，总数为 1139 时会有未在本页展示的条目。
- 在 SonarQube 界面查看完整列表：**http://localhost:9000/issues**（可用 impactSeverities=HIGH、issueStatuses=CONFIRMED,OPEN 等参数筛选）。
