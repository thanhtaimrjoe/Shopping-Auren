import sys

file_path = "backend/app/api/v1/shopping_lists.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_query = """    # Fetch meal_plan_items with ingredients
    items_resp = (
        db.table("meal_plan_items")
        .select("meals(id, ingredients)")
        .eq("meal_plan_id", body.meal_plan_id)
        .execute()
    )"""

new_query = """    # Fetch meal_plan_items with ingredients (only for non-deleted meals)
    items_resp = (
        db.table("meal_plan_items")
        .select("meals!inner(id, ingredients)")
        .eq("meal_plan_id", body.meal_plan_id)
        .is_("meals.deleted_at", "null")
        .execute()
    )"""

if old_query in content:
    content = content.replace(old_query, new_query)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched shopping_lists.py (deleted filter)")
else:
    print("Could not find old_query!")
