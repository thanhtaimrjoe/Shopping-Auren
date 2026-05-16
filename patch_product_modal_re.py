import sys
import re

file_path = "frontend/src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern for the interior of the product button in the modal
pattern = r'<span className="block font-medium mb-2 leading-tight">\{p\.name\}</span>\s*<span className=\{`block text-\[10px\] uppercase tracking-widest \$\{isSelected \? \'text-cream/70\' : \'text-bark/40\'\}`\}>\s*\{p\.category\}\s*</span>'

replacement = r'''<div className="flex flex-col items-center justify-center text-center h-full w-full py-2">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-12 h-12 object-contain mb-3" />
                            ) : (
                              <div className="w-12 h-12 bg-hemp/20 rounded-full mb-3 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-bark/20" />
                              </div>
                            )}
                            <span className="block font-medium leading-tight text-sm">{p.name}</span>
                          </div>'''

new_content = re.sub(pattern, replacement, content)

if new_content != content:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Updated product rendering in modal")
else:
    print("Could not match pattern")
