-- 023_fix_filament_columns.sql
-- Objetivo: garantir filament_id (EN) para consistencia, mantendo compatibilidade com filamento_id (PT)

BEGIN;

-- 1) PRODUCTS: hoje tem filamento_id (PT). Criar filament_id (EN) como espelho.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='filamento_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='filament_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN filament_id uuid;
    UPDATE public.products SET filament_id = filamento_id WHERE filament_id IS NULL;
    ALTER TABLE public.products
      ADD CONSTRAINT products_filament_id_fkey
      FOREIGN KEY (filament_id) REFERENCES public.filaments(id);
    CREATE INDEX IF NOT EXISTS idx_products_filament_id ON public.products(filament_id);
  END IF;
END $$;

-- 2) FILAMENT_CONSUMPTION_LOGS: hoje tem filamento_id (PT). Criar filament_id (EN) como espelho.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='filament_consumption_logs' AND column_name='filamento_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='filament_consumption_logs' AND column_name='filament_id'
  ) THEN
    ALTER TABLE public.filament_consumption_logs ADD COLUMN filament_id uuid;
    UPDATE public.filament_consumption_logs
      SET filament_id = filamento_id
    WHERE filament_id IS NULL;

    ALTER TABLE public.filament_consumption_logs
      ADD CONSTRAINT filament_consumption_logs_filament_id_fkey
      FOREIGN KEY (filament_id) REFERENCES public.filaments(id);

    CREATE INDEX IF NOT EXISTS idx_fcl_filament_id ON public.filament_consumption_logs(filament_id);
  END IF;
END $$;

-- 3) PRODUCT_FILAMENTS: garantir que exista filament_id (EN).
-- Se a tabela tiver filamento_id (PT) e nao tiver filament_id (EN), cria e popula.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='product_filaments' AND column_name='filamento_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='product_filaments' AND column_name='filament_id'
  ) THEN
    ALTER TABLE public.product_filaments ADD COLUMN filament_id uuid;
    UPDATE public.product_filaments
      SET filament_id = filamento_id
    WHERE filament_id IS NULL;

    -- Cria FK nova (sem depender do nome antigo)
    ALTER TABLE public.product_filaments
      ADD CONSTRAINT product_filaments_filament_id_fkey
      FOREIGN KEY (filament_id) REFERENCES public.filaments(id);

    CREATE INDEX IF NOT EXISTS idx_product_filaments_filament_id ON public.product_filaments(filament_id);
  END IF;
END $$;

-- 4) (Recomendado) PRODUCT_FILAMENTS: adicionar user_id para poder aplicar RLS corretamente
-- Backfill via products.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='product_filaments' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.product_filaments ADD COLUMN user_id uuid;

    UPDATE public.product_filaments pf
    SET user_id = p.user_id
    FROM public.products p
    WHERE pf.product_id = p.id AND pf.user_id IS NULL;

    ALTER TABLE public.product_filaments
      ALTER COLUMN user_id SET NOT NULL;

    ALTER TABLE public.product_filaments
      ADD CONSTRAINT product_filaments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id);

    CREATE INDEX IF NOT EXISTS idx_product_filaments_user_id ON public.product_filaments(user_id);
  END IF;
END $$;

COMMIT;
