-- Phase D: Notification preference persistence.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS timezone VARCHAR(80);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reminder_time_local VARCHAR(5);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS quiet_hours_start VARCHAR(5);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS quiet_hours_end VARCHAR(5);

UPDATE users
SET timezone = COALESCE(NULLIF(timezone, ''), 'UTC');

UPDATE users
SET reminder_time_local = COALESCE(NULLIF(reminder_time_local, ''), '21:00');

UPDATE users
SET quiet_hours_start = COALESCE(NULLIF(quiet_hours_start, ''), '23:00');

UPDATE users
SET quiet_hours_end = COALESCE(NULLIF(quiet_hours_end, ''), '07:00');

ALTER TABLE users
ALTER COLUMN timezone SET NOT NULL;

ALTER TABLE users
ALTER COLUMN reminder_time_local SET NOT NULL;

ALTER TABLE users
ALTER COLUMN quiet_hours_start SET NOT NULL;

ALTER TABLE users
ALTER COLUMN quiet_hours_end SET NOT NULL;

COMMENT ON COLUMN users.timezone IS 'IANA timezone used for reminder scheduling (e.g. Asia/Kolkata)';
COMMENT ON COLUMN users.reminder_time_local IS 'Local reminder time in HH:mm format';
COMMENT ON COLUMN users.quiet_hours_start IS 'Quiet-hours start time in HH:mm format';
COMMENT ON COLUMN users.quiet_hours_end IS 'Quiet-hours end time in HH:mm format';
