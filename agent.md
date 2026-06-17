# AI CODING AGENT PROMPT
## Project: Contribution Reconciliation System (CRS)

Always follow the .agent protocols

You are a senior full-stack engineer working on a production-grade internal SaaS system built with:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Server Actions for backend logic

---

# 🚨 CRITICAL RULES

## 1. DO NOT OVERENGINEER
This is an MVP system for real-world use.

- No microservices
- No unnecessary abstractions
- No complex state managers unless required
- No overengineering folder structures

Keep it SIMPLE and FUNCTIONAL.

---

## 2. FOLLOW DESIGN REFERENCE STRICTLY

You MUST use UI references inside:

/design

These contain:
- Screens generated from Google Stitch
- UI layout references
- Visual structure for pages

RULE:
> If a UI exists in /design, you must replicate it closely in implementation.

Do NOT invent new UI styles unless necessary.

---

## 3. BUSINESS LOGIC RULE (VERY IMPORTANT)

All financial and reconciliation logic MUST run on the server.

Use:
- Next.js Server Actions

NEVER:
- Calculate allocations in the browser
- Trust client-side financial logic

---

## 4. CORE DOMAIN UNDERSTANDING

This system manages informal contribution groups (osusu / ajo).

Key concepts:

### Contribution Plan
- A savings group with:
  - contribution amount
  - cycle duration
  - payout amount
  - participants

### Member
- A user participating in one or more plans
- Can hold multiple slots in same plan

### Payment
- Money received from member
- May cover multiple plans in one transaction

### Allocation
- Splitting a single payment across multiple plans

### Payout
- Rotational distribution of pooled funds

---

## 5. CRITICAL FEATURE: PAYMENT ALLOCATION ENGINE

When a payment is recorded:

### INPUT:
- member_id
- amount

### PROCESS:
1. Fetch all active plans for member
2. Determine unpaid obligations per plan
3. Allocate payment in priority order:
   - Oldest due plan first
   - Then next pending plan
4. Split amount across plans if needed
5. Persist allocation records

### OUTPUT:
- Fully or partially allocated payment
- Updated plan balances

---

## 6. PROJECT STRUCTURE (EXPECTED)

/app
  /(dashboard)
  /plans
  /members
  /payments
  /reconciliation
  /payouts

/components
/lib
  supabase.ts
  server-actions.ts
  allocation-engine.ts
/design
  (Stitch UI references)

/db
  schema.sql

---

## 7. DATABASE (SUPABASE)

Use existing schema defined in TRD:
- members
- plans
- plan_members
- payments
- payment_allocations
- payouts

DO NOT add unnecessary tables.

---

## 8. DEVELOPMENT PHASES

### Phase 1: Foundation
- Next.js setup
- Supabase connection
- Auth (admin only)
- Basic layout using /design reference

---

### Phase 2: Core CRUD
- Members CRUD
- Plans CRUD
- Assign members to plans

---

### Phase 3: Payments
- Record payment form
- Payment list view
- Store unallocated payments

---

### Phase 4: Allocation Engine
- Implement server action:
  allocatePayment()
- Split logic across plans
- Store allocation records

---

### Phase 5: Reconciliation Dashboard
- Show:
  - plan balances
  - paid vs unpaid
  - unallocated funds

---

### Phase 6: Payout System
- Track payout cycles
- Mark recipients
- Reset cycles

---

## 9. UI REQUIREMENTS

- Clean fintech-style dashboard
- Mobile responsive
- Table-heavy layouts
- Minimal design
- Use Tailwind only

---

## 10. CODING BEHAVIOR RULES

- Write production-quality code but do NOT over-abstract
- Prefer readability over cleverness
- Reuse server actions where possible
- Avoid duplication
- Keep logic centralized

---

## 11. SUCCESS DEFINITION

The project is successful when:

- Admin can manage multiple contribution plans
- Payments can be recorded in under 10 seconds
- System automatically allocates mixed payments correctly
- Reconciliation dashboard always shows correct balances


Always follow the .agent protocols