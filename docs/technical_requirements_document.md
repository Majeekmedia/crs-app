# TRD - Contribution Reconciliation System (Next.js Architecture)

## 1. Tech Stack

### Frontend + Backend Framework
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Backend / Infrastructure
- Supabase (PostgreSQL)
- Supabase Auth (Admin-only system for MVP)
- Supabase Row Level Security (RLS)

### Deployment
- Vercel (Next.js hosting)
- Supabase Cloud (Database + Auth)

---

## 2. System Architecture

### Architecture Style
- Full-stack Next.js application
- Hybrid rendering:
  - Server Components (data-heavy pages)
  - Client Components (interactive UI)
- Server Actions used for all business logic

### Core Principle
> Business logic must NOT run in the browser.

All sensitive operations (allocation, reconciliation, payout processing) are handled on the server.

---

## 3. Application Structure

### Frontend Layers
- App Router Pages
- Server Components for:
  - Dashboard
  - Plans overview
  - Members list
- Client Components for:
  - Payment entry forms
  - Allocation modals
  - Interactive tables

### Backend Layers
- Next.js Server Actions
- Supabase client (server-side usage)
- Database triggers (optional, not required for MVP)

---

## 4. Core Modules

### 4.1 Contribution Plans Module
Handles creation and management of contribution groups.

Responsibilities:
- Create plan
- Define contribution amount
- Define cycle duration (daily / 5-day / monthly)
- Set payout amount
- Manage active/inactive status

---

### 4.2 Members Module
Handles participant data.

Responsibilities:
- Create member profile
- Assign member to multiple plans
- Allow multiple slots per member per plan

---

### 4.3 Payments Module
Handles incoming contributions.

Responsibilities:
- Record incoming payment
- Store raw payment data (amount, member, date)
- Keep payment initially unallocated

---

### 4.4 Allocation Engine (CORE LOGIC)

This is the most important system component.

#### Input:
- Payment record
- Member identity

#### Process:
1. Fetch all active plans for member
2. Retrieve unpaid obligations across plans
3. Prioritize allocation by:
   - Oldest unpaid plan first
   - Then highest urgency plan
4. Split payment across multiple plans if needed
5. Create allocation records per plan

#### Output:
- Payment fully or partially allocated
- Plan balances updated

---

### 4.5 Reconciliation Engine

Responsibilities:
- Compare expected vs received contributions
- Track unallocated funds
- Match payments against plan obligations

Outputs:
- Plan balance summaries
- Member payment status
- Bank-level reconciliation view (optional grouping)

---

### 4.6 Payout System

Responsibilities:
- Track payout cycles per plan
- Assign payout recipient (based on slot order)
- Mark payout completion
- Reset or start new cycle

---

## 5. Security Model

### Authentication
- Supabase Auth (email/password)
- Single admin user (MVP scope)

### Authorization
- No public users in MVP
- Full access restricted to authenticated admin

### Data Security
- Row Level Security enabled in Supabase
- Server Actions used for all mutations

---

## 6. Performance Requirements

- Optimized for 1–10,000 transactions
- Fast dashboard loading (<2s target)
- Batch queries for plan summaries
- Avoid client-side heavy computations

---

## 7. Data Consistency Rules

- Payments are immutable after creation (audit-safe design)
- Allocations are traceable (no silent overwrites)
- All financial computations are server-side only
- Every allocation must reference:
  - payment_id
  - plan_id
  - amount_allocated

---

## 8. API / Server Actions Design

All operations handled via Next.js Server Actions:

### Actions include:
- createPlan()
- addMember()
- assignMemberToPlan()
- recordPayment()
- allocatePayment()
- runReconciliation()
- processPayout()

---

## 9. Scalability Considerations (Future)

Not part of MVP but designed for extension:

- Multi-admin support
- Role-based access control (RBAC)
- WhatsApp notification integration
- Bank statement import
- Mobile app API layer
- Audit logs per transaction

---

## 10. MVP Constraints

- Single organization (your wife’s business only initially)
- No external users
- No payment gateway integration
- No automation with banks or WhatsApp
- Manual data entry for all transactions

---

## 11. Success Criteria

MVP is successful if:
- A user can manage 5+ concurrent contribution plans without confusion
- Mixed payments can be allocated in under 10 seconds
- No need for external notebook or spreadsheet
- Full reconciliation is visible per plan at any time

---