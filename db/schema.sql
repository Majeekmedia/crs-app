-- Contribution Reconciliation System (CRS) - Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table (contribution plans)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contribution_amount DECIMAL(12,2) NOT NULL,
  cycle_duration TEXT NOT NULL CHECK (cycle_duration IN ('daily', '5-day', 'weekly', 'bi-weekly', 'monthly', 'quarterly')),
  payout_amount DECIMAL(12,2) NOT NULL,
  total_slots INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  current_cycle INTEGER NOT NULL DEFAULT 1,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan-Members junction table (with slot tracking)
CREATE TABLE plan_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, slot_number)
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  amount DECIMAL(12,2) NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'unallocated' CHECK (status IN ('unallocated', 'allocated', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Allocations table
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  amount_allocated DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  cycle_number INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_plan_members_plan_id ON plan_members(plan_id);
CREATE INDEX idx_plan_members_member_id ON plan_members(member_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payment_allocations_payment_id ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_plan_id ON payment_allocations(plan_id);
CREATE INDEX idx_payouts_plan_id ON payouts(plan_id);
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_members_user_id ON members(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- ─── Multi-Tenant RLS Policies ───
-- Each user can ONLY see and manage their own data.
-- Child tables (plan_members, payments, allocations, payouts)
-- are protected through ownership of the parent plan/member.

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
