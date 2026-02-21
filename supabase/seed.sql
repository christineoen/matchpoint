-- Seed data for clubs

INSERT INTO clubs (name, description, location) VALUES
  ('Riverside Tennis Club', 'Premier tennis club with grass and hard courts', 'Riverside, CA'),
  ('Mountain View Tennis', 'Community tennis club in the mountains', 'Mountain View, CA'),
  ('Coastal Tennis Association', 'Beachside tennis with ocean views', 'Santa Monica, CA')
ON CONFLICT DO NOTHING;
