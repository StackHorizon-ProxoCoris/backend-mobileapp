-- ============================================================
-- Migrasi 009: Menambahkan kolom role ke users_metadata
-- Sumber kebenaran role: public.users_metadata.role
-- ============================================================

-- 1) Buat tipe ENUM untuk role (idempotent: aman jika dijalankan ulang)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role_enum'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role_enum AS ENUM ('user', 'pemerintah', 'admin');
  END IF;
END
$$;

-- 2) Tambahkan kolom role ke tabel metadata yang dipakai backend (idempotent)
DO $$
BEGIN
  IF to_regclass('public.users_metadata') IS NOT NULL THEN
    ALTER TABLE public.users_metadata
      ADD COLUMN IF NOT EXISTS role public.user_role_enum;
  END IF;
END
$$;

-- 3) Pastikan default value kolom role adalah 'user'
DO $$
BEGIN
  IF to_regclass('public.users_metadata') IS NOT NULL THEN
    ALTER TABLE public.users_metadata
      ALTER COLUMN role SET DEFAULT 'user';
  END IF;
END
$$;

-- 4) Backfill data lama: set role = 'user' untuk baris yang masih NULL (guarded)
DO $$
BEGIN
  IF to_regclass('public.users_metadata') IS NOT NULL THEN
    UPDATE public.users_metadata
    SET role = 'user'
    WHERE role IS NULL;
  END IF;
END
$$;

-- 5) Paksa kolom role menjadi NOT NULL setelah backfill (guarded)
DO $$
BEGIN
  IF to_regclass('public.users_metadata') IS NOT NULL THEN
    ALTER TABLE public.users_metadata
      ALTER COLUMN role SET NOT NULL;
  END IF;
END
$$;

-- 6) Index opsional untuk query berbasis role di masa depan (guarded)
DO $$
BEGIN
  IF to_regclass('public.users_metadata') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_users_metadata_role
      ON public.users_metadata(role);
  END IF;
END
$$;