'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Plus, Search, ArrowUpDown, MoreVertical, Edit2, Trash2, 
  X, Save, Loader2, Package, AlertCircle, CheckCircle2, Image as ImageIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { productsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id: string;
  name: string;
  category: 'daily' | 'consumable' | 'other';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 15;

const CATEGORY_COLORS = {
  daily: 'bg-blue-100 text-blue-700',
  consumable: 'bg-amber-100 text-amber-700',
  other: 'bg-purple-100 text-purple-700'
};

const CATEGORY_LABELS = {
  daily: 'Daily',
  consumable: 'Consumable',
  other: 'Other'
};

// Separate DetailContent component to prevent re-creation on every render
interface DetailContentProps {
  isAdding: boolean;
  isEditing: boolean;
  selectedProduct: Product | null;
  formState: Partial<Product>;
  isLoading: boolean;
  setIsEditing: (value: boolean) => void;
  setShowDeleteConfirm: (id: string | null) => void;
  setSelectedProduct: (product: Product | null) => void;
  setFormState: (state: Partial<Product>) => void;
  handleCancel: () => void;
  handleSave: () => void;
}

const DetailContent: React.FC<DetailContentProps> = React.memo(({
  isAdding,
  isEditing,
  selectedProduct,
  formState,
  isLoading,
  setIsEditing,
  setShowDeleteConfirm,
  setSelectedProduct,
  setFormState,
  handleCancel,
  handleSave,
}) => (
  <div className="bg-cream rounded-[2.5rem] p-8 md:p-10 shadow-soft animate-page-enter">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em]">
        {isAdding ? 'Thêm sản phẩm mới' : isEditing ? 'Chỉnh sửa sản phẩm' : 'Chi tiết sản phẩm'}
      </h3>
      <div className="flex items-center gap-2">
        {!isEditing ? (
          <>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl transition-all"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(selectedProduct!.id)}
              className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="lg:hidden p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl transition-all ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button 
            onClick={handleCancel}
            className="p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>

    {isEditing ? (
      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">Tên sản phẩm</label>
          <input 
            type="text" 
            className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-serif text-xl focus:ring-2 focus:ring-sage/20 transition-all"
            value={formState.name || ''}
            onChange={e => setFormState({...formState, name: e.target.value})}
            placeholder="Nhập tên sản phẩm..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">Phân loại</label>
            <select 
              className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20 transition-all appearance-none"
              value={formState.category || 'other'}
              onChange={e => setFormState({...formState, category: e.target.value as any})}
            >
              <option value="daily">Daily</option>
              <option value="consumable">Consumable</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">Link ảnh sản phẩm</label>
          <div className="relative">
            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
            <input 
              type="text" 
              className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-6 text-bark focus:ring-2 focus:ring-sage/20 transition-all"
              value={formState.image_url || ''}
              onChange={e => setFormState({...formState, image_url: e.target.value})}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-5 bg-sage text-cream rounded-[1.5rem] font-bold uppercase tracking-widest text-xs shadow-warm hover:bg-sage-deep hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Lưu sản phẩm</>}
        </button>
      </div>
    ) : (
      <div className="space-y-10 animate-page-enter">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="h-48 w-48 rounded-[2rem] bg-hemp/10 overflow-hidden shadow-soft shrink-0">
            {selectedProduct!.image_url ? (
              <img src={selectedProduct!.image_url} alt={selectedProduct!.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-bark/20" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <span className={cn(
              "inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4",
              CATEGORY_COLORS[selectedProduct!.category]
            )}>
              {CATEGORY_LABELS[selectedProduct!.category]}
            </span>
            <h2 className="text-4xl md:text-5xl text-bark font-serif leading-tight">{selectedProduct!.name}</h2>
          </div>
        </div>
      </div>
    )}
  </div>
));

DetailContent.displayName = 'DetailContent';

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formState, setFormState] = useState<Partial<Product>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      const response = await productsApi.getAll();
      if (response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (error: any) {
      if (error.message !== 'Network Error') {
        console.error('Failed to fetch products:', error);
        setNotification({ type: 'error', message: 'Không thể tải danh sách sản phẩm' });
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProducts();
    }
  }, [fetchProducts, authLoading, user]);

  useEffect(() => {
    if (selectedProduct) {
      setFormState(selectedProduct);
      setIsEditing(false);
      setIsAdding(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterCategory === 'all' || product.category === filterCategory;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
        if (sortBy === 'created_at') comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [products, searchQuery, filterCategory, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddNew = () => {
    setIsAdding(true);
    setIsEditing(true);
    setSelectedProduct(null);
    setFormState({
      name: '',
      category: 'other',
      image_url: ''
    });
  };

  const handleSave = async () => {
    if (!formState.name) {
      setNotification({ type: 'error', message: 'Tên sản phẩm là bắt buộc' });
      return;
    }

    setIsLoading(true);
    try {
      if (isAdding) {
        const response = await productsApi.create(formState);
        if (response.data.success) {
          const newProduct = response.data.data.product;
          setProducts([newProduct, ...products]);
          setSelectedProduct(newProduct);
          setNotification({ type: 'success', message: 'Đã thêm sản phẩm mới thành công' });
        }
      } else {
        const response = await productsApi.update(selectedProduct!.id, formState);
        if (response.data.success) {
          const updatedProduct = response.data.data.product;
          setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          setSelectedProduct(updatedProduct);
          setNotification({ type: 'success', message: 'Đã cập nhật sản phẩm thành công' });
        }
      }
      setIsEditing(false);
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      setNotification({ type: 'error', message: 'Lỗi khi lưu sản phẩm' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await productsApi.delete(id);
      setProducts(products.filter(p => p.id !== id));
      if (selectedProduct?.id === id) setSelectedProduct(null);
      setShowDeleteConfirm(null);
      setNotification({ type: 'success', message: 'Đã xóa sản phẩm thành công' });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      let errorMsg = 'Không thể xóa sản phẩm';
      if (error.response?.status === 404) {
        errorMsg = 'Sản phẩm không tồn tại hoặc đã bị xóa';
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      }
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isAdding) {
      setIsAdding(false);
      setIsEditing(false);
      setSelectedProduct(null);
    } else {
      setIsEditing(false);
      setFormState(selectedProduct!);
    }
  };



  if (authLoading || (fetchLoading && products.length === 0)) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0">
      <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.3em] sm:tracking-[0.4em] block mb-2">
            Inventory
          </span>
          <h1 className="text-2xl sm:text-4xl text-bark font-serif">Product Database</h1>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 sm:px-8 bg-sage text-cream rounded-2xl shadow-warm flex items-center gap-3 hover:bg-sage-deep transition-all font-bold uppercase tracking-widest text-xs touch-manipulation min-h-[48px]"
        >
          <Plus className="h-5 w-5" />
          Add New Product
        </button>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col gap-6 min-w-0">
          <div className="bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-soft space-y-4 sm:space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'daily', 'consumable', 'other'].map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      filterCategory === category 
                        ? "bg-sage text-cream shadow-soft" 
                        : "bg-hemp/20 text-bark/40 hover:bg-hemp/30"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-bark/5">
                <button 
                  onClick={() => setSortBy(sortBy === 'name' ? 'created_at' : 'name')}
                  className="flex items-center gap-2 text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Sort: {sortBy === 'name' ? 'Name' : 'Date'}
                </button>
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors"
                >
                  {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-3 max-h-[50vh] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={cn(
                      "group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border border-transparent",
                      selectedProduct?.id === product.id 
                        ? "bg-sage/10 border-sage/20" 
                        : "bg-hemp/10 hover:bg-hemp/20"
                    )}
                  >
                    <div className="h-14 w-14 rounded-2xl bg-hemp/30 overflow-hidden flex items-center justify-center shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className={cn(
                          "h-6 w-6 transition-colors",
                          selectedProduct?.id === product.id ? "text-sage-deep" : "text-bark/40"
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-bark truncate">{product.name}</h4>
                      <p className="text-[10px] font-bold text-bark/40 uppercase tracking-widest">{product.category}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-bark/5 rounded-lg transition-all">
                      <MoreVertical className="h-4 w-4 text-bark/40" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="h-16 w-16 bg-hemp/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-bark/20" />
                  </div>
                  <p className="text-bark/40 font-medium">Không tìm thấy sản phẩm nào</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-bark/5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xs font-bold text-bark/40">{currentPage} / {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail & Form (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-7 sticky top-8">
          {selectedProduct || isAdding ? (
            <DetailContent 
              isAdding={isAdding}
              isEditing={isEditing}
              selectedProduct={selectedProduct}
              formState={formState}
              isLoading={isLoading}
              setIsEditing={setIsEditing}
              setShowDeleteConfirm={setShowDeleteConfirm}
              setSelectedProduct={setSelectedProduct}
              setFormState={setFormState}
              handleCancel={handleCancel}
              handleSave={handleSave}
            />
          ) : (
            <div className="h-[600px] border-2 border-dashed border-bark/5 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center bg-cream/30">
              <div className="h-24 w-24 bg-hemp/10 rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-bark/20" />
              </div>
              <h3 className="text-xl font-serif text-bark mb-2">Chọn một sản phẩm</h3>
              <p className="text-bark/40 max-w-xs">Chọn một sản phẩm từ danh sách để xem chi tiết hoặc thêm mới.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Detail Modal */}
      {(selectedProduct || isAdding) && (
        <div 
          className="lg:hidden fixed inset-0 bg-bark/30 backdrop-blur-sm z-50 flex items-end justify-center p-0"
          onClick={() => {
            setSelectedProduct(null);
            setIsAdding(false);
            setIsEditing(false);
          }}
        >
          <div 
            className="w-full max-h-[min(92dvh,720px)] overflow-y-auto custom-scrollbar shadow-warm pb-[env(safe-area-inset-bottom)]"
            onClick={e => e.stopPropagation()}
          >
            <DetailContent 
              isAdding={isAdding}
              isEditing={isEditing}
              selectedProduct={selectedProduct}
              formState={formState}
              isLoading={isLoading}
              setIsEditing={setIsEditing}
              setShowDeleteConfirm={setShowDeleteConfirm}
              setSelectedProduct={setSelectedProduct}
              setFormState={setFormState}
              handleCancel={handleCancel}
              handleSave={handleSave}
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={cn(
          "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-warm flex items-center gap-3 animate-slide-up z-[70] max-w-md sm:max-w-none mx-auto sm:mx-0",
          notification.type === 'success' ? "bg-sage text-cream" : "bg-red-500 text-white"
        )}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-bark/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-cream rounded-[2.5rem] p-10 max-w-sm w-full shadow-warm animate-scale-in">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-serif text-bark mb-4">Xác nhận xóa?</h3>
            <p className="text-bark/60 mb-8 leading-relaxed">Sản phẩm này sẽ bị xóa vĩnh viễn khỏi danh sách của bạn.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 bg-hemp/20 text-bark rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-hemp/30 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isLoading}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 shadow-soft transition-all"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Xóa ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
