-- Assign existing players with NULL club_id to clubs
-- This is a one-time migration to clean up test data

-- For now, we'll leave them as NULL so they can be manually assigned
-- In the future, players should always have a club_id

-- Update RLS policy to NOT show NULL club_id players
DROP POLICY IF EXISTS "Users can view players in their clubs" ON players;

CREATE POLICY "Users can view players in their clubs"
  ON players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = players.club_id
        AND club_members.user_id = auth.uid()
    )
  );

-- Update the manage policy too
DROP POLICY IF EXISTS "Club members can manage players" ON players;

CREATE POLICY "Club members can manage players"
  ON players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = players.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'organizer')
    )
  );
