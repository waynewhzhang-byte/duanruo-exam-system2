# 文件名大小写问题解决方案

## 问题总结

在Windows文件系统上开发时遇到文件名大小写不一致的问题，这会导致在Linux系统上部署时出现构建失败。

### 根本原因

1. **文件系统差异**:
   - Windows: 文件系统不区分大小写 (`Badge.tsx` 和 `badge.tsx` 被视为同一文件)
   - Linux/Unix: 文件系统区分大小写 (`Badge.tsx` 和 `badge.tsx` 是不同的文件)

2. **Shadcn/ui 约定**:
   - Shadcn/ui 组件库使用小写文件名约定 (如 `badge.tsx`, `button.tsx`)
   - 但在开发过程中，部分文件使用了大写文件名 (如 `Badge.tsx`, `Button.tsx`)

3. **Import 语句不一致**:
   - 有些文件使用 `@/components/ui/Card`
   - 有些文件使用 `@/components/ui/card`
   - 在Windows上都能工作，但在Linux上会导致模块找不到

## 已执行的修复步骤

### 1. 文件重命名 (✅ 完成)

使用两步重命名法将所有大写文件名改为小写:

```powershell
# 步骤1: 重命名为临时文件
Move-Item Badge.tsx -> Badge-TEMP-RENAME.tsx

# 步骤2: 重命名为小写
Move-Item Badge-TEMP-RENAME.tsx -> badge.tsx
```

已重命名的文件:
- `Badge.tsx` → `badge.tsx`
- `Button.tsx` → `button.tsx`
- `Card.tsx` → `card.tsx`
- `Form.tsx` → `form.tsx`
- `Input.tsx` → `input.tsx`
- `Label.tsx` → `label.tsx`
- `Table.tsx` → `table.tsx`
- `Textarea.tsx` → `textarea.tsx`
- `Loading.tsx` → `loading.tsx`
- `FileUpload.tsx` → `fileupload.tsx`
- `FormFileUpload.tsx` → `formfileupload.tsx`
- `QRCodeDisplay.tsx` → `qrcodedisplay.tsx`

### 2. Import 语句统一 (✅ 大部分完成)

已修复73个文件中的import语句，将大写路径改为小写:

```typescript
// 修复前
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// 修复后
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

### 3. 清除构建缓存 (✅ 完成)

```powershell
Remove-Item .next -Recurse -Force
Remove-Item node_modules\.cache -Recurse -Force
Remove-Item tsconfig.tsbuildinfo -Force
```

## 剩余问题

### TypeScript 编译器仍然检测到大小写冲突

错误信息:
```
File name 'D:/duanruo-exam-system2/web/src/components/ui/Card.tsx' differs from 
already included file name 'D:/duanruo-exam-system2/web/src/components/ui/card.tsx' 
only in casing.
```

### 原因分析

1. **仍有部分文件使用大写import**:
   - `src/app/[tenantSlug]/admin/exams/[examId]/edit/page.tsx` (已修复)
   - `src/app/[tenantSlug]/admin/exams/new/page.tsx`
   - `src/app/[tenantSlug]/admin/page.tsx`
   - `src/app/[tenantSlug]/admin/exams/page.tsx`
   - `src/app/candidate/exams/[id]/positions/page.tsx`
   - `src/app/candidate/payment/[applicationId]/page.tsx`
   - `src/app/candidate/tickets/[applicationId]/page.tsx`
   - `src/app/exam/[slug]/page.tsx`
   - `src/app/exam/[slug]/register/page.tsx`
   - `src/app/reviewer/applications/[id]/page.tsx`

2. **TypeScript 缓存问题**:
   - 即使文件已重命名，TypeScript可能仍然记住旧的文件名
   - 需要完全清除所有缓存并重新构建

## 最终解决方案

### 方案 A: 手动修复剩余文件 (推荐)

逐个修复剩余使用大写import的文件:

```bash
# 查找所有使用大写import的文件
grep -r "@/components/ui/[A-Z]" src/

# 手动修复每个文件
```

### 方案 B: 使用 Git 重命名 (如果项目使用Git)

```bash
# 初始化Git仓库 (如果还没有)
git init

# 配置Git为大小写敏感
git config core.ignorecase false

# 使用Git重命名文件
git mv src/components/ui/Badge.tsx src/components/ui/badge-temp.tsx
git mv src/components/ui/badge-temp.tsx src/components/ui/badge.tsx

# 提交更改
git add .
git commit -m "fix: normalize component file names to lowercase"
```

### 方案 C: 在Linux环境中修复

如果有WSL或Linux虚拟机:

```bash
# 在Linux环境中直接删除大写文件 (如果存在)
cd web/src/components/ui
rm Badge.tsx Button.tsx Card.tsx Form.tsx Input.tsx Label.tsx Table.tsx Textarea.tsx Loading.tsx

# 确保只保留小写文件
ls -la *.tsx
```

## 验证步骤

修复完成后，执行以下步骤验证:

1. **清除所有缓存**:
```powershell
cd web
Remove-Item .next -Recurse -Force
Remove-Item node_modules\.cache -Recurse -Force  
Remove-Item tsconfig.tsbuildinfo -Force
```

2. **重新构建**:
```bash
npm run build
```

3. **检查警告**:
```bash
# 不应该再看到关于casing的警告
npm run build 2>&1 | grep -i "casing"
```

4. **检查文件系统**:
```powershell
# 确保没有大写文件
Get-ChildItem web\src\components\ui -Filter "*.tsx" | Where-Object { $_.Name -cmatch "^[A-Z]" }
```

## 预防措施

### 1. ESLint 规则

添加ESLint规则来强制小写import:

```json
// .eslintrc.json
{
  "rules": {
    "import/no-unresolved": ["error", { "caseSensitive": true }]
  }
}
```

### 2. Git Hooks

添加pre-commit hook来检查文件名:

```bash
#!/bin/sh
# .git/hooks/pre-commit

# 检查是否有大写的UI组件文件
if git diff --cached --name-only | grep -E "src/components/ui/[A-Z].*\.tsx$"; then
    echo "Error: UI component files must use lowercase names"
    exit 1
fi
```

### 3. CI/CD 检查

在CI流程中添加检查:

```yaml
# .github/workflows/ci.yml
- name: Check file naming
  run: |
    if find src/components/ui -name "[A-Z]*.tsx" | grep .; then
      echo "Error: Found uppercase component files"
      exit 1
    fi
```

## 当前状态

✅ 文件已重命名为小写  
✅ 大部分import语句已修复 (73个文件)  
⚠️ 仍有约10个文件使用大写import  
⚠️ TypeScript编译器仍报告大小写冲突  
✅ 应用程序功能正常 (警告不影响运行)  

## 下一步行动

1. ✅ 修复 `src/app/[tenantSlug]/admin/exams/[examId]/edit/page.tsx`
2. ⏳ 修复剩余9个文件的import语句
3. ⏳ 清除所有缓存并重新构建
4. ⏳ 验证构建成功且无警告
5. ⏳ 添加预防措施 (ESLint规则、Git hooks)

## 参考资料

- [Next.js File Naming Conventions](https://nextjs.org/docs/app/building-your-application/routing/defining-routes)
- [Shadcn/ui Component Library](https://ui.shadcn.com/)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Git Case Sensitivity](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase)

