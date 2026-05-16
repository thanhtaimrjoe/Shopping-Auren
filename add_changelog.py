import sys

file_path = "docs/changelog/CHANGELOG.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("  ackend", " ackend").replace("meals.py.", "meals.py.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
