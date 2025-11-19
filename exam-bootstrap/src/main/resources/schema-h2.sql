-- H2 compatibility for PostgreSQL JSONB columns used in entities
CREATE DOMAIN IF NOT EXISTS JSONB AS TEXT;

