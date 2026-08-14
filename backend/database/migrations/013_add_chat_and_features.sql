-- Migration 013: Add real-time coordination chat messages table

CREATE TABLE IF NOT EXISTS chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_request_id  UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  message           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_request
  ON chat_messages (blood_request_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
  ON chat_messages (sender_id);
