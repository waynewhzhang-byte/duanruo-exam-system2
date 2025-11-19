-- 租户Schema业务表创建脚本
-- 此脚本将在每个租户的Schema中执行

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 考试表
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    announcement TEXT,
    registration_start TIMESTAMP,
    registration_end TIMESTAMP,
    fee_required BOOLEAN DEFAULT FALSE,
    fee_amount DECIMAL(10,2),
    ticket_template TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 岗位表
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    quota INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, code)
);

-- 科目表
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    duration INTEGER,
    type VARCHAR(50),
    max_score DECIMAL(10,2),
    passing_score DECIMAL(10,2),
    weight DECIMAL(5,2),
    ordering INTEGER,
    schedule TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 报名申请表
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id),
    position_id UUID NOT NULL REFERENCES positions(id),
    candidate_id UUID NOT NULL,
    form_version INTEGER DEFAULT 1,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    submitted_at TIMESTAMP,
    payment_status VARCHAR(50),
    payment_amount DECIMAL(10,2),
    payment_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审核记录表
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    stage VARCHAR(50) NOT NULL,
    reviewer_id UUID NOT NULL,
    decision VARCHAR(50),
    comment TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 准考证表
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    ticket_no VARCHAR(100) NOT NULL,
    exam_id UUID NOT NULL REFERENCES exams(id),
    candidate_id UUID NOT NULL,
    position_id UUID NOT NULL REFERENCES positions(id),
    status VARCHAR(50) DEFAULT 'ACTIVE',

    -- 考生信息（冗余）
    candidate_name VARCHAR(100),
    candidate_id_number VARCHAR(50),
    candidate_photo VARCHAR(500),

    -- 考试信息（冗余）
    exam_title VARCHAR(200),
    position_title VARCHAR(200),
    exam_start_time TIMESTAMP,
    exam_end_time TIMESTAMP,

    -- 考场信息
    venue_name VARCHAR(200),
    room_number VARCHAR(50),
    seat_number VARCHAR(50),

    -- 二维码和条形码
    qr_code TEXT,
    barcode VARCHAR(100),

    -- 时间戳
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    printed_at TIMESTAMP,
    verified_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB
);

-- 成绩表
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    score DECIMAL(10,2),
    status VARCHAR(50),
    recorded_by UUID,
    recorded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id),
    file_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    field_key VARCHAR(100),
    status VARCHAR(50) DEFAULT 'UPLOADED',
    virus_scan_status VARCHAR(50) DEFAULT 'PENDING',
    virus_scan_result TEXT,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exams_code ON exams(code);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_positions_exam_id ON positions(exam_id);
CREATE INDEX IF NOT EXISTS idx_subjects_position_id ON subjects(position_id);
CREATE INDEX IF NOT EXISTS idx_applications_exam_id ON applications(exam_id);
CREATE INDEX IF NOT EXISTS idx_applications_position_id ON applications(position_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_reviews_application_id ON reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_application_id ON tickets(application_id);
CREATE INDEX IF NOT EXISTS idx_tickets_candidate_id ON tickets(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scores_application_id ON scores(application_id);
CREATE INDEX IF NOT EXISTS idx_scores_subject_id ON scores(subject_id);
CREATE INDEX IF NOT EXISTS idx_files_application_id ON files(application_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE exams IS '考试表';
COMMENT ON TABLE positions IS '岗位表';
COMMENT ON TABLE subjects IS '科目表';
COMMENT ON TABLE applications IS '报名申请表';
COMMENT ON TABLE reviews IS '审核记录表';
COMMENT ON TABLE tickets IS '准考证表';
COMMENT ON TABLE scores IS '成绩表';
COMMENT ON TABLE files IS '文件表';

