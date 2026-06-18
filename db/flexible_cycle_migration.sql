-- Flexible Cycle & Start Date Migration
-- Run this AFTER multi_tenant_migration and cycle_reset_migration.
-- Removes cycle_duration CHECK constraint, adds cycle_days and start_date columns.

ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_cycle_duration_check;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS cycle_days INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
