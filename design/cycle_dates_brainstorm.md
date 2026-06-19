# Cycle Dates & Flexibility — Design Brainstorm (Revised)

## Core Principle

**The schedule is the schedule.** In real ROSCA groups, once a contribution starts, the payout dates
are fixed. Members know their turn from day one. Late payments happen, but they don't shift the
calendar — the admin manages that cash flow themselves. The system's job is to **track and inform**,
not to block or enforce.

---

## The Flow

### 1. Creating a Plan

| Field | Required? | Notes |
|---|---|---|
| Plan Name | ✅ Yes | |
| Start Date | ✅ **Yes (required)** | The anchor date. Can be in the past (backdating) or future. |
| Cycle Duration / Days | ✅ Yes | e.g., 7 days, 30 days, or custom. |
| Contribution Amount | ✅ Yes | Amount each member pays per cycle. |
| Payout Amount | ✅ Yes | Amount the payee receives each cycle. |
| Total Slots | ✅ Yes | Number of participants. |

**Start date is no longer optional** — it drives everything.

### 2. How Dates & Cycles Are Calculated

Given `start_date`, `cycle_days`, and `total_slots`, the system determines everything automatically:

```
Cycle 1:  start_date ........................ start_date + cycle_days - 1 day
Cycle 2:  start_date + cycle_days .......... start_date + 2×cycle_days - 1 day
Cycle 3:  start_date + 2×cycle_days ........ start_date + 3×cycle_days - 1 day
...etc
```

**Current cycle** is calculated, not stored:

```
current_cycle = floor( (today - start_date) / cycle_days ) + 1
```

**Who gets paid in each cycle** is determined by slot order:

```
payee_slot = ((cycle_number - 1) % total_slots) + 1
```

So for a 12-slot plan:

| Cycle | Payee Slot |
|---|---|
| 1 | Slot 1 |
| 2 | Slot 2 |
| 3 | Slot 3 |
| ... | ... |
| 12 | Slot 12 |
| 13 | Slot 1 (new round) |
| 14 | Slot 2 |
| ... | ... |

This means when you add members to slots, you already know exactly when their payout turn comes.

### 3. System Auto-Advances Cycles

There is **no manual "Proceed to Next Cycle" button**. The system knows what cycle it is by
comparing today's date to the start date. The plan detail page always shows:

- **Current cycle number** (calculated)
- **Who is currently due** (which slot/member)
- **Member payout timeline** (all future payout dates)
- **Past cycles** with their historical payees

### 4. Payments Are Separate From the Schedule

When a member pays their contribution, the admin records it. The payment has a date, but that date
doesn't change the cycle schedule. If a member pays late, the admin can still record it — the
system just shows it as a late payment.

The cycle schedule **never shifts** because of late payments. This matches real-world ROSCA
behavior: the admin makes provisions and chases defaulters, but the group's payout calendar stays
on track.

### 5. Backdating

When creating a plan with a **past start date**, the system:

1. Calculates how many cycles have already passed
2. Determines which slot would have been paid in each past cycle
3. When the admin adds a member to a slot, if that slot already had a past payout cycle,
   the system shows that member as **"Cycle X (already passed)"** or similar
4. The current cycle is calculated from today's date

This allows users to onboard an existing contribution group into the platform.

### 6. Editing the Start Date

- **Before the first cycle ends** (today < start_date + cycle_days):
  Admin can update the start date. The system recalculates all cycle dates.
- **After the first cycle ends** (today >= start_date + cycle_days):
  Start date is **locked**. The plan's schedule is final.
- **Workaround if locked**: Admin must delete the plan and create a new one with the correct date.

---

## Database Impact

| Current | New |
|---|---|
| `start_date` optional, nullable | `start_date` **required**, `NOT NULL` |
| `current_cycle INTEGER DEFAULT 1` (stored) | **Remove column** — calculated on the fly |
| `cycle_days INTEGER` | **Keep** — same purpose |
| Manual `startNextCycle()` action | **Remove** — no longer needed |
| Payout records with `cycle_number` | **Keep** — still used for historical tracking |

---

## What Changes in the Code

### Server Actions — Remove
- `startNextCycle()` — no manual progression

### Server Actions — Modify
- `createPlan()` — `start_date` is now required; no `current_cycle` insert needed
- `updatePlan()` — add ability to update `start_date` (with lock check)

### Pages — Modify
- **`/plans/new` (Create Plan form)** — make start date required
- **`/plans/[id]` (Plan Detail)** — show calculated current cycle, member payout timeline,
  remove "Proceed to Next Cycle" button, show who's currently due

### Utilities — Add
- `getCurrentCycle(start_date, cycle_days)` → number
- `getCycleDates(start_date, cycle_days, total_slots)` → array of cycle date ranges
- `getPayeeForCycle(cycle_number, total_slots)` → slot number
- `isStartDateLocked(start_date, cycle_days)` → boolean

---

## Summary

| Aspect | Approach |
|---|---|
| **Start date** | Required, anchors everything |
| **Cycle progression** | Auto-calculated from start date + cycle days |
| **Member payout order** | Slot order determines cycle order (wraps around) |
| **Manual cycle button** | ❌ Removed |
| **Start date edit** | Allowed only before first cycle ends |
| **Backdating** | ✅ Supported — past cycles auto-resolved |
| **Late payments** | Recorded as-is, schedule unaffected |
| **Admin's role** | Record payments, manage defaulters, view timeline |
