-- Phase J: Progression snapshots and idempotent XP event ledger.

CREATE TABLE IF NOT EXISTS user_progressions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    xp BIGINT NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    games_completed INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    correct_guesses INTEGER NOT NULL DEFAULT 0,
    answer_all_games INTEGER NOT NULL DEFAULT 0,
    daily_login_days INTEGER NOT NULL DEFAULT 0,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_active_on DATE,
    last_daily_login_on DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couple_progressions (
    id UUID PRIMARY KEY,
    couple_id UUID NOT NULL UNIQUE REFERENCES couples(id),
    xp BIGINT NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    games_completed INTEGER NOT NULL DEFAULT 0,
    total_combined_score INTEGER NOT NULL DEFAULT 0,
    best_combined_score INTEGER NOT NULL DEFAULT 0,
    responded_invitations INTEGER NOT NULL DEFAULT 0,
    accepted_invitations INTEGER NOT NULL DEFAULT 0,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    last_active_on DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progression_events (
    id UUID PRIMARY KEY,
    scope_type VARCHAR(16) NOT NULL,
    scope_ref_id UUID NOT NULL,
    event_type VARCHAR(48) NOT NULL,
    event_key VARCHAR(160) NOT NULL,
    reference_code VARCHAR(80),
    xp_delta BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_progression_events_scope_event UNIQUE (scope_type, scope_ref_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_progression_events_scope_type_ref
ON progression_events (scope_type, scope_ref_id, event_type, created_at DESC);
