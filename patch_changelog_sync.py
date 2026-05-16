import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_entry = "## [2026-05-17 00:42] - Fix Sync Plan button disappearing\n\n**Assignee**: AI Assistant\n**Type**: Bugfix\n**Related US**: US-012\n**Impact**: Frontend\n\n### Changes\n- Updated etchCurrentList logic in shopping/page.tsx to unconditionally fetch the current meal plan's ID, even if an active shopping list already exists.\n\n### Implementation Details\n- File: rontend/src/app/shopping/page.tsx\n- Reason: The currentMealPlanId was previously only populated if shoppingListsApi.getCurrent() returned a 404. When a shopping list existed, the ID was null, causing the Sync Plan button to be hidden.\n- Technical Decision: Independent execution of both queries ensures the UI has access to all related weekly data (shopping list & meal plan), keeping action buttons consistently visible.\n\n### Testing\n- [x] Verified Sync Plan button is always visible when there is an active meal plan, regardless of shopping list existence.\n\n---\n\n"

parts = content.split("---\n\n## ", 1)
if len(parts) == 2:
    content = parts[0] + "---\n\n" + new_entry + "## " + parts[1]
else:
    print("Could not find insertion point!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changelog updated!")
