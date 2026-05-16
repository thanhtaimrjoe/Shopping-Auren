import sys

file_path = "frontend/src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { ChevronLeft, ChevronRight, Plus, X, Search, Loader2, CheckCircle2 } from 'lucide-react';",
    "import { ChevronLeft, ChevronRight, Plus, X, Search, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added ShoppingBag import")
