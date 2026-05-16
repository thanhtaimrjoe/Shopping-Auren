import sys

file_path = "backend/app/main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_origins = """    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "https://shopping-memo.vercel.app",  # Production
    ],"""

new_origins = """    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "https://shopping-memo.vercel.app",
        "https://shopping-auren.vercel.app",  # Actual Production URL
    ],"""

if old_origins in content:
    content = content.replace(old_origins, new_origins)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched CORS successfully")
else:
    print("Could not find CORS block")
