-- 添加考试举行时间字段
-- 用于显示考试的实际举行时间（非系统管理时间）

ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_start TIMESTAMP;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_end TIMESTAMP;

COMMENT ON COLUMN exams.exam_start IS '考试开始时间（实际举行时间）';
COMMENT ON COLUMN exams.exam_end IS '考试结束时间（实际举行时间）';

