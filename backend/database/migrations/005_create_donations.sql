CREATE TABLE IF NOT EXISTS donations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id       UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
  donation_date  DATE NOT NULL,
  component      VARCHAR(30) NOT NULL DEFAULT 'WHOLE_BLOOD'
                 CHECK (component IN ('WHOLE_BLOOD', 'RED_CELLS', 'PLASMA', 'PLATELETS')),
  verified       BOOLEAN NOT NULL DEFAULT false,
  verified_by    UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);