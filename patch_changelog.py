import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_entry = "## [2026-05-17 00:35] - Fix Shopping List not loading planned meals\n\n**Assignee**: AI Assistant\n**Type**: Bugfix\n**Related US**: US-012\n**Impact**: Frontend, Backend\n\n### Changes\n- Updated `shoppingListsApi.generate` to allow updating an existing empty/active shopping list instead of failing with 409 Conflict.\n- Added a `Sync Plan` button to the Shopping List UI to allow users to manually pull in the latest meals from their weekly plan.\n- Filtered out soft-deleted meals from the ingredient extraction process during shopping list generation.\n\n### Implementation Details\n- File: `backend/app/api/v1/shopping_lists.py` (Modified `generate_list` endpoint)\n- File: `frontend/src/app/shopping/page.tsx` (Added `Sync Plan` button)\n- Reason: Previously, if a user viewed the shopping list before adding meals to their plan, an empty list was created. Subsequent attempts to generate ingredients were blocked by a 409 error. Additionally, there was no UI to trigger a re-sync if the plan changed.\n- Technical Decision: Allow the `generate` endpoint to gracefully delete old `source_type=meal` items and insert new ones while preserving `source_type=manual` custom items. This makes the shopping list robust and self-healing.\n\n### Testing\n- [x] Verified `Sync Plan` button correctly updates the shopping list items without duplicating.\n- [x] Verified manual custom items are preserved during sync.\n\n---\n\n"

# Insert right after the header line "---" or "## " if there's no header
parts = content.split("---\n\n## ", 1)
if len(parts) == 2:
    content = parts[0] + "---\n\n" + new_entry + "## " + parts[1]
else:
    print("Could not find insertion point!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changelog updated!")
