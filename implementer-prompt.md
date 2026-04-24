# Task 2: 替换后端高频文件中的硬编码状态字符串

## Context
在 Phase 1 中我们定义了共享枚举，现在需要将后端核心服务和控制器中硬编码的状态字符串（如 'OPEN', 'DRAFT' 等）替换为这些类型化的枚举，以确保一致性。

## Requirements
涉及文件：
- server/src/exam/exam.service.ts
- server/src/exam/exam.controller.ts
- server/src/seating/seating.service.ts
- server/src/seating/seating.controller.ts
- server/src/review/review.service.ts
- server/src/statistics/statistics.service.ts

请执行以下步骤：
1. 在各文件中导入对应的枚举：`import { ExamStatus, ApplicationStatus, ReviewStatus, PaymentStatus } from '../common/enums';`
2. 将硬编码字符串替换为枚举引用（例如 `status: 'OPEN'` -> `status: ExamStatus.OPEN`）。
3. 确保涉及所有业务逻辑判断和查询条件。
4. 运行 `cd server && npx tsc --noEmit && npm test` 验证。
5. 提交更改，commit message: "refactor(server): replace hardcoded status strings with enums"。
