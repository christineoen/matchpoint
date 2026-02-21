-- Remove default_club_id from profiles
-- Users will select their club from club_members instead

ALTER TABLE profiles DROP COLUMN IF EXISTS default_club_id;
