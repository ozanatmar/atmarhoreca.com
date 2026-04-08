-- ============================================================
-- Inbox: email threads and messages for returns@ and privacy@
-- ============================================================

CREATE TABLE inbox_threads (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inbox           text NOT NULL CHECK (inbox IN ('returns', 'privacy')),
  contact_email   text NOT NULL,
  contact_name    text,
  subject         text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count    integer NOT NULL DEFAULT 0,
  UNIQUE (inbox, contact_email)
);

CREATE INDEX ON inbox_threads (inbox, last_message_at DESC);

CREATE TABLE inbox_emails (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id    uuid NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  direction    text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_id   text,
  in_reply_to  text,
  from_email   text NOT NULL,
  from_name    text,
  subject      text,
  body_html    text,
  body_text    text,
  attachments  jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON inbox_emails (thread_id, created_at ASC);

-- Private storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', false)
ON CONFLICT (id) DO NOTHING;
