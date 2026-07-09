# User Stories — Shopping Memo

**Date Created**: 2026-05-09  
**Project**: Shopping Memo  
**Purpose**: Definition of User Stories, Acceptance Criteria, and QA/Technical Requirements

---

## User Personas

### Persona 1: Tai (Main User)
- **Role**: Meal Planner
- **Goal**: Plan weekly meals and shop efficiently.
- **Tech Level**: Intermediate (Developer)
- **Frequency**: Once a week (planning on weekends, shopping mid-week).

### Persona 2: Girlfriend (Sub User)
- **Role**: Shopper
- **Goal**: Shop using the planned checklist.
- **Tech Level**: Beginner (General User)
- **Frequency**: 1-2 times a week (during shopping).

---

## Epic 1: Authentication & User Management

### US-001: User Registration
**As a** New User  
**I want to** create an account  
**So that** I can start using the app

#### Acceptance Criteria
- [ ] User can register using an Email address and Password.
- [ ] User can enter a Display Name (`display_name`).
  - *QA Note (Validation)*: Must be trimmed, max 50 characters, and cannot be empty.
- [ ] Password must be at least 8 characters long.
  - *QA Note (Security)*: Should enforce at least one uppercase letter, one number, and one special character.
- [ ] A confirmation email is sent upon registration.
  - *QA Note (UX/System)*: UI must disable the submit button and show a loading state while sending the email to prevent double-clicks.
- [ ] User can log in only after confirming the email.

#### Technical Requirements
- Use Supabase Auth.
- Email confirmation is mandatory.
- *System/Tech*: Implement rate limiting on the registration endpoint to prevent spam account creation and email bombing.

---

### US-002: User Login
**As a** Registered User  
**I want to** log in  
**So that** I can access my data

#### Acceptance Criteria
- [ ] User can log in with Email and Password.
- [ ] `display_name` is shown after a successful login.
- [ ] Login session is maintained (e.g., 7 days).
- [ ] Clear error messages are displayed on login failure.
  - *QA Note (Security)*: Use a generic message like "Invalid email or password" to prevent email enumeration attacks. Do not specify which one is wrong.
- [ ] Password reset functionality is available.

#### Technical Requirements
- *System/Tech*: Implement account lockout or throttling after N consecutive failed login attempts (brute-force protection).
- Securely store JWT tokens.

---

## Epic 2: Meal Management

### US-003: Create a new meal
**As a** User
**I want to** create a new meal
**So that** I can use it in my meal plans

#### Acceptance Criteria
- [ ] User can enter a Meal Name.
  - Required field.
  - Must be trimmed. Empty or whitespace-only names are invalid.
  - Maximum 100 characters.
  - If the name already exists, show a warning toast but allow creation (do not block).
- [ ] User can enter an Ingredients list (JSONB array of strings).
  - Optional field (empty array `[]` is allowed).
  - Maximum 50 items. Each item maximum 100 characters.
  - If input via textarea, UI/Backend must trim and filter out empty lines before saving as an array.
- [ ] User can select a Category (washoku / yoshoku / chuka / other).
  - Required field. Default value should be "other".
- [ ] On successful registration, show a "Successfully created" Toast message and clear the form to allow entering the next meal (or redirect to the Meal List).
- [ ] Prevent double-submission (disable button and show loading state during API call).

#### Technical Requirements
- `POST /api/v1/meals`
- Must extract `user_id` from the JWT token (current session) to assign ownership. Do NOT accept `user_id` from the request body to prevent IDOR.
- Response should be `201 Created` returning the newly created Meal object.
- Implement rate limiting or idempotency key to prevent race conditions (double-clicks).

---

### US-004: Edit a meal
**As a** User
**I want to** edit an existing meal
**So that** I can keep my meal information up to date

#### Acceptance Criteria
- [ ] User can change the Meal Name.
- [ ] User can change the Ingredients list.
- [ ] User can change the Category.
- [ ] All validation rules from US-003 apply here (required fields, lengths, trim, max items, etc.).
- [ ] On successful save, changes are reflected immediately.

#### Technical Requirements
- `PATCH /api/v1/meals/{meal_id}` (or `PUT` requiring full payload).
- Must check ownership: `WHERE id = {meal_id} AND user_id = {current_user_id}` from JWT token. Return 403/404 if unauthorized.
- Consider optimistic locking (e.g., using `updated_at`) to handle concurrent edits if applicable.

---

### US-005: Delete a meal
**As a** User
**I want to** delete an unnecessary meal
**So that** I can organize my meal list

#### Acceptance Criteria
- [ ] A confirmation dialog is displayed before deletion.
- [ ] On confirmation, the meal is removed from the active list.
- [ ] **Soft Delete**: The meal is NOT permanently deleted from the database (to preserve historical meal plans and foreign keys). Only `deleted_at` is set.
- [ ] If Hard Delete is strictly required, the system MUST check if the meal is used in any active Meal Plan and prevent deletion if true (show error: "In use by a meal plan").

#### Technical Requirements
- `DELETE /api/v1/meals/{meal_id}`
- Must check ownership: `WHERE id = {meal_id} AND user_id = {current_user_id}` from JWT token. Return 403/404 if unauthorized.
- Implement Soft Delete logic in the backend.

---

### US-006: View meal list
**As a** User
**I want to** view the list of registered meals
**So that** I can see what meals are available

#### Acceptance Criteria
- [ ] The list of registered meals is displayed.
- [ ] If no meals exist, display an Empty State UI with a "Create first meal" call-to-action button.
- [ ] User can filter the list by Category.
- [ ] User can search by Meal Name (Partial match, case-insensitive).
- [ ] User can sort by creation date or name.
- [ ] The list must support Pagination (or Infinite Scroll) to prevent performance issues with large datasets.

#### Technical Requirements
- `GET /api/v1/meals`
- Must include query parameters for pagination: `limit` and `offset` (or `page` and `size`).
- Must include query parameters for search/filter: `q` (for name search) and `category`.
- Must filter by `user_id` from JWT token to only return the user's own meals.

---

## Epic 3: Product Management

### US-007: Create a new product
**As a** User  
**I want to** register a daily necessity (Product)  
**So that** I can add it to my shopping list

#### Acceptance Criteria
- [ ] User can enter a Product Name.
  - Required field.
  - Must be trimmed. Empty or whitespace-only names are invalid.
  - Maximum 100 characters.
- [ ] User can provide an `image_url` for the product.
  - Optional field.
  - Must validate as a proper HTTP/HTTPS URL.
  - UI should display a fallback image if the URL is broken or empty.
  - *Note for UI/Flow: If users upload files (instead of pasting URLs), UI must show a loading state during the upload process.*
- [ ] User can select a Category (daily necessity / consumable / other).
  - Required field. Default value should be "other".
- [ ] On successful registration, the product is displayed in the product list.

#### Technical Requirements
- `POST /api/v1/products`
- (If supporting file uploads): Requires a separate `POST /api/v1/storage/upload` endpoint to upload the image to Cloud Storage (Supabase Storage) and return the URL before calling the products API.
- Must extract `user_id` from the JWT token to assign ownership. Prevent IDOR.

---

### US-008: Edit and delete a product
**As a** User  
**I want to** edit or delete a registered product  
**So that** I can manage my product list

#### Acceptance Criteria
- [ ] **Edit**: User can change the Product Name, `image_url`, and Category.
  - All validation rules from US-007 apply (required, max length, URL format).
- [ ] **Delete**: A confirmation dialog is displayed before deletion.
- [ ] **Delete**: **Soft Delete** is highly recommended. The product should NOT be permanently deleted from the database to preserve historical shopping list data. Set `deleted_at` instead.
- [ ] **Delete**: If Hard Delete is strictly enforced, the system MUST verify the product is not in any active or historical shopping list before allowing deletion.

#### Technical Requirements
- `PATCH /api/v1/products/{product_id}` (for updates)
- `DELETE /api/v1/products/{product_id}` (for deletion)
- Must check ownership: `WHERE id = {product_id} AND user_id = {current_user_id}` from JWT token. Return 403/404 if unauthorized.
- **Storage Cleanup**: If `image_url` changes or the product is deleted, the backend should asynchronously delete the old physical image file from Cloud Storage to prevent storage bloat.

---

## Epic 4: Meal Planning

### US-009: Plan meals for next week
**As a** User  
**I want to** plan meals for the upcoming week (Monday to Sunday)  
**So that** I can generate a shopping list

#### Acceptance Criteria
- [ ] Displays 7 slots for Monday through Sunday.
- [ ] User can assign up to 3 meals per day.
- [ ] User can select from the registered meal list.
- [ ] On save, the plan is confirmed.
- *QA Note (UX)*: User should be able to clear or remove a meal from a specific day easily (Clear button).
- *QA Note (Data)*: Exclude Soft-Deleted meals from the selection list.

#### Technical Requirements
- `GET /api/v1/meal-plans/current` (Fetch the user's latest plan)
- `POST /api/v1/meal-plans` — Request body: `{ meals: [{ day_of_week, meal_id }] }`
- *System/Tech*: Ensure Timezone handling is consistent. The backend should normalize dates based on the user's local timezone to prevent Monday/Sunday boundaries from shifting due to UTC offsets.

---

### US-010: Edit a meal plan
**As a** User  
**I want to** change the planned meals  
**So that** I can adjust to schedule changes

#### Acceptance Criteria
- [ ] User can change, add, or remove meals from an existing plan.
- [ ] On save, the shopping list should reflect these changes.
- *QA Note (Logic)*: If an Active Shopping List *already exists* for this week, changing the meal plan causes a data discrepancy. The UI MUST display a warning: "You have an active shopping list. Saving these changes means you need to regenerate the list."

#### Technical Requirements
- `PUT /api/v1/meal-plans/{plan_id}`
- Must check ownership to prevent IDOR.
- *System/Tech*: Use a database transaction to ensure either all 7 days save successfully, or none do (avoid partial updates).

---

## Epic 5: Shopping List

### US-011: Generate a manual shopping list draft
**As a** User  
**I want to** view and edit a draft list before creating the final shopping checklist  
**So that** I can control exactly what goes into the list and know which ingredients are for which meals

#### Acceptance Criteria
- [ ] A "Generate Shopping List" button exists on the Meal Plan page.
- [ ] Clicking it opens a "Create shopping list" modal (draft mode) rather than creating it instantly.
- [ ] The modal displays draft items generated from the current Meal Plan. Each ingredient is a separate row.
  - *QA Note (UX)*: If multiple meals require "Carrots", should they be combined? The Dev team must clarify if identical ingredients are merged or listed separately to prevent UI clutter.
- [ ] User can edit item names, delete items, or select/deselect items for the final checklist.
- [ ] Each ingredient row displays a note: "Used for: [Meal Name]".
- [ ] User can manually add a meal (appends its ingredients to the draft).
- [ ] User can manually add a standalone product to the draft.
- [ ] Clicking "Create checklist" deletes the old active list (if any) and creates a new one from the draft.
- [ ] Display a success notification upon creation.

#### Technical Requirements
- `POST /api/v1/shopping-lists/generate`
- Logic Flow: Build draft -> User modifies -> Confirm -> Delete existing active list -> Create new list.
- *System/Tech*: The deletion of the old list and the creation of the new list MUST be wrapped in a single Database Transaction to prevent orphaned records or data loss if an error occurs mid-way.

---

### US-012: Check items off the shopping list
**As a** User  
**I want to** check items while shopping  
**So that** I don't forget anything

#### Acceptance Criteria
- [ ] User can tap an item to toggle its checked state.
- [ ] Checked items are visually distinct (e.g., strikethrough, grayed out).
- [ ] Checked state is saved in real-time.
- [ ] A completion notification/celebration appears when all items are checked.
- [ ] Displays the `note` ("Used for: ...") under the item row for meal-derived items.
- *QA Note (System/UX)*: Supermarkets often have poor network reception. The UI must implement **Optimistic Updates** (visually check the item immediately) and gracefully handle network errors (revert the check and show an error toast) if the API call fails.

#### Technical Requirements
- `PATCH /api/v1/shopping-lists/{list_id}/items/{item_id}`
- Request body: `{ checked: true }`
- *System/Tech*: Debounce or queue rapid check/uncheck actions to avoid spamming the backend API.

---

### US-013: Manually add items to an active list
**As a** User  
**I want to** add extra items directly to the list  
**So that** I can buy unplanned things

#### Acceptance Criteria
- [ ] User can enter an item name and add it to the active list.
  - Must be trimmed, max 100 characters, required.
- [ ] User can select a category.
- [ ] The item appears in the list immediately.

#### Technical Requirements
- `POST /api/v1/shopping-lists/{list_id}/items`
- Verify `list_id` ownership via JWT.

---

## Epic 6: History (Nice to Have)

### US-014: View past shopping history
**As a** User  
**I want to** view my shopping history for the past 2 weeks  
**So that** I can see what I bought

#### Acceptance Criteria
- [ ] Completed shopping lists are shown in the history.
- [ ] Displays the week's date range (from-to).
- [ ] User can view details of each historical list.
- [ ] Clearly distinguishes checked vs. unchecked items.
- [ ] User can delete an entire completed list (for test workflows). Confirmation dialog required.
- [ ] User can delete an individual item from a history list.
- [ ] After deleting a history item, the detail view, `total_items`, and `checked_items` counts are correctly updated.
- [ ] If all items are deleted from a completed history list, the history list itself remains visible with `total_items = 0`.

#### Technical Requirements
- `POST /api/v1/shopping-lists/{list_id}/complete` — body: `{ week_from_date, week_to_date }`
- `GET /api/v1/shopping-lists/history?weeks=2`
- `DELETE /api/v1/shopping-lists/{list_id}` — Only completed lists can be deleted. Cascades to `shopping_items`.
- `DELETE /api/v1/shopping-lists/{list_id}/items/{item_id}` — Deletes an item. For completed lists, `snapshot_json` must be synchronized.

---

## Epic 7: Meal Suggestions (Obsolete)

> **2026-05-24**: US-015 (Meal suggestions) is out of scope. APIs and implementation removed. Meal planning is manual.

### US-015: Get meal suggestions — **Obsolete / Not Implemented**
**Status**: Deprecated (Removed from scope)

---

## Priority Matrix

| Epic | Priority | MVP | Effort |
|------|----------|-----|--------|
| Epic 1: Auth | 🔴 High | ✅ Yes | Medium |
| Epic 2: Meals | 🔴 High | ✅ Yes | Medium |
| Epic 3: Products | 🔴 High | ✅ Yes | Low |
| Epic 4: Meal Plan | 🔴 High | ✅ Yes | High |
| Epic 5: Shopping List | 🔴 High | ✅ Yes | High |
| Epic 6: History | 🟡 Medium | ❌ No | Medium |
| Epic 7: Suggestions | — | ❌ Obsolete | — |

---

## Next Steps

1. **Create Screen List** → `03_design/screen_list.md`
2. **Design Database Schema** → `03_design/database_schema.md`
3. **Create API Spec** → `04_api/api_spec.md`

---

**Author**: AI Assistant + Tai  
**Review Date**: 2026-05-09  
**Status**: ✅ Draft