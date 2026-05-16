import requests
import json
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

url = ""
key = ""
try:
    with open("backend/.env", "r") as f:
        for line in f:
            if line.startswith("SUPABASE_URL="):
                url = line.split("=")[1].strip().strip('"')
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                key = line.split("=")[1].strip().strip('"')
except:
    pass

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

resp = requests.get(f"{url}/rest/v1/meals?select=id,name,ingredients&limit=1", headers=headers)
print("Meal Sample:", json.dumps(resp.json(), ensure_ascii=False))

resp = requests.get(f"{url}/rest/v1/meal_plan_items?select=id,meal_plan_id,meal_id,meals(id,ingredients)&limit=2", headers=headers)
print("Meal Plan Item Sample:", json.dumps(resp.json(), ensure_ascii=False))
