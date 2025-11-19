-- 创建座位分配相关表
-- 此脚本将在每个租户的Schema中执行

-- 考场表
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    seat_map_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venues_exam_id ON venues(exam_id);

-- 分配批次表
CREATE TABLE IF NOT EXISTS allocation_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    strategy TEXT,
    total_candidates INTEGER DEFAULT 0,
    total_assigned INTEGER DEFAULT 0,
    total_venues INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_alloc_batch_exam ON allocation_batches(exam_id);
CREATE INDEX IF NOT EXISTS idx_alloc_batch_created ON allocation_batches(created_at);

-- 座位分配表
CREATE TABLE IF NOT EXISTS seat_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    position_id UUID NOT NULL,
    application_id UUID NOT NULL,
    venue_id UUID NOT NULL,
    seat_no INTEGER NOT NULL,
    batch_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seat_assign_application UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_seat_assign_exam ON seat_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_seat_assign_batch ON seat_assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_seat_assign_position ON seat_assignments(position_id);
CREATE INDEX IF NOT EXISTS idx_seat_assign_venue ON seat_assignments(venue_id);

