# Phase D Manual Validation Run Sheet

**Phase:** P2 Phase D  
**Purpose:** Execute and record two-device manual validation for unlink/recovery, profile/settings persistence, and notification deep-link reliability.  
**Reference matrix:** `MANUAL_TESTING_GUIDE_SPRINT6.md` -> `## 16) Phase D Verification`

---

## 1) Run Metadata

- Date:
- Tester:
- Build/Commit:
- Environment:
- Device A (Account A):
- Device B (Account B):
- Backend base URL:

---

## 2) Preconditions Checklist

- [ ] Latest backend + app build deployed on both devices.
- [ ] Account A and Account B are available and can authenticate.
- [ ] Accounts are linked as an active couple for baseline scenarios.
- [ ] Push permissions are enabled on both devices.
- [ ] Push token registration confirmed for both users.
- [ ] One active-session scenario prepared and one no-active-session scenario prepared.
- [ ] Evidence folder prepared (screenshots/videos named by case ID).

Evidence folder path:

- ``

---

## 3) Execution Order (Strict)

1. `D-1601` baseline relationship/settings hydration
2. `D-1602` unlink preview + confirmation
3. `D-1603` active-session unlink guard
4. `D-1604` cooldown recovery
5. `D-1605` cooldown relink restrictions
6. `D-1606` profile edit persistence + validation
7. `D-1607` notification preferences persistence + validation
8. `D-1608` continue-game deep-link routing
9. `D-1609` partner-progress deep-link routing
10. `D-1610` results-ready deep-link routing
11. `D-1611` duplicate push suppression sanity

---

## 4) Case Results

| Case ID | Status (Pass/Fail/Blocked) | Evidence file(s) | Observed behavior | Expected behavior | Defect ID |
| ------- | -------------------------- | ---------------- | ----------------- | ----------------- | --------- |
| D-1601  |                            |                  |                   |                   |           |
| D-1602  |                            |                  |                   |                   |           |
| D-1603  |                            |                  |                   |                   |           |
| D-1604  |                            |                  |                   |                   |           |
| D-1605  |                            |                  |                   |                   |           |
| D-1606  |                            |                  |                   |                   |           |
| D-1607  |                            |                  |                   |                   |           |
| D-1608  |                            |                  |                   |                   |           |
| D-1609  |                            |                  |                   |                   |           |
| D-1610  |                            |                  |                   |                   |           |
| D-1611  |                            |                  |                   |                   |           |

---

## 5) Optional API Snapshot Log

Use placeholders only; do not store real secrets in git-tracked files.

```bash
# Example environment placeholders (local terminal only)
export BASE_URL="https://your-backend-host"
export TOKEN_ACCOUNT_A="your_jwt_here"
export TOKEN_ACCOUNT_B="your_jwt_here"
```

```bash
# Couple status
curl -sS -H "Authorization: Bearer ${TOKEN_ACCOUNT_A}" \
  "${BASE_URL}/api/couple/status"

# Unlink preview
curl -sS -X POST -H "Authorization: Bearer ${TOKEN_ACCOUNT_A}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "${BASE_URL}/api/couple/unlink"

# Unlink confirmation (replace token from preview response)
curl -sS -X POST -H "Authorization: Bearer ${TOKEN_ACCOUNT_A}" \
  -H "Content-Type: application/json" \
  -d '{"confirmationToken":"UNLINK_CONFIRM"}' \
  "${BASE_URL}/api/couple/unlink"

# Recover previous partner
curl -sS -X POST -H "Authorization: Bearer ${TOKEN_ACCOUNT_A}" \
  "${BASE_URL}/api/couple/recover"

# Profile update
curl -sS -X PUT -H "Authorization: Bearer ${TOKEN_ACCOUNT_A}" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","bio":"Phase D validation bio"}' \
  "${BASE_URL}/api/user/profile"

# Preferences update
curl -sS -X PUT -H "Authorization: Bearer ${TOKEN_ACCOUNT_A}" \
  -H "Content-Type: application/json" \
  -d '{"timezone":"UTC","reminderTimeLocal":"21:00","quietHoursStart":"23:00","quietHoursEnd":"07:00"}' \
  "${BASE_URL}/api/user/preferences"

# Results fetch (replace session UUID)
curl -sS -H "Authorization: Bearer ${TOKEN_ACCOUNT_A}" \
  "${BASE_URL}/api/game/<session-id>/results"
```

Snapshot files captured:

- [ ] `GET /api/couple/status`
- [ ] `POST /api/couple/unlink` (preview)
- [ ] `POST /api/couple/unlink` (confirm)
- [ ] `POST /api/couple/recover`
- [ ] `PUT /api/user/profile`
- [ ] `PUT /api/user/preferences`
- [ ] `GET /api/game/{sessionId}/results`

---

## 6) Defect Summary

- Total failures:
- Total blocked:
- Critical defects:
- High defects:

Defect notes:

-

---

## 7) Retest Summary

- Retest required: Yes/No
- Retest build/commit:
- Retest result:

---

## 8) Final Recommendation

- Ready for Phase D sign-off: Yes/No
- Notes:
