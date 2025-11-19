-- 添加新的考试状态：IN_PROGRESS 和 COMPLETED
-- 现有状态：DRAFT, OPEN, CLOSED
-- 新增状态：IN_PROGRESS (考试进行中), COMPLETED (考试已完成)

-- 注意：此迁移脚本在public schema中执行
-- 但exam_status类型在租户schema中定义（作为VARCHAR，不是ENUM）
-- 因此此脚本不需要执行任何操作

-- 状态值已在应用层定义，不需要数据库级别的ENUM类型
-- 参考：ExamStatus枚举类

-- 此脚本保留为空，仅用于版本控制
-- 实际的状态值由应用层的ExamStatus枚举管理

