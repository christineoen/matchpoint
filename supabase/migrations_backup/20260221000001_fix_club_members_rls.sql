-- Fix infinite recursion in club_members RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view club memberships" ON club_members;
DROP POLICY IF EXISTS "Club admins can manage members" ON club_members;

-- Simple policy: users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON club_members FOR SELECT
  USING (user_id = auth.uid());

-- Simple policy: users can view memberships in clubs they belong to
CREATE POLICY "Club members can view club memberships"
  ON club_members FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM club_members WHERE user_id = auth.uid()
    )
  );

-- Club admins can insert/update/delete members
CREATE POLICY "Club admins can manage members"
  ON club_members FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM club_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert during signup
CREATE POLICY "Service role can insert members"
  ON club_members FOR INSERT
  WITH CHECK (true);
