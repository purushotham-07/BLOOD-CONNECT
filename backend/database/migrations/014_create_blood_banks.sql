-- Migration 014: Create verified blood banks table with PostGIS spatial indexing

CREATE TABLE IF NOT EXISTS blood_banks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    VARCHAR(255) NOT NULL,
  address                 TEXT NOT NULL,
  phone                   VARCHAR(50),
  operating_hours         VARCHAR(100) DEFAULT '24/7 Emergency Service',
  location                GEOGRAPHY(Point, 4326) NOT NULL,
  has_component_facility  BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blood_banks_location
  ON blood_banks USING GIST (location);
