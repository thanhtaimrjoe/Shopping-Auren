import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_entry = "## [2026-05-17 00:55] - Add Extra Products section to Weekly Plan\n\n**Assignee**: AI Assistant\n**Type**: Feature\n**Related US**: US-013\n**Impact**: Frontend, Backend\n\n### Changes\n- Added a \"Mua thêm (Products)\" section to the Weekly Plan page (`/`).\n- Users can now select items from their Product library directly while planning their week.\n- Integrated `extraProducts` with the active shopping list using the `addItem` and `deleteItem` endpoints.\n- Added a new `DELETE /api/v1/shopping-lists/{list_id}/items/{item_id}` endpoint to the backend.\n\n### Implementation Details\n- File: `backend/app/api/v1/shopping_lists.py` (Added `delete_item` endpoint)\n- File: `frontend/src/app/page.tsx` (Added \"Mua thêm\" UI and logic)\n- Reason: Buying groceries involves more than just meal ingredients. Allowing users to pick products from their library while viewing their weekly schedule improves the planning experience.\n- Technical Decision: Instead of creating a new schema for \"Extra Plan Items\", we leverage the existing active shopping list. Selecting a product in the Weekly Plan tab immediately adds it to the Shopping List in the background. If no list exists, it is automatically generated.\n\n### Testing\n- [x] Verified products can be added to the shopping list from the Weekly Plan tab.\n- [x] Verified products can be removed.\n- [x] Verified integration between the two tabs (added items appear in Shopping List checklist).\n\n---\n\n"

parts = content.split("---\n\n## ", 1)
if len(parts) == 2:
    content = parts[0] + "---\n\n" + new_entry + "## " + parts[1]
else:
    print("Could not find insertion point!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changelog updated!")
