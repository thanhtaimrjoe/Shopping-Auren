import sys

file_path = "frontend/src/app/shopping/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_fetch = """  const fetchCurrentList = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await shoppingListsApi.getCurrent();
      if (response.data.success) {
        setList(response.data.data.shopping_list);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setList(null);
        // If no list, check if there's a meal plan to generate from
        try {
          const planResp = await mealPlansApi.getCurrent({ week_start: weekStartKey });
          if (planResp.data.success) {
            setCurrentMealPlanId(planResp.data.data.meal_plan?.id || null);
          }
        } catch (planError) {
          setCurrentMealPlanId(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, weekStartKey]);"""

new_fetch = """  const fetchCurrentList = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    // Always fetch the current meal plan to allow syncing
    try {
      const planResp = await mealPlansApi.getCurrent({ week_start: weekStartKey });
      if (planResp.data.success) {
        setCurrentMealPlanId(planResp.data.data.meal_plan?.id || null);
      }
    } catch (planError) {
      setCurrentMealPlanId(null);
    }

    try {
      const response = await shoppingListsApi.getCurrent();
      if (response.data.success) {
        setList(response.data.data.shopping_list);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setList(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, weekStartKey]);"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched frontend fetch logic")
else:
    print("Could not find old_fetch!")
