-- 创建成绩管理相关表
-- 此脚本将在每个租户的Schema中执行

-- 考试成绩表
CREATE TABLE IF NOT EXISTS exam_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    is_absent BOOLEAN NOT NULL DEFAULT FALSE,
    graded_by UUID,
    graded_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_scores_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_scores_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT uq_application_subject UNIQUE (application_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_scores_application_id ON exam_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_exam_scores_subject_id ON exam_scores(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_scores_graded_by ON exam_scores(graded_by);
CREATE INDEX IF NOT EXISTS idx_exam_scores_graded_at ON exam_scores(graded_at);
CREATE INDEX IF NOT EXISTS idx_exam_scores_score ON exam_scores(score);

