# 通知机制分析报告

## 当前通知机制状态

### ✅ 已实现的通知

1. **报名提交** (`APPLICATION_SUBMITTED`)
   - 位置：`ApplicationApplicationService.submit()`
   - 状态：✅ 已实现

2. **自动审核结果** (`AUTO_REVIEW_*`)
   - 位置：`ApplicationApplicationService.submit()`
   - 状态：✅ 已实现

3. **支付成功** (`APPLICATION_PAID`)
   - 位置：`ApplicationApplicationService.markPaid()`
   - 状态：✅ 已实现

4. **准考证发放** (`TICKET_ISSUED`)
   - 位置：`TicketApplicationService.generateForApplication()`
   - 状态：✅ 已实现

### ❌ 缺失的通知

1. **成绩录入** (`SCORE_RECORDED`)
   - 位置：`ScoreApplicationService.recordScore()`
   - 状态：❌ **未实现** - 需要添加

2. **面试资格确认** (`INTERVIEW_ELIGIBLE`)
   - 位置：`InterviewEligibilityService.updateInterviewEligibilityStatus()`
   - 状态：❌ **未实现** - 需要添加

3. **座位安排** (`SEAT_ASSIGNED`)
   - 位置：`SeatingApplicationService.allocateSeats()`
   - 状态：❌ **未实现** - 需要添加

## 考生端查看方式

### 1. 通知卡片（站内消息）
- 路径：`/[tenantSlug]/candidate/notifications`
- API端点：`/notification-histories/my`
- 状态：✅ 已实现
- 功能：查看所有通知历史记录

### 2. 我的报名页面
- 路径：`/candidate/applications` 或 `/[tenantSlug]/candidate/applications`
- API端点：`/applications/my`
- 状态：✅ 已实现
- 功能：查看报名状态和详细信息

### 3. 成绩查询页面
- 路径：`/[tenantSlug]/candidate/scores/[applicationId]`
- API端点：`/scores/application/{applicationId}`
- 状态：✅ 已实现
- 功能：查看考试成绩和排名

### 4. 准考证页面
- 路径：`/[tenantSlug]/candidate/tickets`
- API端点：`/tickets/my`
- 状态：✅ 已实现
- 功能：查看和下载准考证

## 需要添加的通知功能

### 1. 成绩录入通知
当管理员录入成绩后，应通知考生：
- 通知类型：`SCORE_RECORDED`
- 触发时机：`ScoreApplicationService.recordScore()` 成功后
- 通知内容：科目名称、成绩、总分等

### 2. 面试资格确认通知
当管理员确认面试资格后，应通知考生：
- 通知类型：`INTERVIEW_ELIGIBLE`
- 触发时机：`InterviewEligibilityService.updateInterviewEligibilityStatus()` 成功后
- 通知内容：面试时间、地点等

### 3. 座位安排通知
当管理员分配座位后，应通知考生：
- 通知类型：`SEAT_ASSIGNED`
- 触发时机：`SeatingApplicationService.allocateSeats()` 成功后
- 通知内容：考场、教室、座位号等

## 建议

1. **立即添加缺失的通知功能**，确保考生能及时收到更新
2. **在考生端首页添加通知卡片**，显示未读通知数量
3. **优化通知内容**，包含更多有用信息（如链接、操作按钮等）

