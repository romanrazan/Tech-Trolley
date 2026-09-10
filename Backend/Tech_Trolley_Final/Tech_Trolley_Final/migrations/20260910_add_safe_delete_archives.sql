-- Add non-destructive archive timestamps for referenced master records.
-- Existing rows remain active because all new values default to NULL.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '10min';

ALTER TABLE product
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz NULL;
ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz NULL;
ALTER TABLE supplier
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz NULL;
ALTER TABLE account
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz NULL;

CREATE INDEX IF NOT EXISTS "IDX_product_active_name"
  ON product (name) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "IDX_customer_active_name"
  ON customer (name) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "IDX_supplier_active_name"
  ON supplier (name) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "IDX_account_active_name"
  ON account (name) WHERE "deletedAt" IS NULL;

COMMIT;
