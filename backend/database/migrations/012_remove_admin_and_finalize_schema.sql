-- Migration 012: Remove admin layer and finalize donor-receiver matching schema

-- 1. Update any existing ADMIN users to REQUESTER before applying new check constraint
UPDATE users SET role = 'REQUESTER' WHERE role = 'ADMIN';

-- 2. Update users role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('DONOR', 'REQUESTER'));

-- 3. Update donor_profiles default verified to true (auto-verified upon registration)
ALTER TABLE donor_profiles ALTER COLUMN verified SET DEFAULT true;
UPDATE donor_profiles SET verified = true WHERE verified = false;

-- 4. Clean up any PENDING_VERIFICATION or non-standard requests to MATCHING before constraint
UPDATE blood_requests SET status = 'MATCHING' WHERE status = 'PENDING_VERIFICATION' OR status NOT IN ('ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'EXPIRED', 'CANCELLED');

-- 5. Update blood_requests default status to MATCHING and update status check constraint
ALTER TABLE blood_requests ALTER COLUMN status SET DEFAULT 'MATCHING';
ALTER TABLE blood_requests DROP CONSTRAINT IF EXISTS blood_requests_status_check;
ALTER TABLE blood_requests ADD CONSTRAINT blood_requests_status_check CHECK (
  status IN ('ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'EXPIRED', 'CANCELLED')
);

-- 6. Drop audit_logs table since admin layer is removed
DROP TABLE IF EXISTS audit_logs;

-- 7. Ensure spatial GiST indexes exist
CREATE INDEX IF NOT EXISTS idx_donor_profiles_location ON donor_profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_blood_requests_location ON blood_requests USING GIST (location);
