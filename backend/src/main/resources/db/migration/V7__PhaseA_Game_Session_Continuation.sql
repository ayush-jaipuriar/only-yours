-- Phase A: Session continuation hardening
-- Adds expiry metadata and enforces one active session per couple.

ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Backfill created_at if missing on legacy rows.
UPDATE game_sessions
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP);

-- Backfill activity timestamps for observability.
UPDATE game_sessions
SET last_activity_at = COALESCE(last_activity_at, completed_at, started_at, created_at, CURRENT_TIMESTAMP);

-- Active sessions expire seven days after creation.
UPDATE game_sessions
SET expires_at = COALESCE(expires_at, created_at + INTERVAL '7 days')
WHERE status IN ('INVITED', 'ROUND1', 'ROUND2');

-- Terminal sessions keep a stable expiry reference for historical consistency.
UPDATE game_sessions
SET expires_at = COALESCE(expires_at, completed_at, CURRENT_TIMESTAMP)
WHERE status NOT IN ('INVITED', 'ROUND1', 'ROUND2');

COMMENT ON COLUMN game_sessions.expires_at IS 'Automatic expiry timestamp for session continuation (7 day TTL for active sessions)';
COMMENT ON COLUMN game_sessions.last_activity_at IS 'Last observed session activity timestamp';

-- Hard guard: exactly one active session per couple.
CREATE UNIQUE INDEX IF NOT EXISTS uk_game_sessions_one_active_per_couple
ON game_sessions (couple_id)
WHERE status IN ('INVITED', 'ROUND1', 'ROUND2');
