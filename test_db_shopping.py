import asyncio
from app.core.supabase import supabase_admin as db

async def run():
    # First get a user
    user_resp = db.table("users").select("id").limit(1).execute()
    if not user_resp.data:
        print("No users found")
        return
    
    user_id = user_resp.data[0]['id']
    print(f"User ID: {user_id}")
    
    # Get the latest meal plan
    plan_resp = db.table("meal_plans").select("id").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
    if not plan_resp.data:
        print("No meal plans found")
        return
        
    plan_id = plan_resp.data[0]['id']
    print(f"Plan ID: {plan_id}")
    
    items_resp = db.table("meal_plan_items").select("meals(id, ingredients, name)").eq("meal_plan_id", plan_id).execute()
    print("Meal Plan Items:", items_resp.data)

asyncio.run(run())
