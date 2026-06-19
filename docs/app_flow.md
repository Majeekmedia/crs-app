# Application Flow — Nengi's Precision Ledger

> **Platform:** Nengi's Precision Ledger (formerly CRS App)
> **Currency:** NGN (₦) — formatted with `en-NG` locale
> **Architecture:** Next.js 14 App Router, Supabase (PostgreSQL), Tailwind CSS v3
> **Rendering:** Hybrid — Server Components for data pages, Client Components for interactivity
> **Business Logic:** Server Actions (never runs in browser)

---

## 1. Account & Authentication Flow

### 1.1 Registration
- Admin navigates to `/auth/register`
- Creates account with email + password
- Account stored in Supabase Auth (`auth.users`)
- No public user registration — single-admin system

### 1.2 Login
- Admin navigates to `/auth/login`
- Authenticates via Supabase Auth with email/password
- Session managed by `@supabase/ssr` (cookie-based)
- Middleware protects all routes except `/auth/*`
- Unauthenticated users redirected to `/auth/login`

---

## 2. Plan Setup Flow

### 2.1 Create a Plan (`/plans/new`)
- Admin sets:
  - **Plan name** (e.g., "My ROSCA Plan")
  - **Contribution amount** per member per cycle (₦)
  - **Cycle days** — number of days in each cycle (e.g., 7 for weekly)
  - **Start date** — date the first cycle begins
  - **Total slots** — number of participants
  - **Payout amount** — amount the recipient gets each cycle
- On submit:
  - Plan row created in `plans` table with `status: 'active'`
  - `cycle_days` and `start_date` stored as fixed values
  - `total_slots` locked at creation time

### 2.2 Plans List (`/plans`)
- Desktop: table view with Name, Contribution, Payout, Slots, Status, Actions
- Mobile: card-based layout with same info
- Each plan row/card has a "View" link to the plan detail page
- Delete button with confirmation dialog (window.confirm)

### 2.3 Plan Detail (`/plans/[id]`)
- Shows:
  - Plan summary (name, contribution, payout, cycle days, start date)
  - Cycle calendar — visual timeline of all cycles with dates
  - Members list with slot numbers
  - Payout history per cycle
- Actions:
  - Add/remove members
  - Process payout for current cycle
  - WhatsApp Remind button — sends reminder message to all members who haven't paid

---

## 3. Member Management Flow

### 3.1 Add Members (`/members/new`)
- Fields: Name, Phone number
- Members are global (not per-plan)
- Stored in `members` table with `balance NUMERIC DEFAULT 0`

### 3.2 Members List (`/members`)
- Desktop: table with Name, Phone, Balance, Plans count, Created date
- Mobile: card layout with same info
- Each member row/card links to their payment history
- WhatsApp Remind button — sends payment reminder via WhatsApp

### 3.3 Assign Members to Plans
- Done from the plan detail page (`/plans/[id]`)
- Select a member and assign them a slot number
- Records stored in `plan_members` table (plan_id, member_id, slot_number)
- Members can hold multiple slots in the same plan

---

## 4. Payment Recording Flow

### 4.1 Record Payment (`/payments/new`)
- Admin fills form:
  - **Member** (dropdown — required)
  - **Amount** (₦ — required)
  - **Notes** (optional textarea — e.g., "Bank transfer ref: GTB-12345")
- On submit:
  - Payment row created in `payments` table with `status: 'unallocated'`
  - If notes provided, stored in `payments.notes` column
  - Toast notification confirms success
  - Redirected to `/payments`

### 4.2 Payments Log (`/payments`)
- **Desktop:** Table with columns:
  - Member Name (with avatar initials)
  - Amount Received (₦)
  - Date (formatted)
  - Allocation Status (badge: Unallocated / Allocated + cycle numbers)
  - Actions (hover to reveal):
    - 📄 **View Note** (only if note exists) — opens modal popup
    - **Allocate** (only if unallocated) — opens allocation modal
    - 🗑️ **Delete** — deletes payment
- **Mobile:** Card-based layout with same info, actions always visible
- **Metric Cards** (top, responsive grid):
  - Total Received (₦)
  - Unallocated Funds (₦) — with "Requires attention" warning
  - Allocation Rate (percentage + progress bar)

---

## 5. Allocation Flow

### 5.1 Allocation Modal
- Triggered by clicking "Allocate" on an unallocated payment
- Opens modal showing:
  - Member name and payment amount
  - List of plans the member belongs to
  - Per-plan slider/input to allocate partial amounts
  - Watch total — shows remaining unallocated amount

### 5.2 Allocation Logic
1. Admin adjusts sliders to distribute payment across plans
2. Each allocation is tied to a specific `cycle_number` (current active cycle for that plan)
3. On submit:
   - `payment_allocations` rows created (payment_id, plan_id, amount_allocated, cycle_number)
   - Payment status updated to `'allocated'`
   - If total allocated < payment amount → excess credited to `members.balance` (overpayment rollover)
   - If total allocated > payment amount → error (cannot overallocate)
   - `revalidatePath('/payments')` refreshes the page

### 5.3 Partial Payments
- A payment can be allocated to only some plans/cycles
- Remaining amount stays as unallocated until manually allocated later
- OR overflows to member's balance for future cycle credit

### 5.4 Overpayment Rollover
- When `allocated < payment.amount`, the difference is added to `members.balance`
- Balance can be used to offset future contribution requirements
- Visible on the members list page

---

## 6. Cycle & Payout Flow

### 6.1 Date-Driven Cycle Mechanics
- Each plan has:
  - `cycle_days` (e.g., 7 for weekly, 30 for monthly)
  - `start_date` (when cycle 1 begins)
- Cycle `N` runs from `start_date + (N-1) * cycle_days` to `start_date + N * cycle_days - 1`
- Example: For a 7-day cycle starting 2026-06-01:
  - Cycle 1: Jun 1–7
  - Cycle 2: Jun 8–14
  - Cycle 3: Jun 15–21
- Cycle numbers are computed dynamically from dates (not stored on the plan)

### 6.2 Slot Rotation
- Each member has a `slot_number` (1 to `total_slots`)
- Slot 1 is the first recipient (Cycle 1)
- After each payout, the slot rotates:
  - Slot 1 → last position
  - Slot 2 → becomes Slot 1 (next recipient)
  - All other slots shift up
- This ensures fair rotation over `total_slots` cycles

### 6.3 Payout Processing
- From the plan detail page, admin can process payout for the current cycle
- Checks: all members have paid their contribution for this cycle
- On payout:
  - `payouts` record created (plan_id, member_id, cycle_number, amount, status: 'completed')
  - Slot rotation applied (members reordered)
  - Toast notification confirms payout

### 6.4 Payout History
- Viewable on plan detail page
- Shows: cycle number, recipient, amount, status, date paid
- Tracks who has received and who's next in line

---

## 7. Reconciliation Flow

### 7.1 Reconciliation Hub (`/reconciliation`)
- Purpose: Verify that all money is accounted for and balanced
- Sections:

#### Total Money Metric
- Sum of all plan expected totals vs actual collected
- Visual overview of financial health

#### Plan-by-Plan Breakdown
- Each plan in a card showing:
  - Expected total (contribution_amount × total_slots × cycles_completed)
  - Total collected (sum of allocations to this plan)
  - Outstanding (difference)
  - Progress bar

#### Unallocated Funds Section
- Lists all payments still in 'unallocated' status
- Links to allocate them directly

#### Member Balance Summary
- Shows each member's overpayment balance
- Admin can zero out balances or apply them to next cycle

---

## 8. Notification Features

### 8.1 WhatsApp Remind
- Available on: Members list, Plan detail page
- Clicking opens WhatsApp URL with pre-filled message:
  - "Friendly reminder: Your contribution of ₦[amount] for [plan name], Cycle #[number] is due. Please make your payment. Thank you!"
- Opens in new tab — uses `wa.me` link with member's phone number
- Admin sends manually (no automation)

### 8.2 Toast Notifications
- After successful actions (record payment, allocate, delete, payout)
- Toast appears at top-right with success/error message
- Auto-dismisses after 3 seconds
- Implemented via `ToastNotification` client component

---

## 9. PWA Support

- **Manifest:** `public/manifest.json` — app name "Nengi's Precision Ledger", theme colors, icons
- **Service Worker:** `public/sw.js` — basic offline support, asset caching
- **Icons:** SVG + PNG (192x192, 512x512) in `public/icons/`
- **Registration:** `PwaRegister.tsx` component registers service worker on mount
- Users can "Add to Home Screen" on mobile devices

---

## 10. UI/UX Patterns

### 10.1 Responsive Design
- **Desktop-first:** Full tables for data-heavy views
- **Mobile:** Card-based layouts using `hidden md:*` / `md:hidden` toggles
- **Responsive grids:** `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` patterns
- **Metric cards:** Stack vertically on mobile, multi-column on desktop

### 10.2 Design Tokens (Tailwind)
- **Surface:** `bg-surface`, `bg-surface-container-lowest`, `bg-surface-variant`
- **Text:** `text-on-surface`, `text-secondary`, `text-primary`
- **Accent:** `bg-primary`, `bg-secondary-container`, `bg-primary-container`
- **Borders:** `border-outline-variant`
- **Cards:** Rounded corners (`rounded-lg`, `rounded-xl`), subtle borders

### 10.3 Bento Grid Layouts
- Dashboard uses bento-style grid with varying card sizes
- Metric cards span full width on mobile, partial on desktop

### 10.4 View Note Modal
- Payments with notes show a 📄 icon
- Click opens a centered modal popup with:
  - Payment Note heading
  - Member name subtitle
  - Note text in a highlighted box (whitespace-preserved)
  - Close button
- Closes on backdrop click or X button

### 10.5 Delete Confirmation
- Delete buttons trigger `window.confirm()` dialog
- Warning message: "Are you sure you want to delete this [item]? This action cannot be undone."
- Only proceeds on confirmation

---

## 11. Navigation & Layout

### 11.1 Sidebar (Desktop)
- Links: Dashboard, Plans, Members, Payments Log, Reconciliation
- Active state: highlighted with `bg-primary-container`
- Platform name at top

### 11.2 Bottom Navigation (Mobile)
- Same links as sidebar, displayed as icon + label tabs at bottom
- Active tab highlighted

### 11.3 Page Header Pattern
- Title + subtitle description
- Action button (e.g., "Log Payment", "Add Member", "Create Plan") at top-right
- Consistent spacing using `mb-xl`, `gap-md`

---

## 12. Data Flow Summary

```
Auth (Supabase) → Middleware → Server Component (data fetch)
                                    ↓
                              Server Action (mutate) ← Client Component (form/modal)
                                    ↓
                              Supabase DB (PostgreSQL)
                                    ↓
                              revalidatePath() → Page refresh
```

- All DB reads happen in Server Components with `force-dynamic` export
- All writes happen in Server Actions (imported and called from Client Components)
- No direct DB access from browser — business logic is server-only
- Cookie-based auth sessions via `@supabase/ssr`

---

## 13. Core Database Tables

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `plans` | `name`, `contribution_amount`, `payout_amount`, `total_slots`, `cycle_days`, `start_date`, `status` | Contribution plan definition |
| `members` | `name`, `phone`, `balance` | Member registry |
| `plan_members` | `plan_id`, `member_id`, `slot_number` | Membership + slot assignment |
| `payments` | `member_id`, `amount`, `received_at`, `status`, `notes` | Payment records |
| `payment_allocations` | `payment_id`, `plan_id`, `amount_allocated`, `cycle_number` | Allocation breakdown |
| `payouts` | `plan_id`, `member_id`, `cycle_number`, `amount`, `status` | Payout tracking |

---

## 14. Error Handling Patterns

- **Form validation:** HTML5 required fields + server-side validation
- **Duplicate/conflict:** Unique constraint errors caught in Server Actions
- **Not found:** 404 redirects for missing plans/members/payments
- **Auth failures:** Middleware redirects to login
- **Network errors:** Toast notification displays error message
- **Build cache:** Stale `.next` cache resolved by `Remove-Item -Recurse -Force .next` + rebuild