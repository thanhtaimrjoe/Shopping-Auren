import sys

file_path = "frontend/src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_ui_end = """      {/* Modal Popup */}
      {isModalOpen && ("""
new_ui_end = """      {/* Extra Products Section */}
      <div className="mt-16 bg-cream rounded-[2.5rem] p-8 shadow-soft">
        <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em] mb-8">Mua thêm (Products)</h3>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Selected Products */}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-bark/60 mb-4">Đã chọn ({extraProducts.length})</h4>
            {extraProducts.length > 0 ? (
              <div className="space-y-3">
                {extraProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-cream/50 p-4 rounded-2xl border border-hemp/20">
                    <span className="font-medium text-bark">{p.name}</span>
                    <button 
                      onClick={() => handleRemoveProduct(p.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-cream/30 rounded-2xl border border-hemp/20 border-dashed">
                <p className="text-bark/40 text-sm italic">Chưa có sản phẩm mua thêm.</p>
              </div>
            )}
          </div>
          
          {/* Product Library */}
          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-hemp/20 pt-8 lg:pt-0 lg:pl-12">
            <h4 className="text-sm font-medium text-bark/60 mb-4">Thư viện sản phẩm</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productsDatabase.map((p, idx) => {
                const isSelected = extraProducts.some(ep => ep.name.toLowerCase() === p.name.toLowerCase());
                return (
                  <button
                    key={idx}
                    onClick={() => !isSelected && handleAddProduct(p)}
                    disabled={isSelected || isProductsLoading}
                    className={`p-3 rounded-2xl text-left transition-all ${
                      isSelected 
                        ? 'bg-sage/20 text-sage-deep opacity-60' 
                        : 'bg-cream hover:bg-sage/10 text-bark shadow-sm hover:shadow active:scale-95'
                    }`}
                  >
                    <span className="block text-sm font-medium truncate">{p.name}</span>
                    <span className="block text-[10px] text-bark/40 mt-1 uppercase tracking-wider truncate">{p.category}</span>
                  </button>
                );
              })}
            </div>
            {productsDatabase.length === 0 && (
              <p className="text-bark/40 text-sm italic">Không có sản phẩm nào trong thư viện.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && ("""

if old_ui_end in content:
    content = content.replace(old_ui_end, new_ui_end)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced UI end")
else:
    print("Could not find old_ui_end")
