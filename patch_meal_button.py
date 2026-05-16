import sys

file_path = "frontend/src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

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

if old_button in content:
    content = content.replace(old_button, new_button)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced button")
else:
    # Maybe whitespace issue?
    import re
    # We will just replace handleSelectMeal(meal.name) and its class
    content = re.sub(r'onClick=\{\(\) => handleSelectMeal\(meal\.name\)\}', r'onClick={() => handleToggleMeal(meal.name)}', content)
    
    # Let's replace the whole class and interior manually using re
    content = re.sub(
        r'className="w-full text-left px-6 py-4 rounded-2xl hover:bg-sage/10 hover:text-sage-deep transition-all font-medium text-bark flex items-center justify-between group"[\s\S]*?<Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />\s*</button>',
        r'''className={cn(
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
                    </button>''',
        content
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Force replaced button")
