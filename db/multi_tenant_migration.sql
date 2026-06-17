-- Multi-Tenant Migration
-- Run this ONLY if you already ran the original schema.sql and need to add
-- user_id columns + ownership-based RLS for multi-tenant isolation.
--
-- For fresh installations, the updated schema.sql already includes these changes.

-- ─── Step 1: Add user_id columns (nullable first to backfill) ───

ALTER TABLE plans ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE members ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─── Step 2: Backfill existing rows (if any) ───
-- NOTE: If you already have data, you need to assign ownership manually.
-- Run this per user, replacing the UUID with your actual auth user ID:
-- UPDATE plans SET user_id = 'REPLACE_WITH_YOUR_AUTH_USER_ID' WHERE user_id IS NULL;
-- UPDATE members SET user_id = 'REPLACE_WITH_YOUR_AUTH_USER_ID' WHERE user_id IS NULL;

-- If you have NO data yet (fresh schema), this is a no-op:
UPDATE plans SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE members SET user_id = auth.uid() WHERE user_id IS NULL;

-- ─── Step 3: Make user_id NOT NULL ───

ALTER TABLE plans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE members ALTER COLUMN user_id SET NOT NULL;

-- ─── Step 4: Add indexes ───

CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- ─── Step 5: Drop old admin-only RLS policies ───

DROP POLICY IF EXISTS "Admin full access on users" ON users;
DROP POLICY IF EXISTS "Admin full access on members" ON members;
DROP POLICY IF EXISTS "Admin full access on plans" ON plans;
DROP POLICY IF EXISTS "Admin full access on plan_members" ON plan_members;
DROP POLICY IF EXISTS "Admin full access on payments" ON payments;
DROP POLICY IF EXISTS "Admin full access on payment_allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Admin full access on payouts" ON payouts;

-- ─── Step 6: Create multi-tenant RLS policies ───

-- Users table: authenticated users can read their own record
CREATE POLICY "Users can manage own record" ON users
  FOR ALL USING (id = auth.uid());

-- Plans: owned by the creating user
CREATE POLICY "Users can manage own plans" ON plans
  FOR ALL USING (user_id = auth.uid());

-- Members: owned by the creating user
CREATE POLICY "Users can manage own members" ON members
  FOR ALL USING (user_id = auth.uid());

-- Plan-Members: protected through plan ownership
CREATE POLICY "Users can manage plan_members through owned plans" ON plan_members
  FOR ALL USING (
    plan_id IN (SELECT id FROM plans WHERE user_id = auth.uid())
  );

-- Payments: protected through member ownership
CREATE POLICY "Users can manage payments through owned members" ON payments
  FOR ALL USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

-- Payment Allocations: protected through plan ownership
CREATE POLICY "Users can manage allocations through owned plans" ON payment_allocations
  FOR ALL USING (
    plan_id IN (SELECT id FROM plans WHERE user_id = auth.uid())
  );

-- Payouts: protected through plan ownership
CREATE POLICY "Users can manage payouts through owned plans" ON payouts
  FOR ALL USING (
    plan_id IN (SELECT id FROM plans WHERE user_id = auth.uid())
  );
