import sys

file_path = "frontend/src/app/shopping/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_quick_add = """          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 bg-cream rounded-[2.5rem] p-8 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em] mb-2">Completion</h3>
                  <p className="text-3xl font-serif text-bark">
                    {list.checked_items} <span className="text-bark/20">/</span> {list.total_items}
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-sage/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-sage-deep" />
                </div>
              </div>
              <div className="w-full h-2 bg-hemp rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sage transition-all duration-1000 ease-out"
                  style={{ width: `${list.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-sage text-cream rounded-[2.5rem] p-8 shadow-warm">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-80 mb-6">Quick Add</h3>"""

new_quick_add = """          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 bg-cream rounded-[2.5rem] p-8 shadow-soft flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em] mb-2">Completion</h3>
                  <p className="text-3xl font-serif text-bark">
                    {list.checked_items} <span className="text-bark/20">/</span> {list.total_items}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {currentMealPlanId && (
                    <button 
                      onClick={handleGenerateList}
                      disabled={isGenerating}
                      className="h-12 px-6 rounded-full bg-sage text-cream text-sm font-bold uppercase tracking-widest shadow-soft hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
                      Sync Plan
                    </button>
                  )}
                  <div className="h-16 w-16 rounded-full bg-sage/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-sage-deep" />
                  </div>
                </div>
              </div>
              <div className="w-full h-2 bg-hemp rounded-full overflow-hidden relative z-10">
                <div 
                  className="h-full bg-sage transition-all duration-1000 ease-out"
                  style={{ width: `${list.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-sage text-cream rounded-[2.5rem] p-8 shadow-warm">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-80 mb-6">Quick Add</h3>"""

content = content.replace(old_quick_add, new_quick_add)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched frontend")
