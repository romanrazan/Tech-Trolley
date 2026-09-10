-- Tech Trolley: add the canonical available quantity to each product.
--
-- Apply only after 20260908_remove_product_variants.sql. The migration is
-- intentionally single-use and transactional: any failed audit rolls back the
-- schema change and backfill together.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '10min';

DO $$
BEGIN
  IF to_regclass('public.product') IS NULL
     OR to_regclass('public.inventory_unit') IS NULL THEN
    RAISE EXCEPTION 'required product or inventory_unit table is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product'
      AND column_name = 'quantity'
  ) THEN
    RAISE EXCEPTION
      'product.quantity already exists; migration was already applied or the wrong database is selected';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_unit'
      AND column_name = 'productId'
  ) THEN
    RAISE EXCEPTION
      'inventory_unit.productId is missing; apply the product-variant removal migration first';
  END IF;
END
$$;

LOCK TABLE product, inventory_unit IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM inventory_unit
    WHERE quantity < 0
  ) THEN
    RAISE EXCEPTION 'inventory_unit contains a negative quantity';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM inventory_unit unit
    LEFT JOIN product ON product.id = unit."productId"
    WHERE product.id IS NULL
  ) THEN
    RAISE EXCEPTION 'inventory_unit contains an orphaned productId';
  END IF;

  IF EXISTS (
    SELECT unit."productId"
    FROM inventory_unit unit
    JOIN product ON product.id = unit."productId"
    WHERE unit.status = 'IN_STOCK'
    GROUP BY unit."productId"
    HAVING SUM(
      CASE
        WHEN product."trackingType" = 'SERIALIZED' THEN 1
        ELSE unit.quantity
      END
    ) > 2147483647
  ) THEN
    RAISE EXCEPTION 'available inventory exceeds the product.quantity integer range';
  END IF;
END
$$;

ALTER TABLE product
  ADD COLUMN quantity integer NOT NULL DEFAULT 0;

WITH available_stock AS (
  SELECT
    unit."productId",
    SUM(
      CASE
        WHEN product."trackingType" = 'SERIALIZED' THEN 1
        ELSE unit.quantity
      END
    )::integer AS quantity
  FROM inventory_unit unit
  JOIN product ON product.id = unit."productId"
  WHERE unit.status = 'IN_STOCK'
  GROUP BY unit."productId"
)
UPDATE product
SET quantity = available_stock.quantity
FROM available_stock
WHERE product.id = available_stock."productId";

ALTER TABLE product
  ADD CONSTRAINT "CHK_product_quantity_non_negative"
  CHECK (quantity >= 0);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM product
    WHERE quantity < 0
  ) THEN
    RAISE EXCEPTION 'product.quantity contains a negative value after backfill';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM product
    LEFT JOIN (
      SELECT
        unit."productId",
        SUM(
          CASE
            WHEN source_product."trackingType" = 'SERIALIZED' THEN 1
            ELSE unit.quantity
          END
        )::integer AS expected_quantity
      FROM inventory_unit unit
      JOIN product source_product ON source_product.id = unit."productId"
      WHERE unit.status = 'IN_STOCK'
      GROUP BY unit."productId"
    ) stock ON stock."productId" = product.id
    WHERE product.quantity <> COALESCE(stock.expected_quantity, 0)
  ) THEN
    RAISE EXCEPTION 'product.quantity backfill verification failed';
  END IF;
END
$$;

SELECT
  COUNT(*) AS product_count,
  COALESCE(SUM(quantity), 0) AS total_available_quantity
FROM product;

COMMIT;
