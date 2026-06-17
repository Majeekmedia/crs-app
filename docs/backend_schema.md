# DATABASE SCHEMA

## users
- id (uuid)
- email
- created_at

---

## members
- id
- name
- phone
- created_at

---

## plans
- id
- name
- contribution_amount
- cycle_duration (daily/5-day/monthly)
- payout_amount
- total_slots
- created_at

---

## plan_members
- id
- plan_id
- member_id
- slot_number
- created_at

---

## payments
- id
- member_id
- amount
- received_at
- status (unallocated/allocated)

---

## payment_allocations
- id
- payment_id
- plan_id
- amount_allocated

---

## payouts
- id
- plan_id
- member_id
- cycle_number
- amount
- status (pending/completed)
- paid_at