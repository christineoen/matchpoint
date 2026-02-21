-- Allow authenticated users to create clubs

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Club admins can update their club" ON clubs;

-- Allow any authenticated user to create a club
CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow club admins to update their club
CREATE POLICY "Club admins can update their club"
  ON clubs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = clubs.id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'
    )
  );

-- Allow club admins to delete their club
CREATE POLICY "Club admins can delete their club"
  ON clubs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = clubs.id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'
    )
  );
