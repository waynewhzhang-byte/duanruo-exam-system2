-- 创建支付相关表
-- 此脚本将在每个租户的Schema中执行

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    out_trade_no VARCHAR(64) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    channel VARCHAR(20) NOT NULL,  -- WECHAT, ALIPAY
    status VARCHAR(20) NOT NULL,   -- PENDING, PAID, FAILED, CANCELLED, REFUNDED
    transaction_id VARCHAR(128),
    payment_params TEXT,
    callback_data TEXT,
    failure_reason VARCHAR(500),
    paid_at TIMESTAMP,
    expired_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_orders_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_out_trade_no ON payment_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_payment_orders_application_id ON payment_orders(application_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_transaction_id ON payment_orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);

