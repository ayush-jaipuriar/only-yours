-- V5__Email_Auth_Foundation.sql
-- Phase 1 Auth Migration: Evolve schema from Google-only to multi-provider auth
--
-- Changes:
--   1. Add username, password_hash, auth_provider columns to users table
--   2. Make google_user_id nullable (email/password users won't have one)
--   3. Create refresh_tokens table for persistent mobile sessions
--   4. Create password_reset_tokens table for forgot-password flow

-- 1. Evolve users table for multi-provider support
ALTER TABLE users ADD COLUMN username VARCHAR(100);
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'GOOGLE';
ALTER TABLE users ALTER COLUMN google_user_id DROP NOT NULL;

ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);

-- 2. Refresh tokens table
-- Stores hashed refresh tokens for mobile session persistence.
-- token_hash uses SHA-256 (deterministic) so we can look up by hash directly.
-- revoked_at is set when the token is rotated or the user logs out.
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- 3. Password reset tokens table
-- Stores hashed one-time-use reset tokens.
-- used_at is set when the token is consumed to prevent replay.
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
