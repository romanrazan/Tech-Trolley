-- Tech Trolley: derive Sale status from successful payment history and add the
-- customer activation flag used by pending inline customers.
--
-- PostgreSQL enum values must be committed before they can be used by the data
-- reconciliation transaction, so these idempotent enum additions intentionally
-- precede BEGIN. All table/data changes remain atomic. Historical overpayments
-- are preserved and classified as COMPLETED; application due calculations clamp
-- them to zero, while the audit result below keeps the anomaly visible.

ALTER TYPE sale_status_enum
  ADD VALUE IF NOT EXISTS 'IN_PROGRESS' BEFORE 'COMPLETED';
ALTER TYPE sale_status_enum
  ADD VALUE IF NOT EXISTS 'INCOMPLETE' BEFORE 'COMPLETED';

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '10min';

DO $$
BEGIN
  IF to_regclass('public.sale') IS NULL
     OR to_regclass('public.sale_payment') IS NULL
     OR to_regclass('public.customer') IS NULL THEN
    RAISE EXCEPTION 'required sale, sale_payment, or customer table is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customer'
      AND column_name = 'isActive'
  ) THEN
    RAISE EXCEPTION
      'customer.isActive already exists; migration was already applied or the wrong database is selected';
  END IF;
END
$$;

LOCK TABLE sale, sale_payment, customer IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  overpaid_count integer;
BEGIN
  SELECT COUNT(*)
  INTO overpaid_count
  FROM (
    SELECT sale.id
    FROM sale
    JOIN sale_payment ON sale_payment."saleId" = sale.id
    WHERE sale.status <> 'RETURNED'
    GROUP BY sale.id, sale.total
    HAVING ROUND(SUM(sale_payment.amount), 2) > ROUND(sale.total, 2)
  ) overpaid_sales;

  IF overpaid_count > 0 THEN
    RAISE WARNING
      '% historical sale(s) are overpaid; payments are preserved, status is COMPLETED, and displayed due is clamped to zero',
      overpaid_count;
  END IF;
END
$$;

ALTER TABLE customer
  ADD COLUMN "isActive" boolean NOT NULL DEFAULT true;

WITH payment_totals AS (
  SELECT
    sale.id,
    COALESCE(ROUND(SUM(sale_payment.amount), 2), 0) AS paid
  FROM sale
  LEFT JOIN sale_payment ON sale_payment."saleId" = sale.id
  GROUP BY sale.id
)
UPDATE sale
SET status = CASE
  WHEN payment_totals.paid = 0
    THEN 'IN_PROGRESS'::sale_status_enum
  WHEN payment_totals.paid < ROUND(sale.total, 2)
    THEN 'INCOMPLETE'::sale_status_enum
  ELSE 'COMPLETED'::sale_status_enum
END
FROM payment_totals
WHERE sale.id = payment_totals.id
  AND sale.status <> 'RETURNED';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM sale
    LEFT JOIN (
      SELECT "saleId", ROUND(SUM(amount), 2) AS paid
      FROM sale_payment
      GROUP BY "saleId"
    ) payment_totals ON payment_totals."saleId" = sale.id
    WHERE sale.status <> 'RETURNED'
      AND sale.status <> CASE
        WHEN COALESCE(payment_totals.paid, 0) = 0
          THEN 'IN_PROGRESS'::sale_status_enum
        WHEN payment_totals.paid < ROUND(sale.total, 2)
          THEN 'INCOMPLETE'::sale_status_enum
        ELSE 'COMPLETED'::sale_status_enum
      END
  ) THEN
    RAISE EXCEPTION 'sale status reconciliation verification failed';
  END IF;
END
$$;

SELECT status, COUNT(*) AS sale_count
FROM sale
GROUP BY status
ORDER BY status;

SELECT
  sale.id,
  sale."invoiceNumber",
  sale.total,
  ROUND(SUM(sale_payment.amount), 2) AS total_paid,
  GREATEST(ROUND(sale.total - SUM(sale_payment.amount), 2), 0) AS displayed_due
FROM sale
JOIN sale_payment ON sale_payment."saleId" = sale.id
WHERE sale.status <> 'RETURNED'
GROUP BY sale.id
HAVING ROUND(SUM(sale_payment.amount), 2) > ROUND(sale.total, 2)
ORDER BY sale."invoiceNumber";

COMMIT;
