# Phase 5 Context: Super Admin

**Created:** 2026-03-06
**Phase:** 05-super-admin

## Goal

超级管理员可以在平台层面管理租户（查看、创建）和平台用户

## Requirements

- SADM-01: 租户列表加载并展示数据
- SADM-02: 创建租户流程完整可用
- SADM-03: 平台用户管理功能可用

## Success Criteria

1. 超管进入租户列表页，已有租户数据正确显示
2. 超管通过创建租户表单完整填写信息并提交，新租户成功创建并出现在列表中
3. 超管进入平台用户管理页，用户列表正确加载并可执行基本管理操作

## Existing Implementation

### Found Pages

| Page | Path | Notes |
|------|------|-------|
| Super Admin Layout | `/super-admin/layout.tsx` | Navigation sidebar |
| Tenants | `/super-admin/tenants/page.tsx` | Tenant list, create, activate/deactivate, delete |
| Users | `/super-admin/users/page.tsx` | Platform users management |

### API Endpoints Used

**Tenants:**
- `GET /super-admin/tenants` - List tenants
- `POST /super-admin/tenants` - Create tenant
- `POST /super-admin/tenants/{id}/activate` - Activate tenant
- `POST /super-admin/tenants/{id}/deactivate` - Deactivate tenant
- `DELETE /super-admin/tenants/{id}` - Delete tenant

**Users:**
- `GET /super-admin/users` - List platform users
- `POST /super-admin/users` - Create user (SUPER_ADMIN, TENANT_ADMIN, PRIMARY_REVIEWER, SECONDARY_REVIEWER)
- `PUT /super-admin/users/{id}` - Update user
- `DELETE /super-admin/users/{id}` - Delete user

## Implementation Notes

- Super admin is platform-level, NOT tenant-scoped - uses `apiGet` without tenant context
- Super admin routes are under `/super-admin/*` (not `/[tenantSlug]/super-admin/*`)
- Uses JWT authentication but no tenant context required
