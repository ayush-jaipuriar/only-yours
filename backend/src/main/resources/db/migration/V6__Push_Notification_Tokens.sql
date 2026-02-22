-- V6: Push notification token storage
-- Expo Push tokens are device-specific identifiers used to send push
-- notifications via Expo's push service. Each user can have multiple
-- tokens (one per device).

CREATE TABLE push_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL,
    device_id  VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_push_token UNIQUE (token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
