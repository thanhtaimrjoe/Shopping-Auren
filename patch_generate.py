import sys

file_path = "backend/app/api/v1/shopping_lists.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_insert = """        # Create shopping list
        sl_resp = db.table("shopping_lists").insert({
            "user_id": user_id,
            "meal_plan_id": body.meal_plan_id,
            "week_start_date": week_start_date,
            "status": "active",
        }).execute()

        sl = sl_resp.data[0]
        list_id = sl["id"]"""

new_insert = """        if existing_list_id:
            list_id = existing_list_id
            sl_resp = db.table("shopping_lists").select("*").eq("id", list_id).execute()
            sl = sl_resp.data[0]
            # Delete old meal items (keep manual items)
            db.table("shopping_items").delete().eq("shopping_list_id", list_id).eq("source_type", "meal").execute()
        else:
            # Create list
            sl_resp = db.table("shopping_lists").insert({
                "user_id": user_id,
                "meal_plan_id": body.meal_plan_id,
                "week_start_date": week_start_date,
                "status": "active",
            }).execute()
            sl = sl_resp.data[0]
            list_id = sl["id"]"""

if old_insert in content:
    content = content.replace(old_insert, new_insert)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched shopping_lists.py")
else:
    print("Could not find old_insert!")
