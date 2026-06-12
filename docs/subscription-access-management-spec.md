# Subscription & Access Management — Functional Specification

**Status:** Draft for review
**Owner:** Platform / Admin team
**Goal:** Replace the current **lifetime access** model with a **time-bound subscription** model, give admins tooling to manage course and test access **without deleting accounts**, and preserve all user data so users can always log in and view their profile and history — but lose premium content access after expiry.

---

## 1. Background & Current State

The codebase already contains most of the primitives for a time-bound model; they are partially wired and inconsistent. This spec consolidates them.

| Area | Current behaviour | File |
| --- | --- | --- |
| Platform subscription | `Subscription` model is already time-bound: `endDate`, `status` (`ACTIVE`/`EXPIRED`/`CANCELLED`/`PENDING`), `isActive` virtual, `daysRemaining()`, pre-save auto-expire. One per user (`userId` unique). | `backend/src/models/subscription.model.js` |
| Test access | Gated by an active paid subscription. **Bug:** checks `sub.expiresAt` but the model field is `endDate`, so expiry is never enforced. | `backend/src/modules/testAttempt/testAttempt.service.js:21-26` |
| Course access | **Lifetime.** `CourseAccess` has `purchasedAt` only — no expiry, no disable flag, unique `(userId, courseId)`. Access is permanent once granted. | `backend/src/models/courseAccess.model.js`, `backend/src/modules/courses/courses.service.js:359-380` |
| Admin user mgmt | Student-only list, search + **hard delete** (`findByIdAndDelete`). No subscription data, filters, or access actions. | `frontend/src/pages/admin/Users.jsx`, `backend/src/modules/admin/admin.service.js:237-281` |

### Problems to solve
1. **Lifetime course access** prevents recurring revenue.
2. **Hard delete** destroys user data and history.
3. **Expiry is not enforced** for tests (field-name bug).
4. **No admin tooling** to disable/extend/grant access or to filter users by subscription state.
5. **Two parallel access mechanisms** (platform `Subscription` + per-course `CourseAccess`) with no unified, time-bound rule.

---

## 2. Scope

**In scope**
- Time-bound platform subscription as the primary access gate for premium courses and tests.
- Optional per-course time-bound grants (admin-issued or single-course purchases).
- Admin UI: subscription columns, filters (by duration/status/expiry window), and reversible actions (Disable, Extend, Grant, Change Plan).
- Access-control logic that distinguishes **account access** (always allowed) from **premium content access** (subscription-gated).
- Data preservation on disable; automatic expiry via scheduled job.

**Out of scope (this spec)**
- Payment gateway integration changes (assumes existing Razorpay-style flow continues to create payments/subscriptions).
- Auto-renew billing automation (model supports `autoRenew`; charging logic is a follow-up).
- Email/notification delivery infrastructure (we define the triggers; delivery is a follow-up).

---

## 3. Definitions

- **Account access** — ability to log in, view profile, view test/attempt history, view past results and previously-earned certificates, browse the catalogue. **Never revoked** except on explicit account ban.
- **Premium content access** — ability to consume paid courses (videos, notes, PDFs) and attempt premium tests. **Gated by an active, non-expired subscription or a valid course grant.**
- **Active subscription** — `status = ACTIVE` **and** (`plan = FREE` **or** `endDate > now`).
- **Expired subscription** — `endDate <= now`, or `status` set to `EXPIRED` by the expiry job.
- **Disabled access** — admin has set `status = CANCELLED` (or a grant's `disabled = true`); user keeps account access, loses premium access immediately. Fully reversible.

---

## 4. User Stories

### Admin
- **A1** — As an admin, I want to see each student's **plan, purchase (start) date, expiry date, days remaining, and access status** in the user list, so I can assess their subscription at a glance.
- **A2** — As an admin, I want to **filter users by subscription status** (Active / Expiring soon / Expired / No subscription / Disabled) and by **duration remaining** (e.g. expiring in ≤7/≤30 days), so I can target renewals and audits.
- **A3** — As an admin, I want to **disable a user's premium access without deleting the account**, so their data and history are preserved and access can be restored.
- **A4** — As an admin, I want to **extend a subscription** by a number of days or to a specific date, so I can honour renewals, promotions, or support cases.
- **A5** — As an admin, I want to **grant or change a plan** for a user manually, so I can handle offline payments and comps.
- **A6** — As an admin, I want every access change to be **logged with actor, timestamp, and reason**, so changes are auditable.
- **A7** — As an admin, I want to **re-enable** previously disabled access, restoring the prior expiry (or setting a new one).

### Student
- **S1** — As a student whose subscription expired, I want to **still log in and see my profile, history, and past results**, so I don't lose my record.
- **S2** — As a student whose subscription expired or was disabled, I want premium courses/tests to be **clearly locked with a renew prompt**, rather than failing cryptically.
- **S3** — As a student, I want to see my **plan, expiry date, and days remaining** on my profile, so I know when to renew.
- **S4** — As a student approaching expiry, I want a **visible reminder** (banner) so I can renew before losing access.

---

## 5. Data Model Changes

### 5.1 `Subscription` (extend existing — primary gate)
Keep the existing model; add fields for admin actions and consistency.

```
userId        ObjectId  (unique, ref User)        // existing
plan          enum FREE|MONTHLY|QUARTERLY|YEARLY   // existing
status        enum ACTIVE|EXPIRED|CANCELLED|PENDING// existing
startDate     Date                                 // existing — "Purchase Date"
endDate       Date                                 // existing — "Access Expiry Date" (null/absent = FREE/unlimited)
autoRenew     Boolean                              // existing
paymentHistory[]                                   // existing
// --- additions ---
disabledAt    Date     | null   // set when admin disables
disabledBy    ObjectId | null   // admin who disabled
disabledReason String  | null
lastExtendedAt Date    | null
source        enum PAYMENT|ADMIN_GRANT|MIGRATION   // provenance
```

Reuse the existing `isActive` virtual and `daysRemaining()`. **Status semantics:**
- `ACTIVE` + future `endDate` → premium access.
- `EXPIRED` → expiry job flipped it (or `endDate` passed); no premium access.
- `CANCELLED` → admin-disabled; no premium access; reversible.
- `PENDING` → payment initiated, not yet confirmed; no premium access.

### 5.2 `CourseAccess` (make time-bound + reversible)
Add to `backend/src/models/courseAccess.model.js`:

```
expiresAt   Date | null   // null = inherits platform subscription / legacy lifetime (see migration)
disabled    Boolean default false
disabledAt  Date | null
grantedBy   ObjectId | null  // admin if manually granted
source      enum PURCHASE|ADMIN_GRANT|MIGRATION
```

Keep the unique `(userId, courseId)` index. A grant is valid when `disabled = false` **and** (`expiresAt = null` **or** `expiresAt > now`).

### 5.3 `AccessAuditLog` (new — satisfies A6)
```
targetUserId  ObjectId (ref User, index)
actorId       ObjectId (ref User)         // admin
action        enum DISABLE|ENABLE|EXTEND|GRANT|CHANGE_PLAN|REVOKE_COURSE
before        Mixed   // snapshot {plan,status,endDate,...}
after         Mixed
reason        String
createdAt     Date
```

> **No schema change to `User`.** Account-level fields stay untouched so login and history are unaffected by access changes. (If a hard *ban* is ever needed, add `User.isBanned` separately — it is distinct from subscription disable.)

---

## 6. Functional Requirements

### FR-1 Unified access resolution
A single server-side helper `resolvePremiumAccess(userId, { courseId? })` returns `{ allowed, reason, expiresAt }` and is the **only** source of truth used by course, test, and middleware checks. Logic in §7.

### FR-2 Disable access (reversible) — replaces hard delete
- Admin action sets `Subscription.status = CANCELLED`, records `disabledAt/By/Reason`. Premium access is denied on the **next** request (and on next token validation; see §7.4).
- **No documents are deleted.** User row, attempts, payments, progress, certificates remain.
- The existing `deleteUser` hard-delete endpoint is **removed from the admin UI** and either deprecated or restricted behind an explicit "permanently delete (GDPR)" confirmation that is separate from "disable".

### FR-3 Extend access
- Admin supplies **+N days** or an **explicit date**. New `endDate = max(currentEndDate, now) + N days` (extending an expired sub starts from `now`; extending an active sub adds to remaining time — no time lost). Sets `status = ACTIVE`, clears `disabled*`, records `lastExtendedAt`.

### FR-4 Grant / change plan
- Admin can create or change a subscription for a user with `{plan, durationDays}`; sets `startDate = now`, `endDate = now + durationDays` (or `null` for FREE), `source = ADMIN_GRANT`.
- Optionally grant a single course: upsert `CourseAccess` with `expiresAt`, `source = ADMIN_GRANT`.

### FR-5 Enriched user list
The admin user list returns, per student: `name, email, plan, status (derived), startDate (Purchase Date), endDate (Expiry Date), daysRemaining, lastPaymentAt`. Joined from `Subscription` (left join — users with no subscription show `No subscription`).

### FR-6 Filters
Server-supported query params on the user list:
- `subStatus` ∈ `active|expiring|expired|none|disabled`
- `expiringInDays` (int) — `endDate` between `now` and `now + N`
- `plan` ∈ `FREE|MONTHLY|QUARTERLY|YEARLY`
- combined with existing `search` + pagination.

### FR-7 Automatic expiry
A scheduled job (cron) flips `status` `ACTIVE → EXPIRED` where `endDate <= now`, in bulk. Access checks **also** treat `endDate <= now` as expired in real time, so correctness does not depend on the job running — the job only keeps stored status accurate for filtering/reporting.

### FR-8 Bug fix — enforce test expiry
`testAttempt.service.js` `hasActivePaidSubscription` must call `resolvePremiumAccess` (or at minimum compare `endDate`, not the non-existent `expiresAt`). This is a prerequisite, not an enhancement — tests are currently free after expiry.

### FR-9 Student-facing surfacing
- Profile shows plan, expiry, days remaining, and a renew CTA when `daysRemaining <= 7` or expired.
- Locked premium content returns a structured `403 { reason: "subscription_expired" | "subscription_disabled" | "no_subscription" }` so the UI can show a renew prompt instead of a generic error.

### FR-10 Data preservation guarantee
Disabling or expiring access MUST NOT delete or mutate: `User`, `TestAttempt`, `Payment`, `CourseProgress`, certificates. Verified by a regression test that disables a user and asserts all such records still resolve.

---

## 7. Access Control Logic

### 7.1 Two-layer model
```
Layer 1 — Account access (authMiddleware):  always granted to a valid, non-banned user.
          → login, profile, history, results, catalogue browsing.
Layer 2 — Premium access (resolvePremiumAccess): gated.
          → premium course content, premium test attempts.
```
Login and history endpoints are **Layer 1 only** and never consult subscription state.

### 7.2 `resolvePremiumAccess(userId, { courseId })` — pseudocode
```js
// Course-specific check (if courseId given)
if (courseId) {
  const course = await Course.findById(courseId).select("isPaid").lean();
  if (!course)            return { allowed:false, reason:"not_found" };
  if (!course.isPaid)     return { allowed:true,  reason:"free" };

  const grant = await CourseAccess.findOne({ userId, courseId }).lean();
  if (grant && !grant.disabled &&
      (!grant.expiresAt || grant.expiresAt > now))
    return { allowed:true, reason:"course_grant", expiresAt: grant.expiresAt };
  // fall through to platform subscription
}

// Platform subscription check
const sub = await Subscription.findOne({ userId }).lean();
if (!sub)                       return { allowed:false, reason:"no_subscription" };
if (sub.plan === "FREE")        return { allowed: !courseId || false, reason:"free_plan" };
if (sub.status === "CANCELLED") return { allowed:false, reason:"subscription_disabled" };
if (sub.status !== "ACTIVE")    return { allowed:false, reason:"subscription_expired" };
if (sub.endDate && sub.endDate <= now)
                                return { allowed:false, reason:"subscription_expired" };
return { allowed:true, reason:"subscription", expiresAt: sub.endDate };
```
> Real-time `endDate` comparison (not just stored `status`) closes the gap where the expiry job hasn't run yet. This is the fix for FR-7/FR-8.

### 7.3 Decision matrix
| State | Login / Profile / History | Premium course/test |
| --- | --- | --- |
| Active sub, not expired | ✅ | ✅ |
| FREE plan | ✅ | ❌ (free content only) |
| Expired (`endDate` passed) | ✅ | ❌ → `subscription_expired` |
| Disabled by admin (`CANCELLED`) | ✅ | ❌ → `subscription_disabled` |
| No subscription record | ✅ | ❌ → `no_subscription` |
| Valid course grant (any sub state) | ✅ | ✅ for that course |
| Disabled/expired course grant | ✅ | falls back to platform sub |

### 7.4 Token / session consideration
JWT carries only `userId`; `resolvePremiumAccess` reads live DB state, so disabling/expiry takes effect on the next request — **no need to invalidate tokens**. (Account ban, if implemented later, would use the existing `passwordChangedAt`-style invalidation.)

---

## 8. API Surface (admin)

All under existing `/api/admin` (auth + `authorize("admin")` already applied in `admin.route.js`).

| Method | Path | Purpose | Body |
| --- | --- | --- | --- |
| GET | `/users` | Enriched + filtered list (FR-5/6) | query: `role,search,subStatus,expiringInDays,plan,page,limit` |
| GET | `/users/:id/subscription` | Full subscription + recent payments + audit trail | — |
| POST | `/users/:id/subscription/disable` | Disable premium access (FR-2) | `{ reason }` |
| POST | `/users/:id/subscription/enable` | Re-enable (A7) | `{ endDate?, reason }` |
| POST | `/users/:id/subscription/extend` | Extend (FR-3) | `{ days? , until? , reason }` |
| POST | `/users/:id/subscription/grant` | Grant/change plan (FR-4) | `{ plan, durationDays, reason }` |
| POST | `/users/:id/courses/:courseId/grant` | Grant single course | `{ expiresAt?, reason }` |
| POST | `/users/:id/courses/:courseId/revoke` | Disable a course grant | `{ reason }` |

**Removed/guarded:** `DELETE /users/:id` is removed from normal admin flows (FR-2). Each mutating endpoint writes an `AccessAuditLog` entry.

---

## 9. Admin UI Changes (`frontend/src/pages/admin/Users.jsx`)

### 9.1 Table columns
`User (name + email)` · `Plan` · `Purchase Date` · `Expiry Date` · `Days Left` (chip: green >7, amber ≤7, red expired/disabled) · `Access Status` · `Actions`.

### 9.2 Filter bar (additions to existing search)
- Status dropdown: All / Active / Expiring soon / Expired / No subscription / Disabled.
- "Expiring within" select: 7 / 14 / 30 days.
- Plan dropdown.

### 9.3 Actions (per row, replacing the trash icon)
- **Disable / Enable Access** (toggle) — confirmation modal with required reason.
- **Extend Access** — modal: `+days` or date picker + reason.
- **Manage Plan** — modal: plan + duration + reason.
- A row menu links to a **subscription detail drawer** (history + audit log).

> The destructive delete is removed from the row; "disable" is the safe default that preserves data.

### 9.4 Student profile (`frontend/src/pages/student/…`)
- Subscription card: plan, expiry date, days remaining, renew CTA.
- Expiry banner when `daysRemaining <= 7` or expired (S3/S4).
- Locked premium screens read the structured `403 reason` and render a renew prompt (S2).

---

## 10. Migration (lifetime → time-bound)

1. **Backfill subscriptions:** for each user with lifetime `CourseAccess` or a successful `Payment` and no `Subscription`, create one with `source = MIGRATION`. Choose a policy (decision needed, see §12): either (a) grant a generous transition window (e.g. `endDate = now + 90 days`) so existing paying users aren't cut off, or (b) map to the original plan duration from the last payment.
2. **CourseAccess:** set `expiresAt = null` on existing rows tagged `source = MIGRATION` so legacy purchases keep working until the platform sub governs them — OR set an explicit transition `expiresAt`. (Tied to the §12 decision.)
3. **Communicate** the change and the transition window before enforcing.
4. **Enable expiry job** only after backfill completes.

Migration is a one-off script; it must be idempotent and log a summary (users touched, plans assigned).

---

## 11. Edge Cases & Rules

- **Extending an expired sub** starts the new window at `now` (no retroactive dead time); extending an active sub adds to remaining time (no time lost). (FR-3)
- **FREE plan** never grants premium content; `endDate` is ignored/`null`.
- **Course grant overrides** platform expiry for that course only, and only while the grant itself is valid.
- **Expiry job lag** never causes wrong access because checks compare `endDate` live (§7.2).
- **Disable is instant** for premium, but in-flight requests already authorised are not interrupted (next request is gated).
- **Re-enabling** without an `endDate` and with a past `endDate` should require the admin to also extend, or the user remains effectively expired — the enable modal warns when `endDate` is in the past.
- **Idempotent grants:** repeat grant of the same course updates the existing `CourseAccess` (unique index), it does not error.

---

## 12. Open Decisions (need product input)

1. **Access granularity:** Is premium a single **platform-wide subscription** (recommended — simplest, matches existing `Subscription` model and test gating), or must each course/test-series be **individually time-bound**? The spec supports both but defaults to platform subscription + optional per-course grants.
2. **Migration generosity:** transition window length for existing lifetime/paying users (§10 option a vs b).
3. **Auto-renew:** in scope now, or model-only for a later billing phase?
4. **Hard delete:** keep a separate GDPR "permanently delete" path, or remove entirely?

---

## 13. Acceptance Criteria (summary)

- [ ] Admin user list shows plan, purchase date, expiry date, days left, access status.
- [ ] Admin can filter by status and expiring-within window.
- [ ] Admin can disable, enable, extend, and change plan — each reversible and audit-logged.
- [ ] Disabling a user deletes **no** data; the user can still log in and see profile + full history.
- [ ] Expired/disabled users cannot open premium courses or attempt premium tests; they receive a structured renew prompt.
- [ ] Test expiry is enforced (FR-8 bug fixed).
- [ ] Expiry job + live `endDate` checks keep access correct regardless of job timing.
- [ ] Migration script backfills subscriptions idempotently with a logged summary.
