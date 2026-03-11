# INSARK NSS

## Current State
Volunteers register and are stored in the stable `volunteers` map. Coordinators are created by admin and stored in the stable `coordinators` map. Sessions are persisted in localStorage. However, the `accessControlState` (which tracks `#user` role per-principal) is NOT stable -- it lives in heap memory and is wiped on every canister upgrade (redeployment). When the app is redeployed, all previously logged-in users lose their role in `accessControlState`, causing backend calls requiring `#user` permission (like `getAllVolunteers`) to fail with "Unauthorized". The frontend catches this as an empty array, showing "0 registered volunteers".

## Requested Changes (Diff)

### Add
- Backend helper `isAuthenticatedUser(caller)` that checks BOTH the ephemeral `accessControlState` AND the stable `userProfiles` map -- so auth survives redeployments
- Auto role re-assignment: when `userProfiles` has an entry for caller but `accessControlState` does not, automatically re-add `#user` role before serving the request
- Frontend: on app startup when a stored session is found, silently call `loginVolunteer` or `loginCoordinator` to re-establish the backend role

### Modify
- All backend functions that check `AccessControl.hasPermission(accessControlState, caller, #user)` to use the new `isAuthenticatedUser(caller)` helper instead
- `App.tsx`: add silent re-auth effect that fires after actor is ready

### Remove
- Nothing

## Implementation Plan
1. Update `backend/main.mo`: add `isAuthenticatedUser` private func, replace all `#user` permission checks with it
2. Update `frontend/src/App.tsx`: add useEffect that silently calls loginVolunteer/loginCoordinator when session is restored from localStorage and actor becomes ready
