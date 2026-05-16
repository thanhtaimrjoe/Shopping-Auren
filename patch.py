import sys

file_path = "backend/app/api/v1/meals.py"
with open(file_path, "r") as f:
    content = f.read()

# Add .is_("deleted_at", "null") to the first query
old_query = """.eq("user_id", user_id)
        )"""
new_query = """.eq("user_id", user_id)
            .is_("deleted_at", "null")
        )"""
content = content.replace(old_query, new_query)

with open(file_path, "w") as f:
    f.write(content)

print("Patched!")
