-- Update event status values from 'draft', 'active', 'completed', 'cancelled' 
-- to 'upcoming', 'in_progress', 'completed'

-- First, update existing data
UPDATE events SET status = 'upcoming' WHERE status = 'draft';
UPDATE events SET status = 'in_progress' WHERE status = 'active';
-- 'completed' stays the same
-- Remove 'cancelled' status (or map to 'completed' if needed)
UPDATE events SET status = 'completed' WHERE status = 'cancelled';

-- Drop the old constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add the new constraint with updated values
ALTER TABLE events 
  ADD CONSTRAINT events_status_check 
  CHECK (status IN ('upcoming', 'in_progress', 'completed'));

-- Update the default value
ALTER TABLE events ALTER COLUMN status SET DEFAULT 'upcoming';
