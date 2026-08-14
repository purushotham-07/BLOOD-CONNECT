CREATE TABLE IF NOT EXISTS donor_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id        UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL DEFAULT 'NOTIFIED'
                  CHECK (status IN ('NOTIFIED', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A donor can respond to a requested blood request only once.
  UNIQUE (blood_request_id, donor_id)
);