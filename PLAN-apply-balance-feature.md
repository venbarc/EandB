# Plan: Apply Patient Balance Amount to Other Entries

## Context
When a user fills in the Patient Balance Amount for the first time on an appointment, they often need to apply the same amount to other appointments for the same patient. Currently, they must open and update each record individually. This feature adds a follow-up prompt after saving that lets users bulk-apply the balance to other entries that don't have one yet.

## Files to Modify

| File | Change |
|------|--------|
| `app/Http/Controllers/AppointmentController.php` | Add `getUnpaidSiblings()` and `bulkUpdatePayments()` methods |
| `routes/web.php` | Add 2 new routes |
| `resources/js/types.ts` | Add `UnpaidSiblingAppointment` interface |
| `resources/js/Components/Modals.tsx` | Add `ApplyBalanceModal` component; modify `UpdateRecordModal` save flow |
| `resources/js/Pages/Dashboard.tsx` | Orchestrate the new modal with state and callbacks |

---

## Step 1: Backend — Two New Endpoints

### 1a. GET `/appointments/{appointment}/unpaid-siblings`
New method `getUnpaidSiblings(Appointment $appointment)` in `AppointmentController`:
- Query appointments with same `patient_name` AND `patient_dob`, excluding the current record
- Filter where `payments IS NULL OR payments = 0`
- Return JSON array with: `id`, `date` (formatted), `provider`, `visitType`, `location`

### 1b. POST `/appointments/bulk-update-payments`
New method `bulkUpdatePayments(Request $request)` in `AppointmentController`:
- Validate: `appointment_ids` (required array of existing IDs), `payments` (required, numeric, min 0.01)
- Safety guard: only update records where `payments IS NULL OR payments = 0` (prevents overwriting if data changed)
- Return JSON success message

### 1c. Register routes in `routes/web.php`
Add both routes inside the existing `auth` middleware group, before the `{appointment}` pattern routes.

---

## Step 2: Frontend — Type Addition

Add to `resources/js/types.ts`:
```typescript
export interface UnpaidSiblingAppointment {
  id: string;
  date: string;
  provider: string;
  visitType: string;
  location: string;
}
```

---

## Step 3: Frontend — New `ApplyBalanceModal` Component

Add in `resources/js/Components/Modals.tsx`:

**Props:** `isOpen`, `onClose`, `amount` (number), `patientName` (string), `appointmentId` (string)

**Behavior:**
1. On open → fetch GET `/appointments/{appointmentId}/unpaid-siblings`
2. If empty result → auto-close (no modal shown)
3. Show list of sibling appointments as checkboxes (all checked by default)
4. Each row displays: date, provider, visit type, location
5. Header: "Do you want to apply $XX.XX to other entries for {patientName}?"
6. "Apply" button → POST `/appointments/bulk-update-payments` with selected IDs and amount → `router.reload()` → close
7. "Skip" button → close
8. Use `axios` (already configured with CSRF) for both requests

---

## Step 4: Frontend — Modify `UpdateRecordModal` Save Flow

In `Modals.tsx`, add optional `onPaymentSaved` prop to `UpdateRecordModalProps`:
```typescript
onPaymentSaved?: (appointmentId: string, amount: number, patientName: string) => void;
```

In `handleSave`, detect first-time payment before the patch call:
- `hadNoPaymentBefore = !record.paidAmount || record.paidAmount === 0`
- `hasPaymentNow = parseFloat(data.payments) > 0`

In `onSuccess`: if both conditions met AND `onPaymentSaved` exists, call it with the record's ID, amount, and patient name. Then proceed with `handleClose()`.

---

## Step 5: Frontend — Dashboard Orchestration

In `Dashboard.tsx`:
1. Add state: `applyBalanceData: { appointmentId, amount, patientName } | null`
2. Pass `onPaymentSaved` callback to `UpdateRecordModal` that sets this state
3. Render `ApplyBalanceModal` with `isOpen={applyBalanceData !== null}`
4. On close, set `applyBalanceData` back to `null`

---

## Verification
1. Open an appointment with no Patient Balance Amount → enter $25 → Save
2. If other appointments exist for the same patient without a balance → modal appears with checkbox list
3. Check/uncheck entries → click Apply → verify selected records now show $25
4. Open a record that already has a balance → change it → Save → follow-up modal should NOT appear
5. Test with a patient that has only one appointment → follow-up modal should NOT appear (auto-closes)