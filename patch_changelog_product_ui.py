import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_entry = "## [2026-05-17 01:25] - Update Product Modal Rendering\n\n**Assignee**: AI Assistant\n**Type**: UI/UX Refactor\n**Impact**: Frontend\n\n### Changes\n- Removed the `category` tag from products within the Extra Products modal.\n- Added support for displaying the product's `image_url` if available, or a fallback `ShoppingBag` icon.\n- Centered the content of the product grid items for a cleaner visual layout.\n\n### Implementation Details\n- File: `frontend/src/app/page.tsx`\n- Reason: The user requested a simpler view focusing on the product image and name without the extra clutter of category tags in the modal.\n- Technical Decision: Replaced the left-aligned text approach with a flex-column centered layout. Used `lucide-react`'s `ShoppingBag` icon as a placeholder for products without images.\n\n### Testing\n- [x] Verified products render with placeholder icons.\n- [x] Verified category tags are removed.\n\n---\n\n"

parts = content.split("---\n\n## ", 1)
if len(parts) == 2:
    content = parts[0] + "---\n\n" + new_entry + "## " + parts[1]
else:
    print("Could not find insertion point!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changelog updated!")
