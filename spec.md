# INSARK NSS

## Current State
The backend stores all data (volunteers, coordinators, events, attendance, etc.) in plain `let` Map bindings and a non-stable `idCounter`. These are reset to empty on every redeployment, wiping all registered volunteers, coordinators, and other data. This is why the coordinator portal shows 0 registered volunteers after each build.

## Requested Changes (Diff)

### Add
- Nothing new to add.

### Modify
- Change all data maps (`volunteers`, `coordinators`, `events`, `attendances`, `serviceHours`, `photos`, `certificates`, `feedbacks`, `notifications`, `notificationReads`, `chatMessages`, `userProfiles`, `emailToPrincipal`) from `let` to `stable let` so data persists across redeployments.
- Change `var idCounter : Nat = 0` to `stable var idCounter : Nat = 0` so IDs do not reset.

### Remove
- Nothing to remove.

## Implementation Plan
1. In `src/backend/main.mo`, prefix all data map declarations with `stable`.
2. Change `var idCounter` to `stable var idCounter`.
