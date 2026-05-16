import sys

file_path = "backend/app/api/v1/shopping_lists.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    list_id: str,
    item_id: str,
    user: dict = Depends(get_current_user),
):
    \"\"\"Remove an item from a shopping list.\"\"\"
    user_id = user["id"]
    sl = verify_list_owner(list_id, user_id)

    if sl["status"] == "completed":
        raise HTTPException(status_code=409, detail="Cannot remove items from a completed shopping list")

    try:
        db.table("shopping_items").delete().eq("id", item_id).eq("shopping_list_id", list_id).execute()
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")

"""

# Insert at the end of the file
if "@router.delete(\"/{list_id}/items/{item_id}\"" not in content:
    content += new_endpoint
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added delete_item endpoint")
