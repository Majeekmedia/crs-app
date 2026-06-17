-- Cycle Reset Migration
-- Run this AFTER the multi_tenant_migration.sql to add cycle tracking support.
-- Enables "Start New Cycle" button when all members have been paid out.

ALTER TABLE plans ADD COLUMN IF NOT EXISTS current_cycle INTEGER NOT NULL DEFAULT 1;
