-- V017: 创建通知模板表
-- 用于存储邮件、短信、站内信等通知模板

-- 创建通知模板表
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_APP')),
    subject VARCHAR(500),
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    variables JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notification_templates_code ON notification_templates(code);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel);
CREATE INDEX IF NOT EXISTS idx_notification_templates_status ON notification_templates(status);

-- 添加注释
COMMENT ON TABLE notification_templates IS '通知模板表';
COMMENT ON COLUMN notification_templates.id IS '模板ID';
COMMENT ON COLUMN notification_templates.code IS '模板代码（唯一标识）';
COMMENT ON COLUMN notification_templates.name IS '模板名称';
COMMENT ON COLUMN notification_templates.channel IS '通知渠道（EMAIL/SMS/IN_APP）';
COMMENT ON COLUMN notification_templates.subject IS '主题（邮件用）';
COMMENT ON COLUMN notification_templates.content IS '内容模板';
COMMENT ON COLUMN notification_templates.status IS '模板状态（ACTIVE/INACTIVE）';
COMMENT ON COLUMN notification_templates.variables IS '变量说明（JSON格式）';
COMMENT ON COLUMN notification_templates.created_at IS '创建时间';
COMMENT ON COLUMN notification_templates.updated_at IS '更新时间';
COMMENT ON COLUMN notification_templates.created_by IS '创建人';
COMMENT ON COLUMN notification_templates.updated_by IS '更新人';

-- 插入默认模板
INSERT INTO notification_templates (id, code, name, channel, subject, content, status, variables, created_at, updated_at, created_by, updated_by)
VALUES
    -- 报名提交成功通知
    (gen_random_uuid(), 'APPLICATION_SUBMITTED', '报名提交成功通知', 'EMAIL', 
     '【考试报名】报名提交成功', 
     '尊敬的考生：

您好！您的考试报名已成功提交。

报名编号：${applicationId}
考试名称：${examTitle}
报考岗位：${positionTitle}

我们将在1-3个工作日内完成审核，请耐心等待。您可以登录系统查看审核进度。

祝您考试顺利！

此邮件由系统自动发送，请勿回复。',
     'ACTIVE', 
     '{"applicationId": "报名ID", "examTitle": "考试名称", "positionTitle": "岗位名称"}'::jsonb,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),

    -- 审核通过通知
    (gen_random_uuid(), 'AUTO_REVIEW_APPROVED', '审核通过通知', 'EMAIL',
     '【考试报名】审核通过',
     '尊敬的考生：

恭喜您！您的考试报名已通过审核。

报名编号：${applicationId}
审核结果：通过

请尽快完成缴费，缴费成功后即可下载准考证。

祝您考试顺利！

此邮件由系统自动发送，请勿回复。',
     'ACTIVE',
     '{"applicationId": "报名ID", "result": "审核结果"}'::jsonb,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),

    -- 审核拒绝通知
    (gen_random_uuid(), 'AUTO_REVIEW_REJECTED', '审核拒绝通知', 'EMAIL',
     '【考试报名】审核未通过',
     '尊敬的考生：

很抱歉，您的考试报名未通过审核。

报名编号：${applicationId}
审核结果：未通过
拒绝原因：${reason}

如有疑问，请联系我们。

此邮件由系统自动发送，请勿回复。',
     'ACTIVE',
     '{"applicationId": "报名ID", "result": "审核结果", "reason": "拒绝原因"}'::jsonb,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),

    -- 准考证生成通知
    (gen_random_uuid(), 'TICKET_ISSUED', '准考证生成通知', 'EMAIL',
     '【考试报名】准考证已生成',
     '尊敬的考生：

您的准考证已生成，请登录系统下载并打印。

报名编号：${applicationId}
准考证号：${ticketNo}

请妥善保管准考证，考试当天携带准考证和身份证参加考试。

祝您考试顺利！

此邮件由系统自动发送，请勿回复。',
     'ACTIVE',
     '{"applicationId": "报名ID", "ticketNo": "准考证号"}'::jsonb,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),

    -- 支付成功通知
    (gen_random_uuid(), 'PAYMENT_SUCCESS', '支付成功通知', 'SMS',
     NULL,
     '【考试报名】您的报名费用已支付成功，金额${amount}元。准考证将在考试前7天开放下载。',
     'ACTIVE',
     '{"amount": "支付金额"}'::jsonb,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),

    -- 考试提醒通知
    (gen_random_uuid(), 'EXAM_REMINDER', '考试提醒通知', 'SMS',
     NULL,
     '【考试提醒】您报名的${examTitle}将于${examDate}举行，请提前准备好准考证和身份证。考场地址：${venueAddress}',
     'ACTIVE',
     '{"examTitle": "考试名称", "examDate": "考试日期", "venueAddress": "考场地址"}'::jsonb,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM');

