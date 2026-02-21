-- Sprint 4: Add game flow tracking fields to game_sessions table

-- Add category tracking
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Add question selection tracking
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS question_ids VARCHAR(500);

-- Add progress tracking
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;

-- Add timestamp tracking
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;

ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN game_sessions.category_id IS 'Question category selected for this game';
COMMENT ON COLUMN game_sessions.question_ids IS 'Comma-separated list of question IDs (e.g., "12,45,67,89")';
COMMENT ON COLUMN game_sessions.current_question_index IS 'Zero-based index of current question (0-7 for 8-question game)';
COMMENT ON COLUMN game_sessions.created_at IS 'When invitation was sent';
COMMENT ON COLUMN game_sessions.started_at IS 'When game began (invitation accepted)';
COMMENT ON COLUMN game_sessions.completed_at IS 'When game finished';
