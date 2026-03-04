# Requirements: 端若数智考盟前端质量修复

**Defined:** 2026-03-04
**Core Value:** 候选人能完整完成报名→审核→缴费→准考证全流程，管理员能正常操作后台各功能模块

## v1 Requirements

### 管理员后台（ADMIN）

- [x] **ADMIN-01**: 租户管理员后台首次加载无 JS 运行时错误
- [x] **ADMIN-02**: 考试列表正确获取并展示数据
- [x] **ADMIN-03**: 考试创建/编辑表单提交成功（DTO 字段与后端对齐）
- [x] **ADMIN-04**: 初审/复审申请列表正确加载
- [x] **ADMIN-05**: 审核操作（通过/拒绝）可正常执行并更新状态
- [x] **ADMIN-06**: 统计报表页面数据正确展示
- [ ] **ADMIN-07**: 场地/座位管理页面功能可用

### 候选人端（CAND）

- [ ] **CAND-01**: 考试报名表单含文件上传可成功提交
- [ ] **CAND-02**: 我的报名列表展示正确状态和信息
- [ ] **CAND-03**: 准考证下载功能可用
- [ ] **CAND-04**: 缴费流程无报错

### 审核员端（REVW）

- [ ] **REVW-01**: 审核列表加载正确的申请数据
- [ ] **REVW-02**: 审核操作按钮（通过/退回/补材料）可正常使用
- [ ] **REVW-03**: 申请详情页完整展示候选人资料

### 前后端接口对接（API）

- [ ] **API-01**: 所有租户作用域 API 调用均携带正确的 X-Tenant-ID 头
- [x] **API-02**: 前端正确解包后端统一响应格式 `{ data, message, statusCode }`
- [ ] **API-03**: DTO 校验失败（400）的错误信息对用户可见
- [x] **API-04**: JWT 过期/401 响应自动跳转登录页
- [x] **API-05**: 403 权限不足有明确的用户提示

### 超级管理员（SADM）

- [ ] **SADM-01**: 租户列表加载并展示数据
- [ ] **SADM-02**: 创建租户流程完整可用
- [ ] **SADM-03**: 平台用户管理功能可用

## v2 Requirements

### 体验优化（暂缓）

- **UX-01**: 表单字段实时校验提示
- **UX-02**: 操作加载状态（loading skeleton）
- **UX-03**: 批量操作（批量审核/批量分配座位）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 新增业务功能 | 本次只修复，不扩展 |
| UI 视觉重设计 | 保持现有布局和组件结构 |
| 性能优化（缓存/懒加载） | 功能正确优先 |
| 移动端适配 | 桌面端优先 |
| 支付网关真实接入 | 现有 mock 网关满足测试需求 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Complete |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Complete |
| API-05 | Phase 1 | Complete |
| ADMIN-01 | Phase 2 | Complete |
| ADMIN-02 | Phase 2 | Complete |
| ADMIN-03 | Phase 2 | Complete |
| ADMIN-04 | Phase 2 | Complete |
| ADMIN-05 | Phase 2 | Complete |
| ADMIN-06 | Phase 2 | Complete |
| ADMIN-07 | Phase 2 | Pending |
| CAND-01 | Phase 3 | Pending |
| CAND-02 | Phase 3 | Pending |
| CAND-03 | Phase 3 | Pending |
| CAND-04 | Phase 3 | Pending |
| REVW-01 | Phase 4 | Pending |
| REVW-02 | Phase 4 | Pending |
| REVW-03 | Phase 4 | Pending |
| SADM-01 | Phase 5 | Pending |
| SADM-02 | Phase 5 | Pending |
| SADM-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after roadmap creation*
