import sys

file_path = "frontend/src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update handleSelectMeal to a more robust toggle logic and remove auto-close
old_handle_select = """  const handleSelectMeal = async (mealName: string) => {
    if (!activeDayKey || !user) return;
    
    setIsLoading(true);
    try {
      const currentMeals = selectedMeals[activeDayKey] || [];
      if (currentMeals.length >= 3) {
        return;
      }
      if (!currentMeals.includes(mealName)) {
        const updatedMeals = [...currentMeals, mealName];
        const nextSelectedMeals = {
          ...selectedMeals,
          [activeDayKey]: updatedMeals
        };
        
        // Save to backend
        await persistMealPlan(nextSelectedMeals);

        setSelectedMeals(nextSelectedMeals);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save meal plan:', error);
    } finally {
      setIsLoading(false);
    }
  };"""

new_handle_select = """  const handleToggleMeal = async (mealName: string) => {
    if (!activeDayKey || !user) return;
    
    setIsLoading(true);
    try {
      const currentMeals = selectedMeals[activeDayKey] || [];
      let updatedMeals;
      
      if (currentMeals.includes(mealName)) {
        // Remove meal
        updatedMeals = currentMeals.filter(m => m !== mealName);
      } else {
        // Add meal (limit 3)
        if (currentMeals.length >= 3) {
          alert("Mỗi ngày chỉ tối đa 3 món ăn.");
          return;
        }
        updatedMeals = [...currentMeals, mealName];
      }

      const nextSelectedMeals = {
        ...selectedMeals,
        [activeDayKey]: updatedMeals
      };
      
      // Save to backend
      await persistMealPlan(nextSelectedMeals);
      setSelectedMeals(nextSelectedMeals);
    } catch (error) {
      console.error('Failed to toggle meal:', error);
    } finally {
      setIsLoading(false);
    }
  };"""

content = content.replace(old_handle_select, new_handle_select)

# 2. Update the Meal Modal UI to show checkmarks and use toggle
# First, find the button inside the meal modal loop
old_button = """                    <button
                      key={i}
                      onClick={() => handleSelectMeal(meal.name)}
                      disabled={isLoading}
                      className="w-full text-left px-6 py-4 rounded-2xl hover:bg-sage/10 hover:text-sage-deep transition-all font-medium text-bark flex items-center justify-between group"
                    >
                      {meal.name}
                      <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>"""

new_button = """                    <button
                      key={i}
                      onClick={() => handleToggleMeal(meal.name)}
                      disabled={isLoading}
                      className={cn(
                        "w-full text-left px-6 py-4 rounded-2xl transition-all font-medium flex items-center justify-between group",
                        activeDayKey && selectedMeals[activeDayKey]?.includes(meal.name)
                          ? "bg-sage text-cream shadow-sm"
                          : "hover:bg-sage/10 hover:text-sage-deep text-bark"
                      )}
                    >
                      {meal.name}
                      {activeDayKey && selectedMeals[activeDayKey]?.includes(meal.name) ? (
                        <CheckCircle2 className="h-5 w-5 text-cream" />
                      ) : (
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                      )}
                    </button>"""

content = content.replace(old_button, new_button)

# 3. Add 'Xong' button to the bottom of the Meal Modal
old_modal_end = """                )}
              </div>
            </div>
          </div>
        )}"""

new_modal_end = """                )}
              </div>

              <div className="p-6 border-t border-bark/5 flex justify-end bg-cream">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 bg-bark text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-bark/90 transition-all shadow-soft"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        )}"""

content = content.replace(old_modal_end, new_modal_end)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Meal Modal UI with checkmarks")
