-- Phase D: Profile expansion (editable bio).

ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio VARCHAR(280);

COMMENT ON COLUMN users.bio IS 'Short profile bio shown in app profile views';
