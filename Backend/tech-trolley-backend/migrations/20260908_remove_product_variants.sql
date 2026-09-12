-- Tech Trolley: preserve transaction/inventory history while removing variants.
--
-- Execution:
--   1. Back up the target PostgreSQL database and stop every API instance.
--   2. Confirm this is the intended database, then run:
--        psql -v ON_ERROR_STOP=1 -d <database> \
--          -f migrations/20260908_remove_product_variants.sql
--   3. Start the updated API only after this script commits successfully.
--
-- The script is intentionally single-use and transactional. Any failed
-- verification rolls back every schema/data change, including dropped objects.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '10min';

DO $$
BEGIN
  IF to_regclass('public.product_variant') IS NULL THEN
    RAISE EXCEPTION
      'product_variant does not exist; migration was already applied or the wrong database is selected';
  END IF;
END
$$;

LOCK TABLE
  product,
  product_variant,
  purchase_item,
  sale_item,
  inventory_unit
IN ACCESS EXCLUSIVE MODE;

-- Abort before any destructive operation when historical references are broken.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM purchase_item item
    LEFT JOIN product_variant variant ON variant.id = item."variantId"
    WHERE variant.id IS NULL
  ) THEN
    RAISE EXCEPTION 'purchase_item contains orphaned variantId values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM sale_item item
    LEFT JOIN product_variant variant ON variant.id = item."variantId"
    WHERE variant.id IS NULL
  ) THEN
    RAISE EXCEPTION 'sale_item contains orphaned variantId values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM inventory_unit unit
    LEFT JOIN product_variant variant ON variant.id = unit."variantId"
    WHERE variant.id IS NULL
  ) THEN
    RAISE EXCEPTION 'inventory_unit contains orphaned variantId values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM inventory_unit
    WHERE imei IS NOT NULL
    GROUP BY imei
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'duplicate inventory IMEIs exist; resolve them before applying this migration';
  END IF;
END
$$;

ALTER TABLE purchase_item ADD COLUMN "productId" uuid;
ALTER TABLE sale_item ADD COLUMN "productId" uuid;
ALTER TABLE inventory_unit ADD COLUMN "productId" uuid;

UPDATE purchase_item item
SET "productId" = variant."productId"
FROM product_variant variant
WHERE item."variantId" = variant.id;

UPDATE sale_item item
SET "productId" = variant."productId"
FROM product_variant variant
WHERE item."variantId" = variant.id;

UPDATE inventory_unit unit
SET "productId" = variant."productId"
FROM product_variant variant
WHERE unit."variantId" = variant.id;

-- Verify every historical row is mapped to a real product before continuing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM purchase_item item
    LEFT JOIN product ON product.id = item."productId"
    WHERE item."productId" IS NULL OR product.id IS NULL
  ) THEN
    RAISE EXCEPTION 'purchase_item product migration verification failed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM sale_item item
    LEFT JOIN product ON product.id = item."productId"
    WHERE item."productId" IS NULL OR product.id IS NULL
  ) THEN
    RAISE EXCEPTION 'sale_item product migration verification failed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM inventory_unit unit
    LEFT JOIN product ON product.id = unit."productId"
    WHERE unit."productId" IS NULL OR product.id IS NULL
  ) THEN
    RAISE EXCEPTION 'inventory_unit product migration verification failed';
  END IF;
END
$$;

ALTER TABLE purchase_item ALTER COLUMN "productId" SET NOT NULL;
ALTER TABLE sale_item ALTER COLUMN "productId" SET NOT NULL;
ALTER TABLE inventory_unit ALTER COLUMN "productId" SET NOT NULL;

-- Drop generated foreign keys that point at product_variant without depending
-- on environment-specific TypeORM constraint names.
DO $$
DECLARE
  relation record;
BEGIN
  FOR relation IN
    SELECT conrelid::regclass AS table_name, conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid = 'product_variant'::regclass
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      relation.table_name,
      relation.conname
    );
  END LOOP;
END
$$;

ALTER TABLE purchase_item DROP COLUMN "variantId";
ALTER TABLE sale_item DROP COLUMN "variantId";
ALTER TABLE inventory_unit DROP COLUMN "variantId";

ALTER TABLE purchase_item
  ADD CONSTRAINT "FK_purchase_item_product"
  FOREIGN KEY ("productId") REFERENCES product(id);

ALTER TABLE sale_item
  ADD CONSTRAINT "FK_sale_item_product"
  FOREIGN KEY ("productId") REFERENCES product(id);

ALTER TABLE inventory_unit
  ADD CONSTRAINT "FK_inventory_unit_product"
  FOREIGN KEY ("productId") REFERENCES product(id);

CREATE INDEX "IDX_purchase_item_productId"
  ON purchase_item ("productId");
CREATE INDEX "IDX_sale_item_productId"
  ON sale_item ("productId");
CREATE INDEX "IDX_inventory_unit_productId"
  ON inventory_unit ("productId");
CREATE UNIQUE INDEX "IDX_inventory_unit_imei_unique"
  ON inventory_unit (imei)
  WHERE imei IS NOT NULL;

DROP TABLE product_variant;

-- These result sets are the post-migration audit record shown by psql.
SELECT 'purchase_item' AS table_name, COUNT(*) AS linked_rows
FROM purchase_item
WHERE "productId" IS NOT NULL
UNION ALL
SELECT 'sale_item', COUNT(*) FROM sale_item WHERE "productId" IS NOT NULL
UNION ALL
SELECT 'inventory_unit', COUNT(*) FROM inventory_unit WHERE "productId" IS NOT NULL;

COMMIT;
