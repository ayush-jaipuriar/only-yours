-- Phase D: Couple lifecycle metadata for unlink/cooldown/recovery.

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS status VARCHAR(20);

UPDATE couples
SET status = CASE
    WHEN user2_id IS NULL THEN 'PENDING'
    ELSE 'ACTIVE'
END
WHERE status IS NULL;

ALTER TABLE couples
ALTER COLUMN status SET NOT NULL;

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

UPDATE couples
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP);

ALTER TABLE couples
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP;

UPDATE couples
SET linked_at = COALESCE(linked_at, created_at)
WHERE status = 'ACTIVE';

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS unlinked_at TIMESTAMP;

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS cooldown_ends_at TIMESTAMP;

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS unlinked_by_user_id UUID REFERENCES users(id);

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS unlink_reason VARCHAR(280);

CREATE INDEX IF NOT EXISTS idx_couples_status
ON couples (status);

CREATE INDEX IF NOT EXISTS idx_couples_user1_status_created
ON couples (user1_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_couples_user2_status_created
ON couples (user2_id, status, created_at DESC);

COMMENT ON COLUMN couples.status IS 'Couple lifecycle status: PENDING, ACTIVE, UNLINKED';
COMMENT ON COLUMN couples.created_at IS 'When this couple record was created';
COMMENT ON COLUMN couples.linked_at IS 'When this couple became ACTIVE';
COMMENT ON COLUMN couples.unlinked_at IS 'When this couple was unlinked';
COMMENT ON COLUMN couples.cooldown_ends_at IS 'When unlink cooldown ends';
COMMENT ON COLUMN couples.unlinked_by_user_id IS 'User who initiated unlink action';
COMMENT ON COLUMN couples.unlink_reason IS 'Optional user-provided unlink reason';
