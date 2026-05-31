# Production Review — Shopping Memo

**Date**: 2026-05-30  
**Reviewer**: AI Assistant  
**Scope**: Public production frontend/backend smoke review and authenticated workflow review  
**Frontend**: https://shopping-memo-frontend-oefakwrmdq-as.a.run.app  
**Backend**: https://shopping-memo-backend-oefakwrmdq-as.a.run.app

---

## Summary

The production services are reachable, public authentication screens render correctly, and the authenticated core workflow works end-to-end: meal plan display, shopping list generation, item check, manual item add, completion, and history creation.

Several improvements remain: auth field autocomplete, consistent validation, production docs exposure policy, backend root response, consistent UI language, clearer current-shopping-list empty-state handling, and more direct history navigation.

---

## Verified

- Frontend `/` redirects to `/login` for unauthenticated users.
- Frontend `/meals` redirects to `/login` for unauthenticated users.
- Login screen renders with email, password, password visibility toggle, forgot password link, sign-in button, and create-account button.
- Register mode renders with display name, email, and password fields.
- Reset password screen renders at `/reset-password`.
- Mobile login layout renders at `390x844` without obvious layout breakage.
- Backend `/health` returns `200` with `{"status":"ok","version":"0.1.0"}`.
- Backend `/docs` and `/openapi.json` are publicly reachable.
- OpenAPI exposes the expected meals, products, meal-plans, and shopping-lists endpoints.
- Protected backend endpoints declare `HTTPBearer` security in OpenAPI.
- Authenticated login succeeds with the provided production account.
- Meals library loads existing meal data and pagination.
- Created production test meals and products with `Codex Test` prefix.
- Updated the current meal plan with Monday and Wednesday meals.
- Generated a shopping list from meal plan ingredients plus products.
- Shopping list showed grouped meal ingredients and extra products.
- Checking an item updates progress from `0 / 11` to `1 / 11`.
- Manual item add works and updates progress to `1 / 12`.
- Finish shopping flow accepts a date range and moves the active list to history.
- History page shows the completed list for `May 25, 2026 — May 31, 2026`.

Production test data created:

- Meals:
  - `Codex Test Ca kho 2026-05-30-2313`
  - `Codex Test Canh rau 2026-05-30-2313`
  - `Codex Test Ga ap chao 2026-05-30-2313`
  - `Codex Test Probe`
- Products:
  - `Codex Test Khan giay 2026-05-30-2313`
  - `Codex Test Nuoc rua chen 2026-05-30-2313`
- Shopping item:
  - `Codex Test Manual Item`

---

## Recommended Fixes

### P1 — Improve current shopping-list empty-state handling

**Issue**: After login, the browser console showed a failed request for `GET /api/v1/shopping-lists/current` with `404` when no active shopping list existed. The UI eventually handles the empty state, but the network error is noisy and can hide real failures.

**Recommendation**:

- Treat "no current shopping list" as an expected state, either by returning `200` with `null`/empty data or by handling the `404` without logging it as an error in normal operation.
- Keep true API failures visible with a distinct user-facing error state.

**Acceptance criteria**:

- A user with no active shopping list sees the existing empty-state UI.
- Browser console does not show a normal no-list state as an error.
- Unexpected backend/network failures still show actionable error feedback.

---

### P1 — Make shopping list generation idempotent or clearly guarded

**Issue**: The Weekly Plan page shows `Generate shopping list` whenever there are planned meals/products. During review, generating by API created an active list; the Weekly Plan button still appeared active when returning to the plan. This can lead to duplicate generation or user uncertainty unless the frontend/backend already guards it.

**Recommendation**:

- If an active list already exists for the current meal plan, change the CTA to `View shopping list` or `Regenerate shopping list`.
- If regeneration is supported, show a confirmation explaining that it will replace or update the active list.
- Backend should reject or idempotently update duplicate active-list generation for the same plan.

**Acceptance criteria**:

- Users cannot accidentally create duplicate active shopping lists for the same meal plan.
- The CTA clearly reflects whether a list already exists.
- Regeneration behavior is explicit and tested.

---

### P2 — Add direct History navigation

**Issue**: The spec lists History as a main sidebar destination, but production only exposes Shopping history inside Settings. After completing a shopping trip, history is important enough to be a first-class navigation item.

**Recommendation**:

- Add `History` back to the sidebar, or intentionally update the spec/decision log if History should live under Settings.
- Ensure `/history` has an active navigation state.

**Acceptance criteria**:

- Users can reach shopping history directly from the main navigation.
- Current route highlighting works on `/history`.
- Spec and implementation agree.

---

### P2 — Add autocomplete attributes to auth fields

**Issue**: Browser console reports missing autocomplete attributes on password inputs.

Observed console message:

```text
Input elements should have autocomplete attributes (suggested: "current-password")
```

**Recommendation**:

- Login email: `autocomplete="email"`
- Login password: `autocomplete="current-password"`
- Register display name: `autocomplete="name"`
- Register email: `autocomplete="email"`
- Register password: `autocomplete="new-password"`
- Reset password email: `autocomplete="email"`

**Acceptance criteria**:

- Browser console no longer reports autocomplete warnings on auth pages.
- Password managers can correctly identify login and registration fields.

---

### P2 — Use consistent custom validation for invalid email format

**Issue**: Empty login fields show clear inline messages, but invalid email format appears to rely on native browser validation and does not show a consistent app-level error in the captured snapshot.

Current good behavior:

- Empty email shows `Email is required`.
- Empty password shows `Password is required`.

**Recommendation**:

- Add explicit email format validation.
- Show a consistent inline error such as `Please enter a valid email address`.
- Apply the same validation style to login, register, and reset password forms.

**Acceptance criteria**:

- Invalid email format shows an inline app-styled error.
- Submit is blocked until the email format is valid.
- Error presentation is consistent across auth screens.

---

### P2 — Decide production exposure for Swagger docs

**Issue**: Backend `/docs` is publicly reachable in production.

This may be acceptable for a small personal app, but it increases public API discoverability.

**Recommendation**:

Choose one policy:

- Keep `/docs` public intentionally and document that decision.
- Disable docs in production.
- Protect docs with authentication or basic auth.
- Expose docs only in staging/development.

**Acceptance criteria**:

- Production docs exposure is an explicit decision.
- If disabled/protected, `/docs` is not publicly accessible without authorization.

---

### P3 — Add a useful backend root response

**Issue**: Backend `/` currently returns `404`.

This is not a functional bug, but a public Cloud Run service root should provide a minimal service response for easier smoke testing.

**Recommendation**:

Return a small JSON payload from `/`, for example:

```json
{
  "service": "Shopping Memo API",
  "health": "/health",
  "docs": "/docs"
}
```

**Acceptance criteria**:

- `GET /` returns `200`.
- Response does not expose secrets or environment details.

---

### P3 — Choose a consistent UI language

**Issue**: The project specs mix Japanese and Vietnamese, while production UI currently mixes English, Vietnamese, and Japanese. Examples observed:

- Sidebar/auth/settings are mostly English.
- Meal plan buttons and shopping item notes use Vietnamese, such as `Thêm món`, `Mua thêm`, and `Dùng cho món`.
- Shopping-list add toast uses Japanese: `アイテムを追加しました。`.

**Recommendation**:

- Decide the primary user-facing language.
- If the target users are Tai and partner, consider Vietnamese or a simple bilingual strategy.
- Keep labels, errors, buttons, and empty states consistent.

**Acceptance criteria**:

- Auth and main app screens use the chosen language consistently.
- Future UI copy changes follow the same language policy.

---

### P3 — Keep a reusable seeded review account or fixture

**Issue**: Authenticated review is now possible with the provided account, but repeatable reviews would be safer with a dedicated disposable fixture account and reset script.

**Recommendation**:

- Create a dedicated review account that is not a personal account.
- Add a small seed/reset script for review data using a clear prefix such as `Codex Test`.
- Document how to remove or reset test data.

**Acceptance criteria**:

- Another AI/developer can reset the review account to a known state.
- Test data is disposable and clearly separated from real personal data.

---

## Follow-up Review Needed

These areas were partially reviewed and should be checked more deeply when implementing fixes:

- Meal creation, editing, filtering, sorting, and deletion
- Product creation, inline editing, filtering, and deletion
- Weekly meal plan assignment and save behavior
- Duplicate/regenerate behavior for shopping list generation
- Shopping list item uncheck, delete, search/filter, and mobile use in a real store
- History detail view behavior after selecting a completed list
- Empty states and loading/error states for each page
- Session persistence across browser restarts using a normal persistent browser profile
