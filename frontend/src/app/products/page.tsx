'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Filter, ArrowUpDown, MoreVertical, Edit2, Trash2, 
  X, Save, ChevronLeft, ChevronRight, Package, CheckCircle2,
  AlertCircle, Loader2, Image, ShoppingBag
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id: string;
  name: string;
  category: 'daily' | 'consumable' | 'other';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Toilet Paper', category: 'daily', imageUrl: 'https://images.unsplash.com/photo-1584553421349-3557471bed79?w=100&h=100&fit=crop', createdAt: '2024-05-10T08:00:00Z', updatedAt: '2024-05-10T08:00:00Z' },
  { id: '2', name: 'Dish Soap', category: 'daily', imageUrl: 'https://images.unsplash.com/photo-1585441695325-21557c88be28?w=100&h=100&fit=crop', createdAt: '2024-05-10T09:00:00Z', updatedAt: '2024-05-10T09:00:00Z' },
  { id: '3', name: 'Laundry Detergent', category: 'consumable', imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=100&h=100&fit=crop', createdAt: '2024-05-11T10:00:00Z', updatedAt: '2024-05-11T10:00:00Z' },
  { id: '4', name: 'Paper Towels', category: 'daily', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100&h=100&fit=crop', createdAt: '2024-05-12T11:00:00Z', updatedAt: '2024-05-12T11:00:00Z' },
  { id: '5', name: 'Trash Bags', category: 'consumable', imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=100&h=100&fit=crop', createdAt: '2024-05-13T12:00:00Z', updatedAt: '2024-05-13T12:00:00Z' },
  { id: '6', name: 'Glass Cleaner', category: 'other', imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854b66?w=100&h=100&fit=crop', createdAt: '2024-05-14T13:00:00Z', updatedAt: '2024-05-14T13:00:00Z' },
];

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formState, setFormState] = useState<Partial<Product>>({});

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
        if (sortBy === 'date') comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
      imageUrl: ''
    });
  };

  const handleSave = async () => {
    if (!formState.name) {
      setNotification({ type: 'error', message: 'Tên sản phẩm là bắt buộc' });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isAdding) {
      const newProduct: Product = {
        ...formState as Product,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProducts([newProduct, ...products]);
      setSelectedProduct(newProduct);
      setNotification({ type: 'success', message: 'Đã thêm sản phẩm mới thành công' });
    } else {
      const updated = { ...formState as Product, updatedAt: new Date().toISOString() };
      setProducts(products.map(p => p.id === updated.id ? updated : p));
      setSelectedProduct(updated);
      setNotification({ type: 'success', message: 'Đã cập nhật sản phẩm thành công' });
    }

    setIsEditing(false);
    setIsAdding(false);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProducts(products.filter(p => p.id !== id));
    if (selectedProduct?.id === id) setSelectedProduct(null);
    setShowDeleteConfirm(null);
    setNotification({ type: 'success', message: 'Đã xóa sản phẩm thành công' });
    setIsLoading(false);
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

  return (
    <div className="pb-24 animate-page-enter">
      {/* Header Toolbar */}
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.4em] block pt-8 mb-2">
            Inventory
          </span>
          <h1 className="text-4xl text-bark font-serif">Product Database</h1>
        </div>
        <button 
          onClick={handleAddNew}
          className="h-14 px-8 bg-sage text-cream rounded-2xl shadow-warm flex items-center gap-3 hover:bg-sage-deep hover:-translate-y-0.5 active:translate-y-0 transition-all group font-bold uppercase tracking-widest text-xs"
        >
          <Plus className="h-5 w-5" />
          Add New Product
        </button>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Search & List */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-cream rounded-[2.5rem] p-8 shadow-soft space-y-6">
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
                  onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}
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
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
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
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-bark/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-bark truncate">{product.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                          CATEGORY_COLORS[product.category]
                        )}>
                          {CATEGORY_LABELS[product.category]}
                        </span>
                      </div>
                      <span className="text-[10px] text-bark/40">
                        Added {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(product.id);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-bark/5 mx-auto mb-4" />
                  <p className="text-sm text-bark/20 italic">No products found in database</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-bark/5">
                <span className="text-[10px] font-bold text-bark/40 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 bg-hemp/20 rounded-xl disabled:opacity-30 hover:bg-hemp/30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 bg-hemp/20 rounded-xl disabled:opacity-30 hover:bg-hemp/30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail / Edit Form */}
        <div className="lg:col-span-7">
          {(selectedProduct || isAdding) ? (
            <div className="bg-cream rounded-[2.5rem] shadow-soft overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Form Header */}
              <div className="p-8 border-b border-bark/5 flex items-center justify-between bg-hemp/5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-sage/20 flex items-center justify-center text-sage-deep overflow-hidden">
                    {formState.imageUrl ? (
                      <img src={formState.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl text-bark font-serif">
                      {isAdding ? 'New Product' : isEditing ? 'Edit Product' : 'Product Details'}
                    </h2>
                    <p className="text-xs text-bark/40 uppercase tracking-widest mt-1">
                      {isAdding ? 'Thêm vào kho hàng' : `ID: ${formState.id?.substr(0, 8)}`}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="h-12 px-6 bg-cream border border-bark/10 rounded-xl flex items-center gap-2 hover:bg-bark/5 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* Form Body */}
              <div className="p-8 space-y-8">
                {/* Product Image Preview */}
                <div className="flex justify-center">
                  <div className="h-40 w-40 rounded-[2rem] bg-hemp/20 flex items-center justify-center overflow-hidden border-4 border-dashed border-bark/10">
                    {formState.imageUrl ? (
                      <img src={formState.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Image className="h-10 w-10 text-bark/20 mx-auto mb-2" />
                        <span className="text-[10px] text-bark/30">No Image</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Name */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Product Name</label>
                    <input 
                      disabled={!isEditing}
                      type="text"
                      className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60"
                      value={formState.name || ''}
                      onChange={e => setFormState({...formState, name: e.target.value})}
                      placeholder="e.g. Premium Toilet Paper"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Category</label>
                    <select 
                      disabled={!isEditing}
                      className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60 appearance-none"
                      value={formState.category}
                      onChange={e => setFormState({...formState, category: e.target.value as Product['category']})}
                    >
                      <option value="daily">Daily</option>
                      <option value="consumable">Consumable</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Image URL</label>
                    <div className="relative">
                      <Image className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                      <input 
                        disabled={!isEditing}
                        type="url"
                        className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-14 pr-6 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60"
                        value={formState.imageUrl || ''}
                        onChange={e => setFormState({...formState, imageUrl: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Timestamps (Read-only) */}
                {!isAdding && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-bark/5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-bark/40 uppercase tracking-widest">Created</span>
                      <p className="text-sm text-bark/60">{new Date(formState.createdAt || '').toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-bark/40 uppercase tracking-widest">Last Updated</span>
                      <p className="text-sm text-bark/60">{new Date(formState.updatedAt || '').toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              {isEditing && (
                <div className="p-8 bg-hemp/5 border-t border-bark/5 flex items-center justify-end gap-4">
                  <button 
                    onClick={handleCancel}
                    className="h-12 px-8 text-bark/40 font-bold text-xs uppercase tracking-widest hover:text-bark transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="h-12 px-10 bg-sage text-cream rounded-xl shadow-warm flex items-center gap-2 hover:bg-sage-deep transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[600px] border-4 border-dashed border-bark/5 rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
              <div className="h-24 w-24 bg-hemp/20 rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-bark/20" />
              </div>
              <h2 className="text-2xl text-bark font-serif mb-4">No Product Selected</h2>
              <p className="text-bark/40 max-w-sm leading-relaxed">
                Select a product from the list to view details or add a new one to expand your inventory.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={cn(
          "fixed top-8 right-8 z-[100] p-6 rounded-3xl shadow-warm animate-in slide-in-from-top duration-500 flex items-center gap-4 max-w-md",
          notification.type === 'success' ? "bg-sage text-cream" : "bg-red-500 text-cream"
        )}>
          {notification.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          <p className="font-bold text-sm">{notification.message}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bark/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-cream rounded-[3rem] p-10 max-w-sm w-full shadow-warm text-center animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="h-10 w-10" />
            </div>
            <h3 className="text-2xl text-bark font-serif mb-4">Xác nhận xóa?</h3>
            <p className="text-bark/40 text-sm mb-8 leading-relaxed">
              Hành động này không thể hoàn tác. Sản phẩm sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 text-bark/40 font-bold text-xs uppercase tracking-widest hover:text-bark transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-4 bg-red-500 text-cream rounded-2xl font-bold text-xs uppercase tracking-widest shadow-soft hover:bg-red-600 transition-colors"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
