-- Track fulfilled units so the backend (not the frontend) can compute request
-- fulfillment state and prevent over-acceptance under concurrency.
ALTER TABLE blood_requests
  ADD COLUMN IF NOT EXISTS units_fulfilled INTEGER NOT NULL DEFAULT 0
  CHECK (units_fulfilled >= 0 AND units_fulfilled <= units_required);