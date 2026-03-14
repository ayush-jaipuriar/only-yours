-- Phase H: Couple custom questions and custom game deck metadata.

ALTER TABLE questions
ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES couples(id);

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id);

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS source_type VARCHAR(32);

UPDATE questions
SET source_type = COALESCE(source_type, 'STANDARD');

ALTER TABLE questions
ALTER COLUMN source_type SET NOT NULL;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS archived BOOLEAN;

UPDATE questions
SET archived = COALESCE(archived, FALSE);

ALTER TABLE questions
ALTER COLUMN archived SET NOT NULL;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

UPDATE questions
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP);

ALTER TABLE questions
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

UPDATE questions
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);

ALTER TABLE questions
ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS deck_type VARCHAR(32);

UPDATE game_sessions
SET deck_type = COALESCE(deck_type, 'STANDARD_CATEGORY');

ALTER TABLE game_sessions
ALTER COLUMN deck_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_custom_couple_active
ON questions (couple_id, source_type, archived);

CREATE INDEX IF NOT EXISTS idx_questions_custom_created_by_active
ON questions (created_by_user_id, source_type, archived, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_deck_type
ON game_sessions (deck_type);

COMMENT ON COLUMN questions.couple_id IS 'Couple owner for custom couple questions';
COMMENT ON COLUMN questions.created_by_user_id IS 'Original author of a custom couple question';
COMMENT ON COLUMN questions.source_type IS 'Question source: STANDARD or CUSTOM_COUPLE';
COMMENT ON COLUMN questions.archived IS 'Whether the question is hidden from future gameplay and author management';
COMMENT ON COLUMN questions.created_at IS 'When the question row was created';
COMMENT ON COLUMN questions.updated_at IS 'When the question row was last updated';
COMMENT ON COLUMN game_sessions.deck_type IS 'Game deck source: STANDARD_CATEGORY or CUSTOM_COUPLE';
