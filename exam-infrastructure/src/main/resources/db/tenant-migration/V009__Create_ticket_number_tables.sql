-- 创建准考证号管理相关表
-- 此脚本将在每个租户的Schema中执行

-- 准考证号规则表
CREATE TABLE IF NOT EXISTS ticket_number_rules (
    exam_id UUID PRIMARY KEY,
    custom_prefix VARCHAR(50),
    include_exam_code BOOLEAN NOT NULL DEFAULT TRUE,
    include_position_code BOOLEAN NOT NULL DEFAULT TRUE,
    date_format VARCHAR(20) NOT NULL DEFAULT 'YYYYMMDD',
    sequence_length INTEGER NOT NULL,
    sequence_start INTEGER NOT NULL,
    daily_reset BOOLEAN NOT NULL,
    checksum_type VARCHAR(20) NOT NULL,
    separator VARCHAR(10) NOT NULL DEFAULT '-',
    include_date BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_number_rules_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 准考证号序列表（复合主键）
CREATE TABLE IF NOT EXISTS ticket_sequences (
    exam_id UUID NOT NULL,
    scope VARCHAR(16) NOT NULL,  -- GLOBAL or DAILY
    counter_date DATE NOT NULL,
    current_value BIGINT NOT NULL,
    PRIMARY KEY (exam_id, scope, counter_date),
    CONSTRAINT fk_ticket_sequences_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

