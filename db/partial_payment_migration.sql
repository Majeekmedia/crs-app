-- Migration: Add partial payment and overpayment rollover support
-- Adds cycle_number to payment_allocations and balance to members

-- 1. Add cycle_number to payment_allocations (tracks which cycle the allocation covers)
ALTER TABLE payment_allocations ADD COLUMN cycle_number INTEGER;

-- 2. Add balance to members (tracks credit from overpayments)
ALTER TABLE members ADD COLUMN balance NUMERIC DEFAULT 0;

-- 3. Update existing payment_allocations to have a default cycle_number
-- For existing allocations, we'll set cycle_number to NULL (unknown)
-- New allocations will require a cycle_number

-- Note: This is a non-destructive migration. Existing data is preserved.
-- The cycle_number column is optional for backward compatibility.
