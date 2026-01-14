# 自动审核系统使用指南

> **功能**: 在考生提交报名后自动验证资格条件
> **版本**: v1.0
> **更新时间**: 2026-01-14

---

## 📋 功能概述

自动审核系统可以在考生提交报名后，根据预设规则自动验证报名资料，只有通过自动审核的报名才会进入人工审核队列。

### 流程示意图

```
考生提交报名 (SUBMITTED)
    ↓
自动审核引擎
    ↓
   通过?
    ├─ 是 → AUTO_PASSED → PENDING_PRIMARY_REVIEW (进入人工审核)
    └─ 否 → AUTO_REJECTED (驳回，记录原因)
```

---

## 🎯 支持的规则类型

### 1. 年龄范围 (`age_range`)
验证考生年龄是否在指定范围内。

**支持的年龄来源**:
- 直接提供年龄数字
- 从身份证号自动提取年龄

**示例配置**:
```json
{
  "type": "age_range",
  "field": "age",           // 或 "idNumber"
  "required": true,
  "minAge": 18,
  "maxAge": 35,
  "rejectReason": "年龄不符合要求（18-35岁）"
}
```

---

### 2. 性别要求 (`gender`)
限制允许的性别。

**示例配置**:
```json
{
  "type": "gender",
  "field": "gender",
  "required": true,
  "allowedGenders": ["男"],
  "rejectReason": "该岗位仅限男性报名"
}
```

---

### 3. 学历要求 (`education`)
验证学历是否达到最低要求。

**支持的学历等级**:
```
小学(1) < 初中(2) < 高中/中专(3) < 专科/大专(4) < 本科/学士(5) < 硕士/研究生(6) < 博士(7)
```

**示例配置**:
```json
{
  "type": "education",
  "field": "education",
  "required": true,
  "minEducationLevel": "本科",
  "rejectReason": "学历不符合要求（要求本科及以上）"
}
```

---

### 4. 工作年限 (`work_experience`)
验证工作年限范围。

**示例配置**:
```json
{
  "type": "work_experience",
  "field": "workYears",
  "required": true,
  "minWorkYears": 3,
  "maxWorkYears": 10,
  "rejectReason": "工作年限不符合要求（3-10年）"
}
```

---

### 5. 身份证号 (`id_number`)
验证身份证号格式。

**验证规则**: 18位身份证号格式

**示例配置**:
```json
{
  "type": "id_number",
  "field": "idNumber",
  "required": true,
  "rejectReason": "身份证号格式不正确"
}
```

---

### 6. 手机号 (`phone`)
验证手机号格式。

**验证规则**: 1开头的11位数字

**示例配置**:
```json
{
  "type": "phone",
  "field": "phone",
  "required": true,
  "rejectReason": "手机号格式不正确"
}
```

---

### 7. 邮箱 (`email`)
验证邮箱格式。

**示例配置**:
```json
{
  "type": "email",
  "field": "email",
  "required": false,
  "rejectReason": "邮箱格式不正确"
}
```

---

### 8. 自定义字段 (`custom_field`)
灵活验证任意字段。

**验证方式**:
- 枚举值验证
- 正则表达式验证

**示例配置**:
```json
{
  "type": "custom_field",
  "field": "politicalStatus",
  "required": true,
  "allowedValues": ["中共党员", "共青团员", "群众"],
  "rejectReason": "政治面貌选项无效"
}
```

```json
{
  "type": "custom_field",
  "field": "employeeNumber",
  "required": false,
  "pattern": "^EMP\\d{6}$",
  "rejectReason": "员工编号格式不正确（如：EMP123456）"
}
```

---

## 🔧 配置自动审核规则

### 方式1: 创建岗位时配置

```bash
curl -X POST http://localhost:3000/exams/$EXAM_ID/positions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "POS001",
    "title": "软件工程师",
    "description": "负责后端开发",
    "quota": 10,
    "rulesConfig": {
      "autoReview": {
        "enabled": true,
        "rules": [
          {
            "type": "age_range",
            "field": "idNumber",
            "required": true,
            "minAge": 22,
            "maxAge": 35,
            "rejectReason": "年龄不符合要求（22-35岁）"
          },
          {
            "type": "education",
            "field": "education",
            "required": true,
            "minEducationLevel": "本科",
            "rejectReason": "学历要求：本科及以上"
          },
          {
            "type": "work_experience",
            "field": "workYears",
            "required": true,
            "minWorkYears": 2,
            "rejectReason": "要求至少2年工作经验"
          },
          {
            "type": "id_number",
            "field": "idNumber",
            "required": true,
            "rejectReason": "身份证号格式错误"
          },
          {
            "type": "phone",
            "field": "phone",
            "required": true,
            "rejectReason": "手机号格式错误"
          }
        ]
      }
    }
  }'
```

### 方式2: 更新现有岗位规则

```bash
curl -X PATCH http://localhost:3000/exams/$EXAM_ID/positions/$POSITION_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "rulesConfig": {
      "autoReview": {
        "enabled": true,
        "rules": [...]
      }
    }
  }'
```

---

## 💡 完整配置示例

### 场景1: 公务员招聘

```json
{
  "autoReview": {
    "enabled": true,
    "rules": [
      {
        "type": "age_range",
        "field": "idNumber",
        "required": true,
        "minAge": 18,
        "maxAge": 35,
        "rejectReason": "年龄不符合公务员报考要求（18-35周岁）"
      },
      {
        "type": "education",
        "field": "education",
        "required": true,
        "minEducationLevel": "本科",
        "rejectReason": "学历要求：本科及以上学历"
      },
      {
        "type": "custom_field",
        "field": "politicalStatus",
        "required": true,
        "allowedValues": ["中共党员", "中共预备党员", "共青团员", "群众"],
        "rejectReason": "政治面貌填写不规范"
      },
      {
        "type": "id_number",
        "field": "idNumber",
        "required": true,
        "rejectReason": "身份证号格式不正确"
      },
      {
        "type": "phone",
        "field": "phone",
        "required": true,
        "rejectReason": "请填写有效的手机号"
      },
      {
        "type": "email",
        "field": "email",
        "required": true,
        "rejectReason": "请填写有效的邮箱地址"
      }
    ]
  }
}
```

### 场景2: 技术岗位招聘

```json
{
  "autoReview": {
    "enabled": true,
    "rules": [
      {
        "type": "age_range",
        "field": "age",
        "required": true,
        "minAge": 20,
        "maxAge": 40,
        "rejectReason": "年龄要求：20-40岁"
      },
      {
        "type": "education",
        "field": "education",
        "required": true,
        "minEducationLevel": "本科",
        "rejectReason": "本岗位要求本科及以上学历"
      },
      {
        "type": "work_experience",
        "field": "workYears",
        "required": true,
        "minWorkYears": 3,
        "maxWorkYears": 15,
        "rejectReason": "工作经验要求：3-15年"
      },
      {
        "type": "custom_field",
        "field": "techStack",
        "required": true,
        "allowedValues": ["Java", "Python", "Go", "Node.js", "C++"],
        "rejectReason": "技术栈不匹配"
      }
    ]
  }
}
```

### 场景3: 校园招聘（应届生）

```json
{
  "autoReview": {
    "enabled": true,
    "rules": [
      {
        "type": "age_range",
        "field": "idNumber",
        "required": true,
        "minAge": 20,
        "maxAge": 26,
        "rejectReason": "应届生年龄要求：20-26岁"
      },
      {
        "type": "education",
        "field": "education",
        "required": true,
        "minEducationLevel": "本科",
        "rejectReason": "学历要求：本科及以上"
      },
      {
        "type": "custom_field",
        "field": "graduationYear",
        "required": true,
        "allowedValues": ["2025", "2026"],
        "rejectReason": "仅限2025-2026届毕业生"
      },
      {
        "type": "custom_field",
        "field": "graduationStatus",
        "required": true,
        "allowedValues": ["应届毕业生"],
        "rejectReason": "本次招聘仅限应届毕业生"
      }
    ]
  }
}
```

---

## 📊 报名表单字段映射

### 考生提交的报名数据结构

```json
{
  "examId": "xxx",
  "positionId": "xxx",
  "payload": {
    "name": "张三",
    "idNumber": "110101199001011234",
    "age": 26,
    "gender": "男",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "education": "本科",
    "workYears": 5,
    "politicalStatus": "中共党员",
    "graduationYear": "2020",
    "techStack": "Java"
  }
}
```

### 规则字段路径

规则中的 `field` 参数对应 `payload` 中的字段名：

```json
{
  "type": "age_range",
  "field": "idNumber",  // → payload.idNumber
  ...
}
```

支持嵌套路径（使用点号分隔）：

```json
{
  "type": "custom_field",
  "field": "address.province",  // → payload.address.province
  ...
}
```

---

## 🔍 查看自动审核结果

### 查询报名审计日志

```bash
curl -X GET http://localhost:3000/applications/$APPLICATION_ID/audit-logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

### 返回示例 (通过)

```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "applicationId": "xxx",
      "fromStatus": "SUBMITTED",
      "toStatus": "AUTO_PASSED",
      "actor": "AUTO_REVIEW_ENGINE",
      "reason": "自动审核通过",
      "metadata": {
        "autoReviewResult": {
          "passed": true,
          "failedRules": [],
          "summary": "自动审核通过"
        },
        "timestamp": "2026-01-14T10:00:00Z"
      },
      "createdAt": "2026-01-14T10:00:00Z"
    },
    {
      "fromStatus": "AUTO_PASSED",
      "toStatus": "PENDING_PRIMARY_REVIEW",
      "actor": "SYSTEM",
      "reason": "自动审核通过，进入人工审核队列"
    }
  ]
}
```

### 返回示例 (未通过)

```json
{
  "success": true,
  "data": [
    {
      "fromStatus": "SUBMITTED",
      "toStatus": "AUTO_REJECTED",
      "actor": "AUTO_REVIEW_ENGINE",
      "reason": "年龄不符合要求（22-35岁）; 学历要求：本科及以上; 工作年限不符合要求（最少 2 年）",
      "metadata": {
        "autoReviewResult": {
          "passed": false,
          "failedRules": [
            {
              "rule": {
                "type": "age_range",
                "field": "idNumber",
                "minAge": 22,
                "maxAge": 35
              },
              "reason": "年龄不符合要求（22-35岁）",
              "fieldValue": "110101200501011234"
            },
            {
              "rule": {
                "type": "education",
                "field": "education",
                "minEducationLevel": "本科"
              },
              "reason": "学历要求：本科及以上",
              "fieldValue": "专科"
            }
          ],
          "summary": "自动审核未通过，共 2 项不符合要求"
        }
      }
    }
  ]
}
```

---

## ⚙️ 禁用自动审核

如果不需要自动审核，可以禁用：

```json
{
  "rulesConfig": {
    "autoReview": {
      "enabled": false,
      "rules": []
    }
  }
}
```

或者完全不设置 `autoReview` 配置，系统会自动跳过自动审核，所有报名直接进入 `PENDING_PRIMARY_REVIEW` 状态。

---

## 🧪 测试自动审核

### 测试脚本示例

```javascript
// test-auto-review.js
const axios = require('axios');

const baseURL = 'http://localhost:3000';
const tenantId = 'your-tenant-id';
const token = 'your-token';

async function testAutoReview() {
  // 1. 创建带自动审核规则的岗位
  const position = await axios.post(
    `${baseURL}/exams/${examId}/positions`,
    {
      code: 'TEST001',
      title: '测试岗位',
      rulesConfig: {
        autoReview: {
          enabled: true,
          rules: [
            {
              type: 'age_range',
              field: 'age',
              required: true,
              minAge: 25,
              maxAge: 35,
              rejectReason: '年龄不符合（25-35岁）',
            },
          ],
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
    },
  );

  console.log('✅ 岗位创建成功:', position.data.data.id);

  // 2. 提交报名（年龄不符合）
  const application1 = await axios.post(
    `${baseURL}/applications/submit`,
    {
      examId,
      positionId: position.data.data.id,
      payload: {
        name: '张三',
        age: 20, // ❌ 不符合要求
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
    },
  );

  console.log('报名1状态:', application1.data.data.status);
  // 预期: AUTO_REJECTED

  // 3. 提交报名（年龄符合）
  const application2 = await axios.post(
    `${baseURL}/applications/submit`,
    {
      examId,
      positionId: position.data.data.id,
      payload: {
        name: '李四',
        age: 30, // ✅ 符合要求
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
    },
  );

  console.log('报名2状态:', application2.data.data.status);
  // 预期: PENDING_PRIMARY_REVIEW
}

testAutoReview().catch(console.error);
```

---

## ❓ 常见问题

### Q1: 自动审核失败会影响报名提交吗？
**A**: 不会。自动审核是异步执行的，即使审核引擎出错，报名也会成功提交，只是状态保持为 `SUBMITTED`。管理员可以手动介入处理。

### Q2: 可以修改已提交报名的自动审核规则吗？
**A**: 规则只在报名提交时执行一次。修改规则不会影响已提交的报名，只对新报名生效。

### Q3: 自动审核驳回后考生可以重新提交吗？
**A**: 可以。考生可以修改报名信息后重新提交，系统会重新执行自动审核。

### Q4: 如何调试自动审核规则？
**A**:
1. 查看服务器日志，搜索 `AUTO_REVIEW`
2. 查询报名的审计日志API
3. 使用测试脚本模拟不同场景

### Q5: 支持自定义复杂验证逻辑吗？
**A**: 目前支持的规则类型已覆盖常见场景。如需更复杂的验证，可以使用 `custom_field` 类型配合正则表达式。

---

## 📝 最佳实践

1. **明确驳回原因**: `rejectReason` 要清晰具体，便于考生理解
2. **合理设置必填**: 非关键字段不要设置 `required: true`
3. **测试规则**: 正式使用前先用测试数据验证规则
4. **监控日志**: 定期检查自动审核的通过率和驳回原因
5. **规则文档化**: 在招聘公告中明确说明报考条件

---

**文档版本**: v1.0
**更新时间**: 2026-01-14
**状态**: ✅ 生产就绪
