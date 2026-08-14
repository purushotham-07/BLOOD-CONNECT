CREATE TABLE IF NOT EXISTS blood_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_group      VARCHAR(20) NOT NULL CHECK (blood_group IN (
                     'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
                     'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'
                   )),
  component        VARCHAR(30) NOT NULL CHECK (component IN (
                     'WHOLE_BLOOD', 'RED_CELLS', 'PLASMA', 'PLATELETS'
                   )),
  units_required   INTEGER NOT NULL DEFAULT 1 CHECK (units_required > 0),
  hospital_name    VARCHAR(255) NOT NULL,
  hospital_address VARCHAR(255),
  location         GEOGRAPHY(Point, 4326) NOT NULL,
  urgency          VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
                   CHECK (urgency IN ('NORMAL', 'URGENT', 'CRITICAL')),
  status           VARCHAR(30) NOT NULL DEFAULT 'MATCHING'
                   CHECK (status IN (
                     'ACTIVE', 'MATCHING',
                     'PARTIALLY_FULFILLED', 'FULFILLED', 'EXPIRED', 'CANCELLED'
                   )),
  description      TEXT,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);