import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_entry = "## [2026-05-17 01:15] - Improve Meal Selection Modal UI\n\n**Assignee**: AI Assistant\n**Type**: UI/UX Refactor\n**Impact**: Frontend\n\n### Changes\n- Applied the same visual feedback logic to the Meal Selection modal as the Product modal.\n- Meals now show a `CheckCircle` icon and a highlighted background when selected for a specific day.\n- Replaced `handleSelectMeal` with `handleToggleMeal`, allowing users to both add and remove meals directly from within the modal grid.\n- Added a \"Xong\" button to the Meal modal to allow multi-selection before closing.\n\n### Implementation Details\n- File: `frontend/src/app/page.tsx`\n- Reason: Consistency in UI design across different modals and improving the user experience for planning multiple meals.\n- Technical Decision: Used a toggle pattern instead of simple add-and-close to reduce the number of clicks required when filling out a week's schedule.\n\n### Testing\n- [x] Verified meals can be toggled on/off within the modal.\n- [x] Verified visual state (checkmarks) updates in real-time.\n- [x] Verified \"Xong\" button closes the modal correctly.\n\n---\n\n"

parts = content.split("---\n\n## ", 1)
if len(parts) == 2:
    content = parts[0] + "---\n\n" + new_entry + "## " + parts[1]
else:
    print("Could not find insertion point!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changelog updated!")
