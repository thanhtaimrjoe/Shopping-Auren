import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_entry = "## [2026-05-17 01:05] - Refactor Extra Products to Modal Grid View\n\n**Assignee**: AI Assistant\n**Type**: UI/UX Refactor\n**Related US**: US-013\n**Impact**: Frontend\n\n### Changes\n- Replaced the inline product library in the Weekly Plan tab with a dedicated Modal window.\n- Added a \"Thêm sản phẩm\" button to open the library.\n- Implemented a Grid View for the product library modal for easier browsing and selection.\n- Integrated multi-selection visual feedback (CheckCircle icon) inside the modal.\n\n### Implementation Details\n- File: `frontend/src/app/page.tsx`\n- Reason: Showing the entire database of products inline takes up too much vertical space and cluttered the weekly schedule view.\n- Technical Decision: Used a full-screen blurred backdrop modal with a responsive CSS grid (2 to 4 columns) to provide a modern, dashboard-like feel for selecting extra items.\n\n### Testing\n- [x] Verified modal opens/closes correctly.\n- [x] Verified products can be selected from the grid and are immediately added to the shopping list.\n- [x] Verified grid layout is responsive.\n\n---\n\n"

parts = content.split("---\n\n## ", 1)
if len(parts) == 2:
    content = parts[0] + "---\n\n" + new_entry + "## " + parts[1]
else:
    print("Could not find insertion point!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changelog updated!")
