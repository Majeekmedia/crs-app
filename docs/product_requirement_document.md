# PRD - Contribution Reconciliation System

## 1. Goals
- Enable users track multiple contribution plans in one system
- Reduce manual reconciliation of payments
- Automatically allocate combined payments to correct plans
- Provide clarity on who has paid and outstanding balances

## 2. Key Features (MVP)

### 2.1 Contribution Plans
- Create plan with:
  - Name
  - Contribution amount
  - Cycle (daily, 5-day, monthly, etc.)
  - Number of participants
  - Payout amount
- Track profit margin per cycle

### 2.2 Members
- Create members with:
  - Name
  - Phone number
- Assign members to one or multiple plans
- Allow multiple slots per member in same plan

### 2.3 Payment Tracking
- Record incoming payment:
  - Amount
  - Member (optional auto-detect later)
  - Date
- Mark payment as "unallocated" initially

### 2.4 Allocation Engine
- System suggests allocation based on:
  - Member’s active plans
  - Outstanding balances per plan
- Allow manual override
- Support split allocation from one payment into multiple plans

### 2.5 Reconciliation Dashboard
- Show:
  - Total expected per plan
  - Total received per plan
  - Outstanding balances
  - Assigned vs unassigned funds

### 2.6 Payout Tracking
- Track payout cycles:
  - Who has received payout
  - Remaining participants
- Mark payout completion per cycle

## 3. MVP Constraints
- Single admin user system (no public users)
- No mobile app (web only)
- No payment gateway integration
- No WhatsApp automation

## 4. Success Criteria
- User can manage at least 5 concurrent plans without confusion
- User can reconcile mixed payments within 1 click
- Zero need for external notebook tracking