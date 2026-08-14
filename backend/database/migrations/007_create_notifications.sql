CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_request_id  UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  type              VARCHAR(30) NOT NULL DEFAULT 'NEW_MATCH'
                    CHECK (type IN ('NEW_MATCH', 'RESPONSE_RECEIVED', 'REQUEST_VERIFIED', 'SYSTEM')),
  status            VARCHAR(20) NOT NULL DEFAULT 'UNREAD'
                    CHECK (status IN ('UNREAD', 'READ')),
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);