-- Reconcile the Product soft-delete column without rewriting or deleting data.
--
-- PostgreSQL folds an unquoted camelCase identifier such as deletedAt to
-- deletedat. TypeORM's Product entity uses the quoted column "deletedAt".
-- This migration safely adopts either known legacy spelling when the canonical
-- column is absent, or creates the nullable column for databases that predate
-- Product soft deletion.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '2min';

DO $$
DECLARE
  has_canonical boolean;
  has_lowercase boolean;
  has_snake_case boolean;
BEGIN
  IF to_regclass('public.product') IS NULL THEN
    RAISE EXCEPTION 'Required table public.product does not exist';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product'
      AND column_name = 'deletedAt'
  ) INTO has_canonical;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product'
      AND column_name = 'deletedat'
  ) INTO has_lowercase;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product'
      AND column_name = 'deleted_at'
  ) INTO has_snake_case;

  IF has_canonical AND (has_lowercase OR has_snake_case) THEN
    RAISE EXCEPTION
      'Product has both "deletedAt" and a legacy soft-delete column; refusing an ambiguous merge';
  ELSIF NOT has_canonical AND has_lowercase AND has_snake_case THEN
    RAISE EXCEPTION
      'Product has both deletedat and deleted_at; refusing an ambiguous rename';
  ELSIF NOT has_canonical AND has_lowercase THEN
    ALTER TABLE public.product RENAME COLUMN deletedat TO "deletedAt";
  ELSIF NOT has_canonical AND has_snake_case THEN
    ALTER TABLE public.product RENAME COLUMN deleted_at TO "deletedAt";
  ELSIF NOT has_canonical THEN
    ALTER TABLE public.product ADD COLUMN "deletedAt" timestamptz NULL;
  END IF;
END
$$;

DO $$
DECLARE
  column_type text;
  nullable text;
BEGIN
  SELECT data_type, is_nullable
  INTO column_type, nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'product'
    AND column_name = 'deletedAt';

  IF column_type IS DISTINCT FROM 'timestamp with time zone' THEN
    RAISE EXCEPTION
      'product."deletedAt" must be timestamptz; found %', column_type;
  END IF;

  IF nullable IS DISTINCT FROM 'YES' THEN
    RAISE EXCEPTION 'product."deletedAt" must be nullable';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "IDX_product_active_name"
  ON public.product (name)
  WHERE "deletedAt" IS NULL;

COMMIT;
