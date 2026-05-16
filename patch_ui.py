import sys

file_path = "frontend/src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add isProductModalOpen state
old_state = """  const [productsDatabase, setProductsDatabase] = useState<any[]>([]);
  const [extraProducts, setExtraProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);"""
new_state = """  const [productsDatabase, setProductsDatabase] = useState<any[]>([]);
  const [extraProducts, setExtraProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);"""
content = content.replace(old_state, new_state)

# Replace the Extra Products UI
old_extra_products_ui = """      {/* Extra Products Section */}
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
      </div>"""

new_extra_products_ui = """      {/* Extra Products Section */}
      <div className="mt-16 bg-cream rounded-[2.5rem] p-8 shadow-soft">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em]">Mua thêm (Products)</h3>
          <button 
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sage text-cream rounded-xl text-xs font-bold uppercase tracking-widest shadow-soft hover:bg-sage-deep transition-all"
          >
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </button>
        </div>
        
        <div>
          {extraProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extraProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-cream/50 p-5 rounded-2xl border border-hemp/20 shadow-sm">
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
            <div className="p-12 text-center bg-cream/30 rounded-2xl border border-hemp/20 border-dashed">
              <p className="text-bark/40 text-sm italic">Chưa có sản phẩm mua thêm.</p>
            </div>
          )}
        </div>
      </div>"""
content = content.replace(old_extra_products_ui, new_extra_products_ui)

# Add the new modal at the end before final div closure
old_closing = """        </div>
      )}
    </div>
  );
}"""

new_closing = """        </div>
      )}

      {/* Product Modal Popup */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-bark/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-cream rounded-[2.5rem] w-full max-w-4xl shadow-warm animate-scale-in overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-8 border-b border-bark/5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em] mb-1">Thư viện sản phẩm</h3>
                  <p className="text-sm text-bark/40">Chọn các sản phẩm bạn muốn mua thêm</p>
                </div>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 hover:bg-hemp/50 rounded-full transition-all"
                >
                  <X className="h-5 w-5 text-bark/40" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-8 custom-scrollbar">
              {productsDatabase.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productsDatabase.map((p, idx) => {
                    const isSelected = extraProducts.some(ep => ep.name.toLowerCase() === p.name.toLowerCase());
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!isSelected) handleAddProduct(p);
                        }}
                        disabled={isSelected || isProductsLoading}
                        className={`p-5 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[100px] ${
                          isSelected 
                            ? 'bg-sage text-cream shadow-md scale-100 opacity-90' 
                            : 'bg-cream hover:bg-sage/10 text-bark border border-hemp/20 shadow-sm hover:shadow hover:scale-[1.02] active:scale-95'
                        }`}
                      >
                        <span className="block font-medium mb-2 leading-tight">{p.name}</span>
                        <span className={`block text-[10px] uppercase tracking-widest ${isSelected ? 'text-cream/70' : 'text-bark/40'}`}>
                          {p.category}
                        </span>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-cream">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                        {isProductsLoading && !isSelected && (
                          <div className="absolute top-3 right-3 text-sage">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-bark/40 text-lg italic">Không có sản phẩm nào trong thư viện.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-bark/5 flex justify-end flex-shrink-0 bg-cream">
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="px-8 py-3 bg-bark text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-bark/90 transition-all shadow-soft"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""
content = content.replace(old_closing, new_closing)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched UI to modal view")
