ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Existing customers are considered verified (signed up before this feature)
UPDATE customers SET email_verified = true WHERE email_verified = false;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
