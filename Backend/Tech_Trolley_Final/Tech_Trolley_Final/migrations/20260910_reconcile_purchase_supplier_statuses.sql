-- Tech Trolley: payment-derived Purchase statuses and pending Supplier lifecycle.
-- Run with psql against the configured database after taking a backup.
-- Enum values are added before BEGIN because PostgreSQL requires newly added
-- enum values to be committed before they are used by the reconciliation.

ALTER TYPE purchase_status_enum
  ADD VALUE IF NOT EXISTS 'IN_PROGRESS' BEFORE 'CONFIRMED';
ALTER TYPE purchase_status_enum
  ADD VALUE IF NOT EXISTS 'INCOMPLETE' BEFORE 'CONFIRMED';
ALTER TYPE purchase_status_enum
  ADD VALUE IF NOT EXISTS 'COMPLETED' BEFORE 'CANCELLED';

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '10min';

DO $$
BEGIN
  IF to_regclass('public.purchase') IS NULL
     OR to_regclass('public.purchase_payment') IS NULL
     OR to_regclass('public.supplier') IS NULL THEN
    RAISE EXCEPTION
      'required purchase, purchase_payment, or supplier table is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'supplier'
      AND column_name = 'isActive'
  ) THEN
    RAISE EXCEPTION
      'supplier.isActive already exists; migration was already applied or the wrong database is selected';
  END IF;

  IF EXISTS (
    SELECT phone FROM supplier GROUP BY phone HAVING COUNT(*) > 1
  ) OR EXISTS (
    SELECT email FROM supplier GROUP BY email HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'duplicate supplier phone or email values must be resolved before applying unique indexes';
  END IF;

  IF EXISTS (
    SELECT "purchaseId", "transactionId"
    FROM purchase_payment
    WHERE "transactionId" IS NOT NULL
    GROUP BY "purchaseId", "transactionId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'duplicate purchase payment transaction IDs must be resolved before applying the idempotency index';
  END IF;
END
$$;

LOCK TABLE purchase, purchase_payment, supplier IN ACCESS EXCLUSIVE MODE;

ALTER TABLE supplier
  ADD COLUMN "isActive" boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "UQ_supplier_phone" ON supplier (phone);
CREATE UNIQUE INDEX "UQ_supplier_email" ON supplier (email);
CREATE UNIQUE INDEX "UQ_purchase_payment_transaction"
  ON purchase_payment ("purchaseId", "transactionId")
  WHERE "transactionId" IS NOT NULL;

DO $$
DECLARE
  overpaid_count integer;
BEGIN
  SELECT COUNT(*)
  INTO overpaid_count
  FROM (
    SELECT purchase.id
    FROM purchase
    JOIN purchase_payment
      ON purchase_payment."purchaseId" = purchase.id
    WHERE purchase.status <> 'CANCELLED'
    GROUP BY purchase.id, purchase.total
    HAVING ROUND(SUM(purchase_payment.amount), 2) > ROUND(purchase.total, 2)
  ) overpaid_purchases;

  IF overpaid_count > 0 THEN
    RAISE WARNING
      '% historical purchase(s) are overpaid; payments are preserved, status is COMPLETED, and displayed due is clamped to zero',
      overpaid_count;
  END IF;
END
$$;

WITH payment_totals AS (
  SELECT
    purchase.id,
    COALESCE(ROUND(SUM(purchase_payment.amount), 2), 0) AS paid
  FROM purchase
  LEFT JOIN purchase_payment
    ON purchase_payment."purchaseId" = purchase.id
  GROUP BY purchase.id
)
UPDATE purchase
SET status = CASE
  WHEN payment_totals.paid = 0
    THEN 'IN_PROGRESS'::purchase_status_enum
  WHEN payment_totals.paid < ROUND(purchase.total, 2)
    THEN 'INCOMPLETE'::purchase_status_enum
  ELSE 'COMPLETED'::purchase_status_enum
END
FROM payment_totals
WHERE purchase.id = payment_totals.id
  AND purchase.status <> 'CANCELLED';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM purchase
    LEFT JOIN (
      SELECT "purchaseId", ROUND(SUM(amount), 2) AS paid
      FROM purchase_payment
      GROUP BY "purchaseId"
    ) payment_totals ON payment_totals."purchaseId" = purchase.id
    WHERE purchase.status <> 'CANCELLED'
      AND purchase.status <> CASE
        WHEN COALESCE(payment_totals.paid, 0) = 0
          THEN 'IN_PROGRESS'::purchase_status_enum
        WHEN payment_totals.paid < ROUND(purchase.total, 2)
          THEN 'INCOMPLETE'::purchase_status_enum
        ELSE 'COMPLETED'::purchase_status_enum
      END
  ) THEN
    RAISE EXCEPTION 'purchase status reconciliation verification failed';
  END IF;
END
$$;

SELECT status, COUNT(*) AS purchase_count
FROM purchase
GROUP BY status
ORDER BY status;

COMMIT;
