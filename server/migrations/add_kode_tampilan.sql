-- Migration: Add kode_tampilan and prodi_id fields
-- Run this migration on the database

-- 1. Add kode_tampilan to cpl table
ALTER TABLE cpl ADD COLUMN IF NOT EXISTS kode_tampilan VARCHAR(20);

-- Populate kode_tampilan from existing kode_cpl (extract display code)
UPDATE cpl SET kode_tampilan = REGEXP_REPLACE(kode_cpl, '^[A-Z]+-', '') WHERE kode_tampilan IS NULL;

-- If above doesn't work (no prefix), just copy kode_cpl
UPDATE cpl SET kode_tampilan = kode_cpl WHERE kode_tampilan IS NULL OR kode_tampilan = '';

-- Make it NOT NULL after population
ALTER TABLE cpl ALTER COLUMN kode_tampilan SET NOT NULL;

-- Add unique constraint for display code per prodi
CREATE UNIQUE INDEX IF NOT EXISTS unique_display_code_per_prodi ON cpl(kode_tampilan, prodi_id);

-- 2. Add kode_tampilan to bahan_kajian table
ALTER TABLE bahan_kajian ADD COLUMN IF NOT EXISTS kode_tampilan VARCHAR(20);

-- Populate kode_tampilan from existing kode_bk
UPDATE bahan_kajian SET kode_tampilan = REGEXP_REPLACE(kode_bk, '^[A-Z]+-', '') WHERE kode_tampilan IS NULL;
UPDATE bahan_kajian SET kode_tampilan = kode_bk WHERE kode_tampilan IS NULL OR kode_tampilan = '';

-- Make it NOT NULL
ALTER TABLE bahan_kajian ALTER COLUMN kode_tampilan SET NOT NULL;

-- 3. Add prodi_id and kode_tampilan to cpmk table
ALTER TABLE cpmk ADD COLUMN IF NOT EXISTS prodi_id INTEGER;
ALTER TABLE cpmk ADD COLUMN IF NOT EXISTS kode_tampilan VARCHAR(20);

-- Populate kode_tampilan from existing kode_cpmk
UPDATE cpmk SET kode_tampilan = REGEXP_REPLACE(kode_cpmk, '^[A-Z]+-', '') WHERE kode_tampilan IS NULL;
UPDATE cpmk SET kode_tampilan = kode_cpmk WHERE kode_tampilan IS NULL OR kode_tampilan = '';

-- Make kode_tampilan NOT NULL
ALTER TABLE cpmk ALTER COLUMN kode_tampilan SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_cpmk_display_per_prodi ON cpmk(kode_tampilan, prodi_id);

-- 4. Add prodi_id and kode_tampilan to sub_cpmk table
ALTER TABLE sub_cpmk ADD COLUMN IF NOT EXISTS prodi_id INTEGER;
ALTER TABLE sub_cpmk ADD COLUMN IF NOT EXISTS kode_tampilan VARCHAR(20);

-- Populate kode_tampilan from existing kode_sub_cpmk
UPDATE sub_cpmk SET kode_tampilan = REGEXP_REPLACE(kode_sub_cpmk, '^[A-Z]+-', '') WHERE kode_tampilan IS NULL;
UPDATE sub_cpmk SET kode_tampilan = kode_sub_cpmk WHERE kode_tampilan IS NULL OR kode_tampilan = '';

-- Make kode_tampilan NOT NULL
ALTER TABLE sub_cpmk ALTER COLUMN kode_tampilan SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_subcpmk_display_per_prodi ON sub_cpmk(kode_tampilan, prodi_id);

-- Done!
