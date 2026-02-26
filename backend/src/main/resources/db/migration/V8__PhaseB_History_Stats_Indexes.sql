-- Phase B: Read/query indexes for history and stats endpoints
-- Optimizes completed-game history scans and invitation metrics aggregation.

CREATE INDEX IF NOT EXISTS idx_game_sessions_couple_status_completed_at
ON game_sessions (couple_id, status, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_status_completed_at
ON game_sessions (status, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_couple_created_at
ON game_sessions (couple_id, created_at DESC);
