'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  Package,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { productsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

interface Product {
  id: string;
  name: string;
  category?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 18;
const DEFAULT_CATEGORY = 'other';

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<Product>>({});

  const modalOpen = isAdding || selectedProduct !== null;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      const response = await productsApi.getAll();
      if (response.data.success) setProducts(response.data.data.products);
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message !== 'Network Error') {
        setNotification({ type: 'error', message: 'Không thể tải danh sách sản phẩm' });
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchProducts();
  }, [fetchProducts, authLoading, user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
        if (sortBy === 'created_at') {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [products, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const closeModal = () => {
    setSelectedProduct(null);
    setIsAdding(false);
    setIsEditing(false);
    setFormState({});
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsAdding(false);
    setIsEditing(false);
    setFormState(product);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setIsEditing(true);
    setSelectedProduct(null);
    setFormState({ name: '', image_url: '' });
  };

  const handleSave = async () => {
    if (!formState.name?.trim()) {
      setNotification({ type: 'error', message: 'Tên sản phẩm là bắt buộc' });
      return;
    }

    const payload = {
      name: formState.name.trim(),
      image_url: formState.image_url || '',
      category: formState.category || DEFAULT_CATEGORY,
    };

    setIsLoading(true);
    try {
      if (isAdding) {
        const response = await productsApi.create(payload);
        if (response.data.success) {
          const newProduct = response.data.data.product;
          setProducts([newProduct, ...products]);
          setSelectedProduct(newProduct);
          setIsAdding(false);
          setIsEditing(false);
          setFormState(newProduct);
          setNotification({ type: 'success', message: 'Đã thêm sản phẩm mới thành công' });
        }
      } else {
        const response = await productsApi.update(selectedProduct!.id, payload);
        if (response.data.success) {
          const updated = response.data.data.product;
          setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
          setSelectedProduct(updated);
          setIsEditing(false);
          setFormState(updated);
          setNotification({ type: 'success', message: 'Đã cập nhật sản phẩm thành công' });
        }
      }
    } catch {
      setNotification({ type: 'error', message: 'Lỗi khi lưu sản phẩm' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await productsApi.delete(id);
      setProducts(products.filter((p) => p.id !== id));
      closeModal();
      setShowDeleteConfirm(null);
      setNotification({ type: 'success', message: 'Đã xóa sản phẩm thành công' });
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: string } } };
      let errorMsg = 'Không thể xóa sản phẩm';
      if (err.response?.status === 404) errorMsg = 'Sản phẩm không tồn tại hoặc đã bị xóa';
      else if (err.response?.data?.detail) errorMsg = err.response.data.detail;
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (isAdding) {
      closeModal();
      return;
    }
    setIsEditing(false);
    setFormState(selectedProduct!);
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
          <h1 className="page-title text-2xl sm:text-4xl text-bark font-serif">Products</h1>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 sm:px-8 bg-sage text-cream rounded-2xl shadow-warm flex items-center gap-3 hover:bg-sage-deep transition-all font-bold uppercase tracking-widest text-xs touch-manipulation min-h-[48px]"
        >
          <Plus className="h-5 w-5" />
          Add product
        </button>
      </header>

      <div className="bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-soft mb-6 sm:mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-bark/5">
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'name' ? 'created_at' : 'name')}
            className="flex items-center gap-2 text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation"
          >
            <ArrowUpDown className="h-3 w-3" />
            Sort: {sortBy === 'name' ? 'Name' : 'Date'}
          </button>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation"
          >
            {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
          </button>
        </div>
      </div>

      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {paginatedProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => openProduct(product)}
              className="text-left bg-cream rounded-[1.25rem] sm:rounded-[1.5rem] overflow-hidden shadow-soft hover:shadow-warm active:scale-[0.99] transition-all touch-manipulation"
            >
              <div className="aspect-square bg-hemp/20 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-bark/20" />
                  </div>
                )}
              </div>
              <p className="p-3 sm:p-4 font-bold text-bark text-sm sm:text-base line-clamp-2 leading-snug">
                {product.name}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-cream rounded-[2rem] shadow-soft">
          <Search className="h-8 w-8 text-bark/20 mx-auto mb-4" />
          <p className="text-bark/40 font-medium">No products found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors touch-manipulation"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-bark/40">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors touch-manipulation"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-bark/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={closeModal}
          />
          <div
            className="relative w-full sm:max-w-lg max-h-[min(92dvh,720px)] overflow-y-auto custom-scrollbar bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-warm pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 gap-2">
              <h3 className="text-xs font-bold text-bark uppercase tracking-[0.2em] truncate">
                {isAdding ? 'New product' : isEditing ? 'Edit product' : 'Product details'}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing && !isAdding && selectedProduct && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-3 bg-hemp/20 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(selectedProduct.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={isEditing ? handleCancelEdit : closeModal}
                  className="p-3 bg-hemp/20 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">Name</label>
                  <input
                    type="text"
                    className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-serif text-lg focus:ring-2 focus:ring-sage/20"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">
                    Image URL
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                    <input
                      type="text"
                      className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-6 text-bark focus:ring-2 focus:ring-sage/20"
                      value={formState.image_url || ''}
                      onChange={(e) => setFormState({ ...formState, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                {formState.image_url && (
                  <div className="h-40 rounded-2xl overflow-hidden bg-hemp/10">
                    <img src={formState.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px]"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Save</>}
                </button>
              </div>
            ) : selectedProduct ? (
              <div className="space-y-6">
                <div className="h-48 sm:h-56 rounded-2xl overflow-hidden bg-hemp/10">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-bark/20" />
                    </div>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-bark leading-tight">{selectedProduct.name}</h2>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {notification && (
        <div
          className={cn(
            'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 px-6 py-4 rounded-2xl shadow-warm flex items-center gap-3 z-[70] max-w-md mx-auto sm:mx-0',
            notification.type === 'success' ? 'bg-sage text-cream' : 'bg-red-500 text-white'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-bark/30 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-sm w-full shadow-warm">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-2xl font-serif text-bark mb-4">Delete product?</h3>
            <p className="text-bark/60 mb-8">This cannot be undone.</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 bg-hemp/20 text-bark rounded-2xl font-bold uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isLoading}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
