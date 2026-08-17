-- Migration 014: Create donation camps and attendees with PostGIS spatial indexing

CREATE TABLE IF NOT EXISTS donation_camps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  organizer_name  VARCHAR(255) NOT NULL,
  contact_phone   VARCHAR(50) NOT NULL,
  camp_date       DATE NOT NULL,
  start_time      VARCHAR(20) NOT NULL,
  end_time        VARCHAR(20) NOT NULL,
  target_donors   INT NOT NULL DEFAULT 50,
  venue_name      VARCHAR(255) NOT NULL,
  venue_address   TEXT NOT NULL,
  location        GEOGRAPHY(Point, 4326) NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donation_camps_location
  ON donation_camps USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_donation_camps_date
  ON donation_camps (camp_date);

CREATE TABLE IF NOT EXISTS camp_attendees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id     UUID NOT NULL REFERENCES donation_camps(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_group VARCHAR(20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (camp_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_camp_attendees_camp
  ON camp_attendees (camp_id);
