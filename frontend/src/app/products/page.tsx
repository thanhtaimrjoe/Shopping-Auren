'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { productsApi } from '@/lib/api';
import { uploadProductImage, validateProductImageFile } from '@/lib/product-image-upload';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

interface Product {
  id: string;
  name: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 18;

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
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const modalOpen = isAdding || selectedProduct !== null;

  const revokeBlobPreview = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const resetImageSelection = useCallback(() => {
    setPendingImageFile(null);
    setImagePreviewUrl((prev) => {
      revokeBlobPreview(prev);
      return null;
    });
  }, [revokeBlobPreview]);

  const setImagePreview = useCallback(
    (url: string | null) => {
      setImagePreviewUrl((prev) => {
        revokeBlobPreview(prev);
        return url;
      });
    },
    [revokeBlobPreview]
  );

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

  useEffect(() => {
    return () => {
      revokeBlobPreview(imagePreviewUrl);
    };
  }, [imagePreviewUrl, revokeBlobPreview]);

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
    resetImageSelection();
    setSelectedProduct(null);
    setIsAdding(false);
    setIsEditing(false);
    setFormState({});
  };

  const openProduct = (product: Product) => {
    resetImageSelection();
    setSelectedProduct(product);
    setIsAdding(false);
    setIsEditing(false);
    setFormState(product);
    setImagePreview(product.image_url || null);
  };

  const handleAddNew = () => {
    resetImageSelection();
    setIsAdding(true);
    setIsEditing(true);
    setSelectedProduct(null);
    setFormState({ name: '', image_url: '' });
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateProductImageFile(file);
    if (validationError) {
      setNotification({ type: 'error', message: validationError });
      return;
    }

    setPendingImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setPendingImageFile(null);
    setImagePreview(null);
    setFormState((prev) => ({ ...prev, image_url: '' }));
  };

  const handleSave = async () => {
    if (!formState.name?.trim()) {
      setNotification({ type: 'error', message: 'Vui lòng nhập tên sản phẩm' });
      return;
    }

    const payload = {
      name: formState.name.trim(),
      image_url: pendingImageFile ? '' : formState.image_url || '',
    };

    setIsLoading(true);
    try {
      let savedProduct: Product | null = null;

      if (isAdding) {
        const response = await productsApi.create(payload);
        if (response.data.success) {
          savedProduct = response.data.data.product;
        }
      } else {
        const response = await productsApi.update(selectedProduct!.id, payload);
        if (response.data.success) {
          savedProduct = response.data.data.product;
        }
      }

      if (!savedProduct) {
        setNotification({ type: 'error', message: 'Lỗi khi lưu sản phẩm' });
        return;
      }
      
      let finalProduct: Product = savedProduct;

      if (pendingImageFile) {
        const imageUrl = await uploadProductImage(finalProduct.id, pendingImageFile);
        const imageResponse = await productsApi.update(finalProduct.id, {
          name: finalProduct.name,
          image_url: imageUrl,
        });
        if (imageResponse.data.success) {
          finalProduct = imageResponse.data.data.product;
        }
        setPendingImageFile(null);
        setImagePreview(finalProduct.image_url || null);
      } else {
        setImagePreview(finalProduct.image_url || null);
      }

      if (isAdding) {
        setProducts([finalProduct, ...products]);
        setSelectedProduct(finalProduct);
        setIsAdding(false);
        setIsEditing(false);
        setFormState(finalProduct);
        setNotification({ type: 'success', message: 'Thêm sản phẩm mới thành công' });
      } else {
        setProducts(products.map((p) => (p.id === finalProduct.id ? finalProduct : p)));
        setSelectedProduct(finalProduct);
        setIsEditing(false);
        setFormState(finalProduct);
        setNotification({ type: 'success', message: 'Cập nhật sản phẩm thành công' });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi lưu sản phẩm',
      });
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
      setNotification({ type: 'success', message: 'Xóa sản phẩm thành công' });
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
    resetImageSelection();
    setImagePreview(selectedProduct?.image_url || null);
  };

  const displayImageUrl = imagePreviewUrl || formState.image_url || null;

  if (authLoading || (fetchLoading && products.length === 0)) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sage" />
          <p className="text-sm text-bark/60 font-medium">Đang tải danh sách sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0 pb-12">
      {/* Page Header */}
      <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title text-3xl sm:text-4xl md:text-5xl text-bark font-serif leading-tight font-black tracking-tight">
            Thư viện sản phẩm
          </h1>
          <p className="text-sm text-bark/50 font-medium mt-1">Quản lý danh sách thực phẩm, nhu yếu phẩm và hình ảnh mua sắm</p>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 sm:px-8 bg-sage text-cream rounded-2xl shadow-soft hover:shadow-warm flex items-center gap-3 hover:bg-sage-deep transition-all font-bold uppercase tracking-widest text-xs touch-manipulation min-h-[48px] active:scale-95 duration-200"
        >
          <Plus className="h-5 w-5 shrink-0" />
          Thêm sản phẩm
        </button>
      </header>

      {/* Filter Bento Box */}
      <div className="bg-cream/50 border border-bark/5 rounded-3xl p-5 sm:p-7 shadow-soft mb-6 sm:mb-8 space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-bark/30 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-12 text-bark placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white/80 transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 p-1 bg-bark/10 hover:bg-bark/20 text-bark/60 rounded-full transition-all hover:scale-105 active:scale-95 touch-manipulation"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-bark/5">
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'name' ? 'created_at' : 'name')}
            className="flex items-center gap-2 text-[10px] font-extrabold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation group/sort"
          >
            <ArrowUpDown className="h-3 w-3 transition-transform group-hover/sort:rotate-180 duration-300" />
            Sắp xếp: {sortBy === 'name' ? 'Tên sản phẩm' : 'Ngày tạo'}
          </button>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-[10px] font-extrabold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation"
          >
            Thứ tự: {sortBy === 'name' ? (sortOrder === 'asc' ? 'A → Z' : 'Z → A') : (sortOrder === 'asc' ? 'Cũ nhất' : 'Mới nhất')}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {paginatedProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => openProduct(product)}
              className="text-left bg-cream/40 border border-bark/5 hover:border-sage/20 hover:bg-cream/80 overflow-hidden shadow-soft hover:shadow-warm active:scale-[0.99] hover:scale-[1.015] transition-all duration-300 ease-out touch-manipulation flex flex-col rounded-3xl group/card"
            >
              <div className="aspect-square bg-hemp/15 relative overflow-hidden border-b border-bark/5 w-full shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-hemp/5 to-hemp/25">
                    <Package className="h-10 w-10 text-bark/15 group-hover/card:scale-110 group-hover/card:text-sage/40 transition-all duration-300" />
                  </div>
                )}
              </div>
              <p className="p-3.5 sm:p-4.5 font-bold text-bark text-sm sm:text-base line-clamp-1 leading-snug group-hover/card:text-sage-deep transition-colors duration-200 truncate">
                {product.name}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-cream/40 border border-bark/5 rounded-3xl shadow-soft">
          <Search className="h-8 w-8 text-bark/20 mx-auto mb-4" />
          <p className="text-bark/40 font-medium">Không tìm thấy sản phẩm nào</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2.5 disabled:opacity-20 hover:bg-hemp/30 rounded-full transition-all hover:scale-105 active:scale-95 touch-manipulation border border-bark/5 bg-cream/30 disabled:pointer-events-none"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-5 w-5 text-bark/75" />
          </button>
          <span className="text-xs font-bold text-bark/40 tracking-widest">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2.5 disabled:opacity-20 hover:bg-hemp/30 rounded-full transition-all hover:scale-105 active:scale-95 touch-manipulation border border-bark/5 bg-cream/30 disabled:pointer-events-none"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-5 w-5 text-bark/75" />
          </button>
        </div>
      )}

      {/* Modal Details / Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-bark/30 backdrop-blur-sm transition-opacity duration-300"
            aria-label="Đóng"
            onClick={closeModal}
          />
          <div
            className="relative w-full sm:max-w-lg max-h-[min(92dvh,720px)] overflow-y-auto custom-scrollbar bg-cream/95 backdrop-blur-lg border border-bark/8 rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-8 shadow-warm pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 gap-2 border-b border-bark/5 pb-3">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-gold/80 tracking-widest uppercase">
                  Sản phẩm
                </span>
                <h3 className="text-xs font-extrabold text-bark/40 uppercase tracking-[0.15em] truncate mt-0.5">
                  {isAdding ? 'Thêm sản phẩm mới' : isEditing ? 'Chỉnh sửa sản phẩm' : 'Chi tiết sản phẩm'}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing && !isAdding && selectedProduct && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-2.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(selectedProduct.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100/80 text-red-500 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={isEditing ? handleCancelEdit : closeModal}
                  className="p-2.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
                  title="Hủy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-serif text-lg font-bold placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Nhập tên sản phẩm..."
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                    Hình ảnh sản phẩm
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-5 py-3 bg-sage/10 border border-sage/35 text-sage-deep rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-soft hover:bg-sage/20 hover:border-sage transition-all disabled:opacity-50 touch-manipulation min-h-[44px]"
                    >
                      <Upload className="h-4 w-4" />
                      {displayImageUrl ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                    </button>
                    {displayImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isLoading}
                        className="px-5 py-3 text-red-500 bg-red-50 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50 touch-manipulation min-h-[44px]"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] font-semibold text-bark/35 uppercase tracking-wider px-1">
                    Hỗ trợ JPEG, PNG, WebP, GIF, AVIF — tối đa 5 MB
                  </p>
                </div>
                {displayImageUrl && (
                  <div className="h-44 rounded-2xl overflow-hidden bg-hemp/10 border border-bark/5 shadow-sm animate-scale-in">
                    <img src={displayImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full py-4 bg-sage text-cream rounded-2xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px] shadow-warm hover:bg-sage-deep transition-all duration-300 hover:shadow active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Lưu lại</>}
                </button>
              </div>
            ) : selectedProduct ? (
              <div className="space-y-6">
                <div className="h-48 sm:h-56 rounded-2xl overflow-hidden bg-hemp/10 border border-bark/5 shadow-sm relative">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-hemp/5 to-hemp/25">
                      <Package className="h-12 w-12 text-bark/15" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-bark leading-tight font-black tracking-tight">{selectedProduct.name}</h2>
                  <p className="text-[10px] text-bark/30 font-semibold uppercase tracking-wider mt-1">Đã lưu trong thư viện</p>
                </div>
                
                <div className="border-t border-bark/5 pt-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-bark/40 uppercase tracking-widest px-1">
                    <span>Ngày tạo</span>
                    <span className="text-bark/70 font-medium">
                      {new Date(selectedProduct.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-bark/40 uppercase tracking-widest px-1">
                    <span>Cập nhật</span>
                    <span className="text-bark/70 font-medium">
                      {new Date(selectedProduct.updated_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div
          role="alert"
          className={cn(
            'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 px-5 py-4 rounded-2xl shadow-warm flex items-center gap-3 z-[70] max-w-md mx-auto sm:mx-0 animate-scale-in border border-cream/10',
            notification.type === 'success' ? 'bg-sage text-cream' : 'bg-red-500 text-cream'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-bark/30 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-fade-in">
          <div className="bg-cream rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-warm border border-bark/8 animate-scale-in">
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4 shadow-sm">
              <AlertCircle className="h-6 w-6 text-red-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-serif text-bark mb-2 font-bold tracking-tight">Xóa sản phẩm?</h3>
            <p className="text-sm text-bark/60 mb-6 font-medium leading-relaxed">Hành động này sẽ xóa sản phẩm vĩnh viễn và không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors duration-200 active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-cream rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-200 shadow-sm hover:shadow active:scale-95 disabled:opacity-50 flex items-center justify-center min-h-[44px]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Xóa sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
