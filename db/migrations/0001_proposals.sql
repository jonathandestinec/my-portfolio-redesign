-- Client proposals. Applied to the Neon project "portfolio-proposals".
CREATE TABLE IF NOT EXISTS proposals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL,
  token         text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','sent','viewed','signed','withdrawn')),
  version       integer NOT NULL DEFAULT 0,
  content       jsonb NOT NULL,
  passcode_hash text,
  expires_at    timestamptz,
  sent_at       timestamptz,
  signed_at     timestamptz,
  withdrawn_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposal_versions (
  proposal_id    uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version        integer NOT NULL,
  snapshot       jsonb NOT NULL,
  content_sha256 text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (proposal_id, version)
);

CREATE TABLE IF NOT EXISTS proposal_views (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version     integer NOT NULL,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  ip_hash     text,
  user_agent  text
);
CREATE INDEX IF NOT EXISTS proposal_views_proposal_idx ON proposal_views (proposal_id, viewed_at DESC);

CREATE TABLE IF NOT EXISTS signatures (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id    uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version        integer NOT NULL,
  role           text NOT NULL CHECK (role IN ('client','provider')),
  name           text NOT NULL,
  email          text NOT NULL,
  title          text,
  method         text NOT NULL CHECK (method IN ('typed','drawn')),
  signature_key  text NOT NULL,
  ip             text,
  user_agent     text,
  signed_at      timestamptz NOT NULL DEFAULT now(),
  content_sha256 text NOT NULL,
  pdf_key        text,
  UNIQUE (proposal_id, version, role)
);
