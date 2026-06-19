-- Flexible Cycle & Start Date Migration
-- Run this AFTER multi_tenant_migration and cycle_reset_migration.
-- Removes cycle_duration CHECK constraint, adds cycle_days and start_date columns.
-- Removes current_cycle (calculated from dates now), makes start_date required.

ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_cycle_duration_check;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS cycle_days INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

-- Backfill existing null start_dates with created_at
UPDATE plans SET start_date = created_at WHERE start_date IS NULL;

-- Make start_date required going forward
ALTER TABLE plans ALTER COLUMN start_date SET NOT NULL;

-- Remove current_cycle — now calculated from start_date + cycle_days
ALTER TABLE plans DROP COLUMN IF EXISTS current_cycle;
