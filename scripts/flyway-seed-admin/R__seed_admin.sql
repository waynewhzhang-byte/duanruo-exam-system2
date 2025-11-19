-- One-off repeatable seed for dev to ensure admin exists with specified password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (
    id, username, email, password_hash, full_name, roles, email_verified, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'admin',
    'admin@duanruo.com',
    crypt('admin123@Abc', gen_salt('bf')),
    '', -- placeholder will be replaced below if needed
    '["ADMIN","SUPER_ADMIN"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    roles = EXCLUDED.roles,
    email_verified = EXCLUDED.email_verified,
    updated_at = CURRENT_TIMESTAMP;

