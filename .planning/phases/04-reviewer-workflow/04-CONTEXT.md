# Phase 4 Context: Reviewer Workflow

**Created:** 2026-03-05
**Phase:** 04-reviewer-workflow

## Goal

审核员可以查看分配给自己的申请列表，完整查看申请详情，并执行审核操作

## Requirements

- REVW-01: 审核列表加载正确的申请数据
- REVW-02: 审核操作按钮（通过/退回/补材料）可正常使用
- REVW-03: 申请详情页完整展示候选人资料

## Success Criteria

1. 审核员登录后，审核列表正确加载分配给当前角色（初审/复审）的申请数据
2. 点击任意申请进入详情页，候选人的全部资料（文件、表单信息）完整展示
3. 通过/退回/要求补材料按钮可点击，操作执行后申请状态正确流转并在列表中更新

## Existing Implementation

### Found Pages

| Page | Path | Notes |
|------|------|-------|
| Review Queue (tenant-scoped) | `/[tenantSlug]/reviewer/queue/page.tsx` | Uses apiGetWithTenant |
| Review Detail (tenant-scoped) | `/[tenantSlug]/reviewer/applications/[id]/page.tsx` | Full implementation |
| Review History (tenant-scoped) | `/[tenantSlug]/reviewer/history/page.tsx` | Uses apiGetWithTenant |
| Review Applications (non-tenant) | `/reviewer/applications/page.tsx` | **Uses apiGet without tenant** |

### Issues Found

1. **Duplicate implementation**: Both `/reviewer/applications/page.tsx` (non-tenant) and `/[tenantSlug]/reviewer/queue/page.tsx` (tenant-scoped) exist
2. **Tenant context missing**: `/reviewer/applications/page.tsx` uses `apiGet` instead of `apiGetWithTenant` (line 53)
3. **API endpoint**: Uses `/applications/pending-review` - needs verification backend supports this

### Current Implementation Analysis

**Queue Page (`/[tenantSlug]/reviewer/queue/page.tsx`):**
- Uses `apiGetWithTenant('/applications/pending-review?page=0&size=50')`
- Has approve/reject handlers calling `/reviews/${applicationId}/approve|reject`
- Shows application list with candidate name, position, exam title
- Has batch selection UI (not fully implemented)

**Detail Page (`/[tenantSlug]/reviewer/applications/[id]/page.tsx`):**
- Uses `apiGetWithTenant('/applications/${applicationId}')`
- Shows candidate basic info, form payload, attachments
- Has field-by-field review (approve/reject/return per field)
- Statistics panel showing review progress
- Approve/reject actions with comments

**History Page (`/[tenantSlug]/reviewer/history/page.tsx`):**
- Uses `apiGetWithTenant('/reviews/history')` with filters
- Falls back to empty data if API fails
- Has export button (TODO)

## Decisions

- Use tenant-scoped pages at `/[tenantSlug]/reviewer/*` (not `/reviewer/*`)
- Use `apiGetWithTenant` and `apiPostWithTenant` for all API calls
- Verify backend API endpoints exist and return correct format
- Keep existing UI structure (no visual redesign)

## Deferred Ideas

- Batch review operations (partially implemented in queue page)
- Export review reports
- Real-time notifications for new applications

## Notes

- Phase depends on Phase 2 (Admin Backend) for API patterns
- Need to verify `/applications/pending-review` endpoint works with reviewer role
- Need to verify review actions update application status correctly
