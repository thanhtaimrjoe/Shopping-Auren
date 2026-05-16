import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_entry = "## [2026-05-17 00:25] - Implement Shopping List UI and Features\n\n**Assignee**: AI Assistant\n**Type**: Feature\n**Related US**: US-012, US-013\n**Impact**: Frontend\n\n### Changes\n- Implemented real integration for the Shopping List tab (frontend/src/app/shopping/page.tsx).\n- Connected the page to shoppingListsApi.getCurrent, generate, updateItem, and addItem.\n- Replaced the hardcoded INITIAL_ITEMS with dynamically fetched data from the user's active shopping list.\n- Added a 'Generate List' fallback state when no active list exists for the current week but a meal plan is available.\n- Added UI for manual item addition (Custom Item) directly from the shopping list view.\n\n### Implementation Details\n- File: frontend/src/app/shopping/page.tsx\n- File: frontend/src/lib/api.ts (Added missing shoppingListsApi endpoints)\n- Reason: Fulfillment of user stories to track checked status of items and allow ad-hoc manual additions.\n- Technical Decision: Used optimistic UI updates for toggling item status to make the checklist feel responsive on mobile devices, falling back to server state on error.\n\n### Testing\n- [x] Verified shopping list generation works using a meal plan.\n- [x] Verified items can be checked/unchecked.\n- [x] Verified manual items can be added with chosen category.\n\n---\n\n"

# Insert right after the header line "---" or "## " if there's no header
parts = content.split("---\n\n## ", 1)
if len(parts) == 2:
    content = parts[0] + "---\n\n" + new_entry + "## " + parts[1]
else:
    print("Could not find insertion point!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changelog updated!")
