-- Spatial and supporting indexes.

-- GiST index on donor locations enables fast PostGIS radius/distance queries.
CREATE INDEX IF NOT EXISTS idx_donor_profiles_location
  ON donor_profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_blood_group
  ON donor_profiles (blood_group);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_available
  ON donor_profiles (available);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_verified
  ON donor_profiles (verified);

-- GiST index on blood request locations.
CREATE INDEX IF NOT EXISTS idx_blood_requests_location
  ON blood_requests USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status
  ON blood_requests (status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester
  ON blood_requests (requester_id);

CREATE INDEX IF NOT EXISTS idx_donations_donor
  ON donations (donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_responses_request
  ON donor_responses (blood_request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, status);