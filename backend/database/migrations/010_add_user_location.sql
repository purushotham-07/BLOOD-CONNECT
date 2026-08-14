-- Add a default/search location to users so requesters (and any user) can
-- persist a chosen location in the database (source of truth).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- Spatial index on user location for future nearest-user queries.
CREATE INDEX IF NOT EXISTS idx_users_location
  ON users USING GIST (location);