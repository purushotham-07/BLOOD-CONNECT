CREATE TABLE IF NOT EXISTS donor_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  blood_group         VARCHAR(20) NOT NULL CHECK (blood_group IN (
                        'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
                        'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'
                      )),
  location            GEOGRAPHY(Point, 4326),
  available           BOOLEAN NOT NULL DEFAULT true,
  last_donation_date  DATE,
  notification_radius NUMERIC(6,1) NOT NULL DEFAULT 10,
  verified            BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);