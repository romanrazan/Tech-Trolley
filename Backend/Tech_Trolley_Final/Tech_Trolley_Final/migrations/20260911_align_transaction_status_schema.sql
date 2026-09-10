-- Align transaction status enum/default metadata with the current entities.
-- No business row values are changed. Unexpected legacy Purchase statuses abort
-- the transaction before the enum type is replaced.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '2min';

DO $$
BEGIN
  IF to_regclass('public.purchase') IS NULL
     OR to_regclass('public.sale') IS NULL THEN
    RAISE EXCEPTION 'Required purchase or sale table does not exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.purchase
    WHERE status::text NOT IN (
      'IN_PROGRESS', 'INCOMPLETE', 'COMPLETED', 'CANCELLED'
    )
  ) THEN
    RAISE EXCEPTION
      'Purchase contains a legacy status; run the status reconciliation migration first';
  END IF;
END
$$;

ALTER TABLE public.purchase ALTER COLUMN status DROP DEFAULT;
ALTER TYPE public.purchase_status_enum RENAME TO purchase_status_enum_legacy;
CREATE TYPE public.purchase_status_enum AS ENUM (
  'IN_PROGRESS',
  'INCOMPLETE',
  'COMPLETED',
  'CANCELLED'
);
ALTER TABLE public.purchase
  ALTER COLUMN status TYPE public.purchase_status_enum
  USING status::text::public.purchase_status_enum;
ALTER TABLE public.purchase
  ALTER COLUMN status SET DEFAULT 'IN_PROGRESS'::public.purchase_status_enum;
DROP TYPE public.purchase_status_enum_legacy;

ALTER TABLE public.sale
  ALTER COLUMN status SET DEFAULT 'IN_PROGRESS'::public.sale_status_enum;

COMMIT;
