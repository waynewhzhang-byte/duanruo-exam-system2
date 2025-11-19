# BDD 测试执行计划

**日期**: 2025-10-29  
**目标**: 使用 Chrome DevTools 执行 BDD 测试，验证系统功能  
**状态**: 🚀 准备开始

---

## 📋 执行前检查清单

### 1. 环境准备
- [ ] 后端服务运行在 http://localhost:8081
- [ ] 前端服务运行在 http://localhost:3000
- [ ] PostgreSQL 数据库可访问
- [ ] MinIO 对象存储可访问（如果需要）
- [ ] 测试数据已准备

### 2. 测试工具
- [ ] Chrome DevTools 可用
- [ ] Cucumber 已安装
- [ ] Playwright 已安装
- [ ] 测试依赖已安装

---

## 🎯 测试执行策略

### 阶段 1: 冒烟测试（@smoke 标签）
**目标**: 快速验证核心功能是否正常  
**预计时间**: 10-15 分钟

**测试场景**:
1. ✅ 租户管理员创建考试
2. ✅ 考生查看可用考试
3. ✅ 考生提交报名申请

**执行命令**:
```bash
cd web
npm run test:bdd:smoke
```

---

### 阶段 2: P0 优先级测试（@p0 标签）
**目标**: 验证所有核心业务流程  
**预计时间**: 30-45 分钟

**测试模块**:
1. 考试管理（exam-management.feature）
2. 考生报名（exam-registration.feature）
3. 审核流程（review-process.feature）
4. 支付流程（payment.feature）
5. 准考证（admission-ticket.feature）

**执行命令**:
```bash
cd web
npm run test:bdd:p0
```

---

### 阶段 3: 完整测试套件
**目标**: 执行所有 BDD 测试  
**预计时间**: 1-2 小时

**执行命令**:
```bash
cd web
npm run test:bdd
```

---

## 📊 测试覆盖范围

### 功能模块

#### 1. 超级管理员功能
- [ ] 租户管理 - 创建租户
- [ ] 租户管理 - 查看租户列表
- [ ] 租户管理 - 禁用租户
- [ ] 用户管理 - 查看所有用户
- [ ] 用户管理 - 重置密码

#### 2. 租户管理员功能
- [ ] 考试管理 - 创建考试
- [ ] 考试管理 - 配置岗位
- [ ] 考试管理 - 配置科目
- [ ] 考试管理 - 配置报名表单
- [ ] 考试管理 - 开放报名
- [ ] 考试管理 - 关闭报名
- [ ] 座位安排 - 创建考场
- [ ] 座位安排 - 自动分配座位
- [ ] 成绩管理 - 录入成绩
- [ ] 成绩管理 - 发布成绩

#### 3. 考生功能
- [ ] 注册和登录
- [ ] 浏览考试
- [ ] 提交报名申请
- [ ] 上传附件
- [ ] 查看报名状态
- [ ] 在线支付
- [ ] 查看准考证
- [ ] 下载准考证 PDF
- [ ] 查询成绩

#### 4. 审核员功能
- [ ] 查看待审核列表
- [ ] 审核通过
- [ ] 审核拒绝
- [ ] 二级审核

---

## 🔧 测试环境配置

### 后端配置
```yaml
server:
  port: 8081
  servlet:
    context-path: /api/v1

spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/duanruo-exam-system
    username: postgres
    password: zww0625wh
```

### 前端配置
```env
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Cucumber 配置
```javascript
// web/cucumber.js
module.exports = {
  default: {
    require: ['tests/bdd/step-definitions/**/*.ts', 'tests/bdd/support/**/*.ts'],
    requireModule: ['tsx/cjs'],
    format: [
      'progress-bar',
      'html:test-results/bdd/cucumber-report.html',
      'json:test-results/bdd/cucumber-report.json'
    ],
    parallel: 1
  },
  smoke: {
    tags: '@smoke'
  },
  p0: {
    tags: '@p0'
  }
};
```

---

## 📝 测试数据准备

### 测试用户
```yaml
super_admin:
  username: super_admin
  password: SuperAdmin123!@#
  role: SUPER_ADMIN

tenant_admin:
  username: tenant_admin
  password: Admin123!@#
  role: TENANT_ADMIN
  tenant: test-company-a

bdd_candidate:
  username: bdd_candidate
  password: Candidate123!@#
  role: CANDIDATE
  tenant: test-company-a

primary_reviewer:
  username: primary_reviewer
  password: Reviewer123!@#
  role: PRIMARY_REVIEWER
  tenant: test-company-a

secondary_reviewer:
  username: secondary_reviewer
  password: Reviewer123!@#
  role: SECONDARY_REVIEWER
  tenant: test-company-a
```

### 测试租户
```yaml
test-company-a:
  name: 测试公司A
  domain: test-company-a
  status: ACTIVE
  schema: tenant_test_company_a
```

---

## 🚀 执行步骤

### 步骤 1: 启动后端服务
```bash
cd d:\duanruo-exam-system2
mvn clean install -DskipTests
java -jar exam-bootstrap/target/exam-bootstrap-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
```

**验证**: 访问 http://localhost:8081/api/v1/actuator/health

---

### 步骤 2: 启动前端服务
```bash
cd d:\duanruo-exam-system2\web
npm install
npm run dev
```

**验证**: 访问 http://localhost:3000

---

### 步骤 3: 准备测试数据
```bash
cd d:\duanruo-exam-system2\web
npm run test:bdd:setup
```

---

### 步骤 4: 执行冒烟测试
```bash
cd d:\duanruo-exam-system2\web
npm run test:bdd:smoke
```

---

### 步骤 5: 执行完整测试
```bash
cd d:\duanruo-exam-system2\web
npm run test:bdd
```

---

## 📊 测试报告

### 报告位置
- HTML 报告: `web/test-results/bdd/cucumber-report.html`
- JSON 报告: `web/test-results/bdd/cucumber-report.json`
- JUnit 报告: `web/test-results/bdd/cucumber-report.xml`
- 截图: `web/test-results/bdd/screenshots/`
- 视频: `web/test-results/bdd/videos/`

### 查看报告
```bash
# 在浏览器中打开 HTML 报告
start web/test-results/bdd/cucumber-report.html
```

---

## ⚠️ 注意事项

### 1. 测试隔离
- 每个场景独立运行
- 使用 Before/After hooks 清理数据
- 避免场景间依赖

### 2. 测试数据
- 使用 API 准备测试数据
- 不直接操作数据库
- 遵循 BDD 架构原则

### 3. 错误处理
- 失败时自动截图
- 记录控制台日志
- 保存网络请求

### 4. 性能
- 并行度设置为 1（避免数据冲突）
- 使用 @slow 标签标记慢速测试
- 超时时间: 30 秒（默认）

---

## 🎯 成功标准

- ✅ 冒烟测试通过率 = 100%
- ✅ P0 测试通过率 ≥ 95%
- ✅ 完整测试通过率 ≥ 90%
- ✅ 平均执行时间 < 30 分钟
- ✅ 无严重 Bug

---

**计划创建时间**: 2025-10-29  
**计划状态**: ✅ 就绪

