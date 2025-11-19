-- V018: 创建通知历史表
-- 用于记录所有通知的发送历史和状态

-- 创建通知历史表
CREATE TABLE IF NOT EXISTS notification_histories (
    id UUID PRIMARY KEY,
    template_code VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_APP')),
    recipient VARCHAR(500) NOT NULL,
    recipient_user_id UUID,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SENDING', 'SUCCESS', 'FAILED')),
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notification_histories_recipient_user_id 
    ON notification_histories(recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_notification_histories_template_code 
    ON notification_histories(template_code);

CREATE INDEX IF NOT EXISTS idx_notification_histories_channel 
    ON notification_histories(channel);

CREATE INDEX IF NOT EXISTS idx_notification_histories_status 
    ON notification_histories(status);

CREATE INDEX IF NOT EXISTS idx_notification_histories_created_at 
    ON notification_histories(created_at);

-- 创建复合索引（用于常见查询）
CREATE INDEX IF NOT EXISTS idx_notification_histories_user_status 
    ON notification_histories(recipient_user_id, status);

CREATE INDEX IF NOT EXISTS idx_notification_histories_channel_status 
    ON notification_histories(channel, status);

-- 添加注释
COMMENT ON TABLE notification_histories IS '通知发送历史表';
COMMENT ON COLUMN notification_histories.id IS '主键ID';
COMMENT ON COLUMN notification_histories.template_code IS '模板代码';
COMMENT ON COLUMN notification_histories.channel IS '通知渠道: EMAIL, SMS, IN_APP';
COMMENT ON COLUMN notification_histories.recipient IS '接收人（邮箱/手机号/用户ID）';
COMMENT ON COLUMN notification_histories.recipient_user_id IS '接收人用户ID（可选）';
COMMENT ON COLUMN notification_histories.subject IS '主题（渲染后）';
COMMENT ON COLUMN notification_histories.content IS '内容（渲染后）';
COMMENT ON COLUMN notification_histories.variables IS '变量值（JSONB格式）';
COMMENT ON COLUMN notification_histories.status IS '发送状态: PENDING, SENDING, SUCCESS, FAILED';
COMMENT ON COLUMN notification_histories.error_message IS '错误信息';
COMMENT ON COLUMN notification_histories.sent_at IS '发送时间';
COMMENT ON COLUMN notification_histories.delivered_at IS '送达时间';
COMMENT ON COLUMN notification_histories.retry_count IS '重试次数';
COMMENT ON COLUMN notification_histories.created_at IS '创建时间';

