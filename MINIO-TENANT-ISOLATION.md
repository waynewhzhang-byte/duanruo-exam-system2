# MinIO 租户级存储隔离方案

> **更新日期**: 2026-01-14
> **版本**: 2.0.0 (Bucket-per-Tenant)

---

## 📋 方案概述

### 问题背景

在多租户 SaaS 架构中,数据库层面通过 PostgreSQL schema 隔离实现了租户数据隔离,但**非结构化数据**(如报名资料、附件)也需要相应的隔离机制。

### 升级方案

| 维度 | 旧方案 (Prefix-based) | 新方案 (Bucket-per-Tenant) |
|-----|----------------------|---------------------------|
| **隔离级别** | 应用层(路径前缀) | 物理层(独立 Bucket) |
| **安全性** | 🟡 中等 | 🟢 高 |
| **配额管理** | ❌ 不支持 | ✅ 支持 |
| **备份恢复** | 🟡 复杂 | 🟢 简单 |
| **性能隔离** | ❌ 无 | ✅ 有 |
| **合规性** | 🟡 部分满足 | 🟢 完全满足 |

---

## 🏗️ 架构设计

### 1. 存储结构

```
MinIO Server
├── tenant-company-a-files          ← 租户A专属 bucket
│   ├── uploads/
│   │   ├── {userId}/
│   │   │   ├── {fieldKey}/
│   │   │   │   └── {fileId}.pdf
│   │   │   └── general/
│   │   │       └── {fileId}.jpg
│   │   └── ...
│   └── attachments/
│
├── tenant-fintech-corp-files        ← 租户B专属 bucket
│   ├── uploads/
│   └── temp/
│
└── tenant-government-org-files      ← 租户C专属 bucket
    └── ...
```

**Bucket 命名规则**: `tenant-{code}-files`

**示例**:
- 租户代码: `company_a` → Bucket: `tenant-company-a-files`
- 租户代码: `fintech_corp` → Bucket: `tenant-fintech-corp-files`

### 2. 文件路径结构

#### 旧方案 (单一 Bucket)

```
exam-uploads/
  └── tenants/{tenantId}/
        └── uploads/{userId}/{fieldKey}/{fileId}.ext
```

**问题**:
- 所有租户共享 bucket
- 路径过深
- 难以管理

#### 新方案 (Bucket-per-Tenant)

```
tenant-{code}-files/
  └── uploads/{userId}/{fieldKey}/{fileId}.ext
```

**优点**:
- 物理隔离
- 路径简洁
- 易于管理

---

## 🔧 实现细节

### 核心组件

#### 1. TenantBucketService

**位置**: [server/src/tenant/tenant-bucket.service.ts](d:\duanruo-exam-system2\server\src\tenant\tenant-bucket.service.ts)

**职责**:
- 创建租户专属 bucket
- 设置生命周期策略
- 管理 bucket 配额
- 删除租户 bucket
- 获取 bucket 统计信息

**核心方法**:

```typescript
class TenantBucketService {
  // 创建租户 bucket
  async createTenantBucket(tenantCode: string): Promise<void>

  // 获取 bucket 名称
  getTenantBucketName(tenantCode: string): string

  // 删除租户 bucket (含所有文件)
  async deleteTenantBucket(tenantCode: string, force: boolean): Promise<void>

  // 获取 bucket 统计
  async getTenantBucketStats(tenantCode: string): Promise<Stats>

  // 验证 bucket 存在
  async verifyTenantBucket(tenantCode: string): Promise<boolean>
}
```

#### 2. 租户创建流程集成

**位置**: [server/src/tenant/tenant.service.ts:21-80](d:\duanruo-exam-system2\server\src\tenant\tenant.service.ts#L21-L80)

```typescript
async createTenant(data) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. 创建租户记录 (public.tenants)
    const tenant = await tx.tenant.create({ ... });

    // 2. 创建 PostgreSQL schema
    await tx.$executeRawUnsafe(`CREATE SCHEMA "tenant_{code}"`);

    // 3. 初始化 schema 表结构
    await this.initializeTenantSchema(tx, schemaName);

    // 4. 创建 MinIO bucket (新增)
    await this.createTenantStorage(data.code);

    return tenant;
  });
}
```

#### 3. FileService 更新

**位置**: [server/src/file/file.service.ts](d:\duanruo-exam-system2\server\src\file\file.service.ts)

**关键变更**:

```typescript
// ❌ 旧代码: 使用固定 bucket
private readonly bucketName = 'exam-uploads';
const objectKey = `tenants/${tenantId}/uploads/...`;
await this.minioClient.presignedPutObject(this.bucketName, ...);

// ✅ 新代码: 动态获取租户 bucket
private getTenantBucketName(tenantCode: string): string {
  return `tenant-${tenantCode}-files`;
}

const bucketName = await this.ensureTenantBucket(tenant.code);
const objectKey = `uploads/${userId}/${fieldKey}/${fileId}.ext`;
await this.minioClient.presignedPutObject(bucketName, ...);
```

**更新的方法**:
- ✅ `generateUploadUrl()` - 生成上传URL
- ✅ `confirmUpload()` - 确认上传完成
- ✅ `getDownloadUrl()` - 生成下载URL

---

## 🔐 安全增强

### 1. 物理级别隔离

**Before**:
```
所有租户共享 bucket "exam-uploads"
- 租户A: /tenants/uuid-a/...
- 租户B: /tenants/uuid-b/...
```

**风险**: 如果权限配置错误,租户A可能访问租户B的数据

**After**:
```
每个租户独立 bucket
- 租户A: bucket "tenant-company-a-files"
- 租户B: bucket "tenant-company-b-files"
```

**保障**: 即使权限配置错误,也无法跨 bucket 访问

### 2. 权限最小化

每个租户 bucket 可以设置独立的访问策略:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["arn:aws:iam::tenant-a-service"]},
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": ["arn:aws:s3:::tenant-company-a-files/*"]
    }
  ]
}
```

### 3. 审计追踪

通过 MinIO 的 bucket 级别审计:
- 谁访问了哪些文件
- 何时上传/下载
- 文件操作历史

---

## 📊 配额管理

### 设置租户存储配额

```bash
# 为租户A设置 10GB 配额
mc quota set tenant-company-a-files --size 10GB

# 查看配额使用情况
mc quota info tenant-company-a-files
```

### 应用层配额检查

```typescript
async checkTenantQuota(tenantCode: string): Promise<boolean> {
  const stats = await this.getTenantBucketStats(tenantCode);
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  return stats.totalSize < maxSize;
}
```

---

## 🗄️ 备份恢复

### 租户级别备份

**优势**: 可以独立备份/恢复单个租户的数据

```bash
# 备份租户A的所有文件
mc mirror tenant-company-a-files /backups/tenant-company-a-$(date +%Y%m%d)

# 恢复租户A的数据
mc mirror /backups/tenant-company-a-20260114 tenant-company-a-files
```

### 集成到租户管理

```typescript
// 租户删除时备份数据
async deleteTenant(tenantCode: string) {
  // 1. 备份 MinIO bucket
  await this.backupTenantBucket(tenantCode);

  // 2. 删除 bucket
  await this.tenantBucketService.deleteTenantBucket(tenantCode, true);

  // 3. 删除数据库 schema
  await this.deleteSchema(tenantCode);

  // 4. 删除租户记录
  await this.prisma.tenant.delete({ where: { code: tenantCode } });
}
```

---

## 📈 性能优化

### 1. Bucket 级别的性能隔离

- 租户A的大量上传不会影响租户B
- 每个 bucket 有独立的 I/O 配额

### 2. 并发控制

```typescript
// 限制单个租户的并发上传数
const MAX_CONCURRENT_UPLOADS = 10;

async uploadFile(tenantId: string, file: File) {
  const semaphore = await this.getSemaphore(tenantId);
  await semaphore.acquire();

  try {
    return await this.doUpload(file);
  } finally {
    semaphore.release();
  }
}
```

### 3. CDN 集成

为不同租户配置不同的 CDN 策略:

```typescript
// 租户A: 金融行业,需要高可用
tenant-company-a-files → CloudFront (全球加速)

// 租户B: 本地企业,区域访问
tenant-local-org-files → 本地 CDN
```

---

## 🧪 测试验证

### 1. 创建租户并验证 Bucket

```bash
# 创建租户
curl -X POST http://localhost:3000/api/v1/super-admin/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试公司",
    "code": "test_company",
    "contactEmail": "admin@test.com"
  }'

# 验证 bucket 存在
mc ls minio/tenant-test-company-files
```

**预期结果**:
```
[2026-01-14 10:30:00 CST]     0B tenant-test-company-files/
```

### 2. 上传文件测试

```bash
# 获取上传URL
curl -X POST http://localhost:3000/api/v1/tenant/files/upload-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "resume.pdf",
    "contentType": "application/pdf",
    "fieldKey": "attachment"
  }'

# 使用预签名URL上传文件
curl -X PUT "$UPLOAD_URL" \
  --upload-file resume.pdf \
  -H "Content-Type: application/pdf"

# 确认上传
curl -X POST http://localhost:3000/api/v1/tenant/files/$FILE_ID/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"fileSize": 1024000}'
```

### 3. 验证文件隔离

```bash
# 租户A上传文件
mc ls minio/tenant-company-a-files/uploads/
# 输出: {fileId}.pdf

# 租户B看不到租户A的文件
mc ls minio/tenant-company-b-files/uploads/
# 输出: (empty)
```

### 4. 验证 Bucket 统计

```sql
-- 查询租户bucket统计
SELECT
  t.code,
  t.name,
  -- 通过API获取bucket统计
FROM tenants t
WHERE t.status = 'ACTIVE';
```

---

## 🔄 迁移指南

### 从 Prefix-based 迁移到 Bucket-per-Tenant

#### 步骤1: 创建租户 Buckets

```bash
# 为所有现有租户创建 bucket
SELECT code FROM tenants;

# 为每个租户执行:
mc mb minio/tenant-{code}-files
```

#### 步骤2: 迁移数据

```bash
# 租户 A 的数据迁移
mc mirror \
  minio/exam-uploads/tenants/{tenant-a-id}/ \
  minio/tenant-company-a-files/
```

#### 步骤3: 更新数据库记录

```sql
-- 更新 file_records 表的 object_key
UPDATE files
SET object_key = REPLACE(
  object_key,
  'tenants/{tenantId}/uploads/',
  'uploads/'
)
WHERE object_key LIKE 'tenants/%';
```

#### 步骤4: 验证迁移

```bash
# 验证文件数量一致
mc du minio/exam-uploads/tenants/{tenant-id}/
mc du minio/tenant-{code}-files/
```

#### 步骤5: 清理旧数据

```bash
# 确认迁移成功后删除旧bucket中的租户数据
mc rm --recursive minio/exam-uploads/tenants/{tenant-id}/
```

---

## ⚠️ 注意事项

### 1. Bucket 命名限制

MinIO bucket 命名规则:
- 长度: 3-63 字符
- 字符: 小写字母、数字、连字符
- ❌ 不能使用: 大写字母、下划线、连续连字符
- ❌ 不能以连字符开头或结尾

**处理方式**:
```typescript
getTenantBucketName(tenantCode: string): string {
  // 将下划线转换为连字符
  const sanitized = tenantCode.toLowerCase().replace(/_/g, '-');
  return `tenant-${sanitized}-files`;
}
```

### 2. 事务一致性

MinIO bucket 创建在数据库事务**之外**:

```typescript
await this.prisma.$transaction(async (tx) => {
  // DB 操作
});

// MinIO 操作不在事务中
await this.createTenantStorage(code);
```

**原因**: MinIO 不支持分布式事务

**处理策略**:
- 如果 bucket 创建失败,记录错误但不回滚租户创建
- 后台任务定期检查并创建缺失的 bucket

### 3. 性能考虑

- **Bucket 数量**: MinIO 支持无限 bucket,但建议 < 10000
- **并发创建**: 租户创建时 bucket 创建是阻塞的,预计耗时 50-200ms
- **大文件上传**: 使用分片上传(multipart upload)

### 4. 成本考虑

- 每个 bucket 有少量元数据开销(通常 < 1KB)
- 1000 个租户 ≈ 1MB 元数据
- 对存储成本影响可忽略

---

## 📚 相关文档

- [租户创建测试指南](./TENANT-CREATION-TEST.md)
- [多租户架构设计](./CLAUDE.md#多租户架构设计)
- [MinIO 官方文档](https://min.io/docs/minio/linux/reference/minio-server/minio-server.html)

---

## 🎯 总结

### 架构对比

| 层面 | 旧架构 | 新架构 |
|-----|-------|-------|
| **数据库** | Schema-per-Tenant ✅ | Schema-per-Tenant ✅ |
| **对象存储** | Prefix-based ⚠️ | Bucket-per-Tenant ✅ |
| **隔离级别** | 应用层 → 物理层 | **完全物理隔离** |
| **安全性** | 🟡 中等 | 🟢 高 |
| **可管理性** | 🟡 一般 | 🟢 优秀 |

### 核心优势

1. ✅ **安全性**: 物理级别的数据隔离
2. ✅ **合规性**: 满足严格的行业标准
3. ✅ **可管理性**: 独立的备份/恢复/配额
4. ✅ **性能**: 租户间性能隔离
5. ✅ **扩展性**: 支持大规模租户

### 最佳实践

1. **租户创建时同步创建 bucket**
2. **定期监控 bucket 使用情况**
3. **设置合理的配额限制**
4. **实施定期备份策略**
5. **记录详细的审计日志**

---

**维护者**: Claude AI Assistant
**问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
