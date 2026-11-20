-- Proposals v2: chosen option on signatures, acceptance, invoices, settings, discovery.
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS option_id text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE TABLE IF NOT EXISTS invoice_counters (
  year integer PRIMARY KEY,
  last integer NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id        uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  number             text NOT NULL UNIQUE,
  token              text NOT NULL UNIQUE,
  kind               text NOT NULL CHECK (kind IN ('deposit','balance')),
  amount_minor       bigint NOT NULL CHECK (amount_minor >= 0),
  currency           text NOT NULL,
  status             text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','void')),
  issued_at          timestamptz NOT NULL DEFAULT now(),
  due_at             timestamptz NOT NULL,
  paid_at            timestamptz,
  paid_via           text CHECK (paid_via IN ('paystack','transfer')),
  paystack_reference text UNIQUE,
  details            jsonb NOT NULL,
  UNIQUE (proposal_id, kind)
);
CREATE INDEX IF NOT EXISTS invoices_proposal_idx ON invoices (proposal_id);

CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discoveries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business    text NOT NULL DEFAULT '',
  notes       jsonb NOT NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
