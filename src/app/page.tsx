'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronRight, Circle, ClipboardList, Clock3, Home, Library, LogOut,
  MoreHorizontal, Pencil, Plus, RotateCcw, Search, Settings, ShoppingBasket, Trash2,
  UtensilsCrossed, X,
} from 'lucide-react';
import {
  categories, weekdays, mockRepository, normalizeName,
  type Category, type ChecklistItem, type Ingredient, type Meal, type Plan,
  type Product, type ShoppingData, type Snapshot, type Weekday,
} from '@/lib/mock-data';

type Screen = 'home' | 'checklist' | 'library' | 'settings';
type EntityKind = 'meal' | 'ingredient' | 'product';
type Dialog = '' | 'meal-picker' | 'product-picker' | 'reset' | 'preview' | 'overwrite' | 'complete' | 'entity' | 'add-library' | 'view-history';
type FormState = { id?: string; name: string; ingredientIds: string[]; category: Category };
const navItems: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Trang chủ', icon: Home },
  { id: 'checklist', label: 'Checklist', icon: ClipboardList },
  { id: 'library', label: 'Thư viện', icon: Library },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];
const blankPlan = (): Plan => Object.fromEntries(weekdays.map((d) => [d, []])) as unknown as Plan;
const blankData: ShoppingData = { ingredients: [], meals: [], products: [], plan: blankPlan(), planProductIds: [] };
const emptyForm: FormState = { name: '', ingredientIds: [], category: categories[0] };

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [data, setData] = useState<ShoppingData>(blankData);
  const [loaded, setLoaded] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<EntityKind>('meal');
  const [activeChecklist, setActiveChecklist] = useState<ChecklistItem[] | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [dialog, setDialog] = useState<Dialog>('');
  const [confirmSnapshotDelete, setConfirmSnapshotDelete] = useState(false);
  const [targetDay, setTargetDay] = useState<Weekday>('Thứ Hai');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'Tất cả'>('Tất cả');
  const [draftProducts, setDraftProducts] = useState<string[]>([]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [toast, setToast] = useState('');
  const [signedIn, setSignedIn] = useState(true);
  const [authMode, setAuthMode] = useState<'Đăng nhập' | 'Đăng ký'>('Đăng nhập');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formKind, setFormKind] = useState<EntityKind>('meal');
  const [formError, setFormError] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateError, setDateError] = useState('');
  const [otherName, setOtherName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category>(categories[0]);

  useEffect(() => { mockRepository.load().then((value) => { setData(value); setLoaded(true); }); }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!dialog) return;
    const scrollY = window.scrollY;
    const previous = {
      htmlOverscrollBehavior: document.documentElement.style.overscrollBehavior,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.left = previous.left;
      document.body.style.right = previous.right;
      document.body.style.width = previous.width;
      document.body.style.overflow = previous.overflow;
      document.documentElement.style.overscrollBehavior = previous.htmlOverscrollBehavior;
      window.scrollTo(0, scrollY);
    };
  }, [dialog]);

  const itemCount = activeChecklist?.length ?? 0;
  const checkedCount = activeChecklist?.filter((item) => item.checked).length ?? 0;
  const progress = itemCount ? Math.round((checkedCount / itemCount) * 100) : 0;
  const visibleEntities = useMemo(() => {
    const source = selectedLibrary === 'meal' ? data.meals : selectedLibrary === 'ingredient' ? data.ingredients : data.products;
    return source.filter((entity) => entity.name.toLocaleLowerCase('vi').includes(libraryQuery.toLocaleLowerCase('vi')));
  }, [data, selectedLibrary, libraryQuery]);

  function updateData(next: ShoppingData) {
    setData(next);
    void mockRepository.save(next);
  }
  function flash(message: string) { setToast(message); }
  function openMealPicker(day: Weekday) { setTargetDay(day); setQuery(''); setDialog('meal-picker'); }
  function openProducts() {
    setDraftProducts(selectedProductIds());
    setQuery(''); setCategoryFilter('Tất cả'); setDialog('product-picker');
  }
  function addMeal(meal: Meal) {
    if (!meal.ingredientIds.length) {
      flash('Meal chưa có Ingredient. Vui lòng thêm ít nhất một Ingredient trước khi đưa Meal vào Weekly Plan.');
      return;
    }
    if (data.plan[targetDay].length >= 3 || data.plan[targetDay].includes(meal.id)) return;
    const next = { ...data, plan: { ...data.plan, [targetDay]: [...data.plan[targetDay], meal.id] } };
    updateData(next); setDialog('');
  }
  function saveProductPicker() {
    updateData({ ...data, planProductIds: [...draftProducts] }); setDialog('');
  }
  function selectedProductIds() {
    return data.planProductIds;
  }
  function changeProductSelection(ids: string[]) {
    updateData({ ...data, planProductIds: ids });
  }
  function resetPlan() {
    const next: ShoppingData = { ...data, plan: blankPlan(), planProductIds: [] };
    updateData(next); setDialog('');
  }
  function buildPreview(): ChecklistItem[] {
    const result: ChecklistItem[] = [];
    for (const day of weekdays) {
      for (const mealId of data.plan[day]) {
        const meal = data.meals.find((entry) => entry.id === mealId);
        if (!meal) continue;
        const placementId = `${day}-${mealId}-${crypto.randomUUID()}`;
        for (const ingredientId of meal.ingredientIds) {
          const ingredient = data.ingredients.find((entry) => entry.id === ingredientId);
          if (ingredient) result.push({ id: crypto.randomUUID(), name: ingredient.name, kind: 'ingredient', checked: false, placementId, mealName: meal.name, sourceId: ingredient.id });
        }
      }
    }
    for (const id of selectedProductIds()) {
      const product = data.products.find((entry) => entry.id === id);
      if (product) result.push({ id: crypto.randomUUID(), name: product.name, kind: 'product', checked: false, category: product.category, sourceId: product.id });
    }
    return result;
  }
  function startChecklist() {
    const items = buildPreview();
    if (!items.length) { flash('Weekly Plan đang trống.'); return; }
    setPendingChecklist(items);
    setDialog('preview');
  }
  const [pendingChecklist, setPendingChecklist] = useState<ChecklistItem[]>([]);
  function confirmChecklist() {
    setActiveChecklist(pendingChecklist); setDialog(''); setScreen('checklist');
    flash('Checklist đã được tạo trong bản demo.');
  }
  function toggleOccurrence(id: string) {
    setActiveChecklist((items) => items?.map((item) => item.id === id ? { ...item, checked: !item.checked } : item) ?? null);
  }
  function removeOccurrence(id: string) {
    setActiveChecklist((items) => items?.filter((item) => item.id !== id) ?? null);
  }
  function addFromLibrary(kind: 'ingredient' | 'product', id: string) {
    const item = kind === 'ingredient' ? data.ingredients.find((entry) => entry.id === id) : data.products.find((entry) => entry.id === id);
    if (!item || !activeChecklist) return;
    const newItem: ChecklistItem = { id: crypto.randomUUID(), name: item.name, kind, checked: false, sourceId: item.id, ...(kind === 'product' ? { category: (item as Product).category } : {}) };
    setActiveChecklist((items) => [...(items ?? []), newItem]); setDialog('');
  }
  function addOther(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = otherName.trim(); if (!name || !activeChecklist) return;
    setActiveChecklist((items) => [...(items ?? []), { id: crypto.randomUUID(), name, kind: 'other', checked: false }]);
    setOtherName('');
  }
  function completeShopping() {
    if (!dateFrom || !dateTo) { setDateError(''); return; }
    if (dateFrom > dateTo) { setDateError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.'); return; }
    if (!activeChecklist) return;
    const done: Snapshot = { id: crypto.randomUUID(), from: dateFrom, to: dateTo, createdAt: new Date().toISOString(), items: structuredClone(activeChecklist) };
    setSnapshots((items) => [done, ...items]); setActiveChecklist(null); setDialog(''); setScreen('settings');
    flash('Snapshot mô phỏng đã được lưu vào Lịch sử.');
  }
  function openEntity(kind: EntityKind, entity?: Ingredient | Meal | Product) {
    setFormKind(kind); setFormError('');
    if (!entity) setForm({ ...emptyForm, ingredientIds: [] });
    else setForm({ id: entity.id, name: entity.name, ingredientIds: kind === 'meal' ? [...(entity as Meal).ingredientIds] : [], category: kind === 'product' ? (entity as Product).category : categories[0] });
    setDialog('entity');
  }
  function saveEntity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (!name) { setFormError(''); return; }
    const otherEntities = formKind === 'meal' ? data.meals : formKind === 'ingredient' ? data.ingredients : data.products;
    if (otherEntities.some((entry) => entry.id !== form.id && normalizeName(entry.name) === normalizeName(name))) {
      setFormError(''); flash('Tên đã có trong thư viện.'); return;
    }
    const next: ShoppingData = { ...data };
    if (formKind === 'ingredient') {
      const entity = { id: form.id ?? crypto.randomUUID(), name };
      next.ingredients = form.id ? data.ingredients.map((x) => x.id === form.id ? entity : x) : [...data.ingredients, entity];
      if (form.id) next.meals = data.meals.map((meal) => ({ ...meal, ingredientIds: meal.ingredientIds }));
    } else if (formKind === 'meal') {
      const entity = { id: form.id ?? crypto.randomUUID(), name, ingredientIds: [...new Set(form.ingredientIds)] };
      next.meals = form.id ? data.meals.map((x) => x.id === form.id ? entity : x) : [...data.meals, entity];
    } else {
      const entity = { id: form.id ?? crypto.randomUUID(), name, category: form.category };
      next.products = form.id ? data.products.map((x) => x.id === form.id ? entity : x) : [...data.products, entity];
    }
    updateData(next); setDialog('');
  }
  function deleteEntity(kind: EntityKind, id: string) {
    if (kind === 'ingredient') {
      const usedBy = data.meals.filter((meal) => meal.ingredientIds.includes(id));
      if (usedBy.length) { flash(`Không thể xóa. Ingredient đang được dùng trong: ${usedBy.map((meal) => meal.name).join(', ')}.`); return; }
      updateData({ ...data, ingredients: data.ingredients.filter((x) => x.id !== id) });
    } else if (kind === 'meal') {
      if (Object.values(data.plan).some((ids) => ids.includes(id))) { flash('Không thể xóa Meal đang có trong Weekly Plan.'); return; }
      const meal = data.meals.find((x) => x.id === id);
      updateData({ ...data, meals: data.meals.filter((x) => x.id !== id) });
      if (meal && activeChecklist) setActiveChecklist(activeChecklist.map((item) => item.mealName === meal.name ? { ...item } : item));
    } else {
      if (selectedProductIds().includes(id)) { flash('Không thể xóa Product đang có trong Weekly Plan.'); return; }
      updateData({ ...data, products: data.products.filter((x) => x.id !== id) });
    }
  }
  function attemptSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authEmail.trim() || !authPassword) { setAuthError(''); return; }
    setSignedIn(true); setAuthError(''); setScreen('home');
    flash('Phiên demo đã bắt đầu. Tài khoản chưa được xác thực hoặc lưu.');
  }

  if (!loaded) return <main className="loading-screen"><span className="brand-mark">a</span></main>;
  if (!signedIn) return <main className="auth-screen">
    <section className="auth-story"><div className="brand-lockup"><span className="brand-mark">a</span><span><b>auren</b><small>home, in good rhythm</small></span></div><div className="auth-message"><span className="eyebrow">MỘT TUẦN NHẸ NHÀNG HƠN</span><h1>Good things<br />begin at home.</h1><p>Lên kế hoạch, chuẩn bị và chăm sóc căn nhà theo nhịp của riêng bạn.</p></div><small className="auth-caption">Bản demo · Đăng nhập mô phỏng</small></section>
    <section className="auth-pane"><form className="auth-card" onSubmit={attemptSignIn}><span className="eyebrow">CHÀO MỪNG BẠN</span><h2>{authMode}</h2><p>{authMode === 'Đăng nhập' ? 'Đăng nhập để tiếp tục với không gian của bạn.' : 'Tạo tài khoản để bắt đầu.'}</p><label>Email<input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} autoComplete="off" /></label><label>Mật khẩu<input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete="off" /></label>{authError && <p className="field-error">{authError}</p>}<button className="button primary auth-submit">{authMode}<ArrowRight size={16} /></button><div className="auth-switch">{authMode === 'Đăng nhập' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <button type="button" onClick={() => setAuthMode(authMode === 'Đăng nhập' ? 'Đăng ký' : 'Đăng nhập')}>{authMode === 'Đăng nhập' ? 'Đăng ký' : 'Đăng nhập'}</button></div><small className="sim-note">Đăng nhập mô phỏng · Không xác thực hoặc lưu tài khoản thật.</small></form></section>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><span className="brand-mark">a</span><span><b>auren</b><small>home, in good rhythm</small></span></div>
      <p className="sidebar-caption">KHÔNG GIAN CỦA BẠN</p>
      <nav className="side-nav" aria-label="Điều hướng chính">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-button ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)}><Icon size={19} strokeWidth={1.8} /><span>{label}</span>{id === 'checklist' && activeChecklist && <i className="nav-indicator" />}</button>)}</nav>
      <div className="sidebar-profile"><span className="avatar">M</span><span><b>Minh Anh</b><small>Bản xem trước</small></span><MoreHorizontal size={20} /></div>
    </aside>

    <div className="mobile-top"><span className="brand-mark">a</span><b>auren</b><span className="demo-chip"><i /> Demo dữ liệu</span></div>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Không gian của bạn <ChevronRight size={14} /> <b>{navItems.find((x) => x.id === screen)?.label}</b></div><span className="demo-chip"><i /> Demo dữ liệu</span></header>
      <div className="demo-banner"><CheckCircle2 size={17} /><span><b>Bản demo tương tác</b> · Dữ liệu chỉ ở trong phiên này. Chưa kết nối Supabase hoặc backend.</span></div>

      {screen === 'home' && <section className="page-content">
        <div className="page-heading"><div><p className="eyebrow">KẾ HOẠCH TUẦN CỦA BẠN</p><h1>Weekly Plan</h1><p className="heading-description">Lên kế hoạch nhẹ nhàng cho những bữa ăn trong tuần.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => setDialog('reset')}><RotateCcw size={15} /> Đặt lại mẫu</button><button className="button primary" onClick={startChecklist}>Tạo Checklist <ArrowRight size={16} /></button></div></div>
        <div className="week-caption"><ShoppingBasket size={16} /><b>Tuần hiện tại</b><span>· 7 ngày</span></div>
        <div className="day-grid">{weekdays.map((day) => <article className="day-card" key={day}><header><b>{day}</b></header><div className="meal-list">{!data.plan[day].length && <p className="meal-empty"><UtensilsCrossed size={15} /><span>Chưa có món ăn</span></p>}{data.plan[day].map((id, index) => {
          const meal = data.meals.find((entry) => entry.id === id);
          return meal ? <div className="meal-chip" key={`${id}-${index}`}><span className="meal-dot" />{meal.name}<button aria-label={`Gỡ ${meal.name}`} onClick={() => { updateData({ ...data, plan: { ...data.plan, [day]: data.plan[day].filter((_, i) => i !== index) } }); }}><X size={14} /></button></div> : null;
        })}</div><button className="add-meal" disabled={data.plan[day].length >= 3} onClick={() => openMealPicker(day)}><Plus size={16} /><span>Thêm món ăn</span><small>{data.plan[day].length}/3</small></button></article>)}</div>
        <section className="products-section"><div className="section-heading"><div><h2>Products</h2><p>Sản phẩm cần mua trong tuần này.</p></div><button className="button secondary" onClick={openProducts}><Plus size={16} /> Chọn sản phẩm</button></div><div className="product-panel"><div className="product-panel-heading"><b>{selectedProductIds().length} sản phẩm</b><span>· được chọn cho tuần này</span></div><div className="product-chips">{selectedProductIds().map((id) => data.products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)).map((product) => <div className="product-chip" key={product.id}><ShoppingBasket size={15} /><span>{product.name}</span><button aria-label={`Bỏ ${product.name}`} onClick={() => changeProductSelection(selectedProductIds().filter((id) => id !== product.id))}><X size={14} /></button></div>)}{!selectedProductIds().length && <p className="empty-inline">Chưa có sản phẩm nào được chọn.</p>}</div></div></section>
      </section>}

      {screen === 'checklist' && <section className="page-content checklist-page">
        <div className="page-heading"><div><p className="eyebrow">DANH SÁCH MUA SẮM</p><h1>Checklist</h1><p className="heading-description">{activeChecklist ? 'Các mục trong phiên mua sắm hiện tại.' : 'Xem trước và tạo Checklist từ Weekly Plan.'}</p></div><div className="heading-actions">{activeChecklist ? <button className="button primary" onClick={() => { setDateFrom(''); setDateTo(''); setDateError(''); setDialog('complete'); }}>Hoàn tất shopping <Check size={16} /></button> : <button className="button primary" onClick={startChecklist}>Tạo Checklist <ArrowRight size={16} /></button>}</div></div>
        {activeChecklist ? <><div className="progress-card"><div className="progress-title"><span className="progress-icon"><Check size={17} /></span><span><b>Đang tiến hành</b><small>{checkedCount} / {itemCount} mục đã hoàn tất</small></span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div>
          <div className="checklist-layout"><div className="checklist-list"><div className="list-toolbar"><b>Tất cả mục <span>{itemCount}</span></b></div>
            {renderChecklistGroups(activeChecklist, toggleOccurrence, removeOccurrence, setEditingItemId, setEditingName, setEditingCategory, editingItemId, editingName, editingCategory, setActiveChecklist)}
            <button className="add-from-library" onClick={() => setDialog('add-library')}><Plus size={16} /> Thêm Ingredient hoặc Product từ thư viện</button>
            <form className="other-form" onSubmit={addOther}><Plus size={16} /><input value={otherName} onChange={(e) => setOtherName(e.target.value)} aria-label="Tên mục phát sinh" placeholder="Thêm mục phát sinh" /><button type="submit">Thêm</button></form>
          </div></div>
        </> : <div className="empty-card"><ClipboardList size={28} /><h2>Chưa có Checklist đang hoạt động</h2><p>Xem trước nội dung từ Weekly Plan rồi xác nhận để tạo phiên mua sắm.</p><button className="button primary" onClick={startChecklist}>Tạo Checklist <ArrowRight size={15} /></button></div>}
      </section>}

      {screen === 'library' && <section className="page-content library-page">
        <div className="page-heading"><div><p className="eyebrow">NGUỒN DỮ LIỆU CỦA BẠN</p><h1>Thư viện</h1><p className="heading-description">Quản lý Ingredient, Meal và Product.</p></div><button className="button primary" onClick={() => openEntity(selectedLibrary)}><Plus size={16} /> Thêm {selectedLibrary === 'meal' ? 'Meal' : selectedLibrary === 'ingredient' ? 'Ingredient' : 'Product'}</button></div>
        <div className="library-switch" role="tablist" aria-label="Loại thư viện">{([['meal', 'Meals'], ['ingredient', 'Ingredient'], ['product', 'Products']] as [EntityKind, string][]).map(([kind, label]) => <button key={kind} role="tab" aria-selected={selectedLibrary === kind} className={selectedLibrary === kind ? 'selected' : ''} onClick={() => { setSelectedLibrary(kind); setLibraryQuery(''); }}>{label}<span>{kind === 'meal' ? data.meals.length : kind === 'ingredient' ? data.ingredients.length : data.products.length}</span></button>)}</div>
        <div className="library-toolbar"><label className="search-field"><Search size={16} /><input value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} placeholder={`Tìm ${selectedLibrary === 'meal' ? 'Meal' : selectedLibrary === 'ingredient' ? 'Ingredient' : 'Product'}`} /></label></div>
        <div className="entity-list">{visibleEntities.map((entity) => <article className="entity-row" key={entity.id}><div className="entity-mark">{selectedLibrary === 'meal' ? <BookOpen size={18} /> : selectedLibrary === 'ingredient' ? <Circle size={17} /> : <ShoppingBasket size={17} />}</div><div className="entity-copy"><b>{entity.name}</b><small>{selectedLibrary === 'meal' ? `${(entity as Meal).ingredientIds.length} Ingredient` : selectedLibrary === 'product' ? (entity as Product).category : (data.meals.filter((meal) => meal.ingredientIds.includes(entity.id)).length ? `Được dùng trong ${data.meals.filter((meal) => meal.ingredientIds.includes(entity.id)).map((meal) => meal.name).join(', ')}` : 'Ingredient')}</small></div><div className="entity-actions"><button aria-label={`Sửa ${entity.name}`} onClick={() => openEntity(selectedLibrary, entity as Ingredient | Meal | Product)}><Pencil size={16} /></button><button aria-label={`Xóa ${entity.name}`} onClick={() => deleteEntity(selectedLibrary, entity.id)}><Trash2 size={16} /></button></div></article>)}{!visibleEntities.length && <div className="empty-list">{libraryQuery ? 'Không có kết quả phù hợp.' : ''}</div>}</div>
      </section>}

      {screen === 'settings' && <section className="page-content settings-page"><div className="page-heading"><div><p className="eyebrow">TÀI KHOẢN</p><h1>Cài đặt</h1><p className="heading-description">Quản lý phiên đăng nhập và xem Lịch sử.</p></div></div>
        <section className="settings-card"><div className="card-title"><span className="settings-symbol"><Settings size={18} /></span><div><b>Tài khoản</b><small>Phiên đăng nhập mô phỏng</small></div></div><div className="account-row"><span className="avatar large">M</span><span><b>Minh Anh</b><small>{authEmail || 'Tài khoản mẫu'}</small></span><span className="session-tag">Demo</span></div><button className="settings-action" onClick={() => { setSignedIn(false); setAuthMode('Đăng nhập'); setAuthPassword(''); }}><LogOut size={17} /><span>Đăng xuất</span><ChevronRight size={17} /></button></section>
        <section className="settings-card history-section"><div className="card-title"><span className="settings-symbol"><Clock3 size={18} /></span><div><b>Lịch sử</b><small>Snapshot shopping đã hoàn tất</small></div><span className="history-count">{snapshots.length}</span></div>{snapshots.length ? <div className="history-list">{snapshots.map((entry) => <article className="history-row" key={entry.id}><Archive size={18} /><div><b>{formatDate(entry.from)} – {formatDate(entry.to)}</b><small>{entry.items.length} mục · {formatTimestamp(entry.createdAt)}</small></div><button className="text-button" onClick={() => { setSnapshot(entry); setConfirmSnapshotDelete(false); setDialog('view-history'); }}>Xem <ArrowRight size={14} /></button></article>)}</div> : <div className="history-empty"><Clock3 size={23} /><b>Chưa có lịch sử</b><p>Snapshot sẽ xuất hiện tại đây sau khi bạn hoàn tất shopping.</p></div>}</section>
      </section>}
    </main>
    <nav className="mobile-nav" aria-label="Điều hướng chính">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'active' : ''} onClick={() => setScreen(id)}><Icon size={20} strokeWidth={1.8} /><span>{label}</span></button>)}</nav>

    {dialog && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(''); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header><h2 id="dialog-title">{dialogTitle(dialog, targetDay, formKind, snapshot)}</h2><button className="icon-button" aria-label="Đóng" onClick={() => setDialog('')}><X size={18} /></button></header>
      {dialog === 'meal-picker' && <div className="dialog-content"><p className="dialog-note">Chọn Meal cho {targetDay} · tối đa 3 Meal.</p><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm Meal" /></label><div className="picker-list">{data.meals.filter((meal) => meal.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).map((meal) => <button className="picker-row" key={meal.id} onClick={() => addMeal(meal)} disabled={data.plan[targetDay].includes(meal.id) || data.plan[targetDay].length >= 3}><span><b>{meal.name}</b><small>{[meal.ingredientIds.map((id) => data.ingredients.find((ingredient) => ingredient.id === id)?.name).filter(Boolean).join(', '), data.plan[targetDay].includes(meal.id) ? 'Đã thêm' : ''].filter(Boolean).join(' · ')}</small></span>{meal.ingredientIds.length ? <Plus size={17} /> : <span className="disabled-label">Chưa có Ingredient</span>}</button>)}</div><footer><button className="button secondary" onClick={() => setDialog('')}>Đóng</button></footer></div>}
      {dialog === 'product-picker' && <div className="dialog-content"><p className="dialog-note">Tìm và chọn nhiều Product từ thư viện cho Weekly Plan.</p><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm Product" /></label><label className="select-field"><span>Category</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as Category | 'Tất cả')}><option>Tất cả</option>{categories.map((c) => <option key={c}>{c}</option>)}</select><ChevronDown size={15} /></label><div className="picker-list">{data.products.filter((p) => p.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')) && (categoryFilter === 'Tất cả' || p.category === categoryFilter)).map((product) => { const already = selectedProductIds().includes(product.id); const checked = draftProducts.includes(product.id); return <button key={product.id} className="picker-row" disabled={already} onClick={() => setDraftProducts((old) => checked ? old.filter((id) => id !== product.id) : [...old, product.id])}><span><b>{product.name}</b><small>{product.category}</small></span>{already ? <span className="added-label">Đã thêm</span> : <span className={`select-check ${checked ? 'checked' : ''}`}>{checked && <Check size={14} />}</span>}</button>; })}{!data.products.some((p) => p.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')) && (categoryFilter === 'Tất cả' || p.category === categoryFilter)) && <p className="empty-list">Không có kết quả phù hợp.</p>}</div><footer className="dialog-footer"><span>{draftProducts.length} đã chọn</span><button className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" onClick={saveProductPicker}>Lưu lựa chọn</button></footer></div>}
      {dialog === 'reset' && <div className="dialog-content"><p>Đặt lại mẫu sẽ xóa Meal placements và Product đã chọn trong Weekly Plan. Active Checklist vẫn được giữ nguyên.</p><footer className="dialog-footer"><button className="button secondary" onClick={() => setDialog('')}>Không</button><button className="button primary" onClick={resetPlan}>Có</button></footer></div>}
      {dialog === 'preview' && <div className="dialog-content"><p className="dialog-note">Xem trước Checklist được tạo từ Weekly Plan hiện tại.</p><div className="preview-list">{pendingChecklist.map((item) => <div key={item.id}><Circle size={15} /><span>{item.mealName ? `${item.mealName} · ` : ''}{item.name}</span></div>)}</div><footer className="dialog-footer"><button className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" onClick={() => activeChecklist ? setDialog('overwrite') : confirmChecklist()}>Tạo Checklist</button></footer></div>}
      {dialog === 'add-library' && <div className="dialog-content"><p className="dialog-note">Mỗi lựa chọn được thêm thành một occurrence riêng trong Checklist.</p><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm Ingredient hoặc Product" /></label><div className="picker-list">{[...data.ingredients.map((x) => ({ ...x, kind: 'ingredient' as const })), ...data.products.map((x) => ({ ...x, kind: 'product' as const }))].filter((x) => x.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).map((item) => <button className="picker-row" key={`${item.kind}-${item.id}`} onClick={() => addFromLibrary(item.kind, item.id)}><span><b>{item.name}</b><small>{item.kind === 'ingredient' ? 'Ingredient' : item.category}</small></span><Plus size={16} /></button>)}</div><footer><button className="button secondary" onClick={() => setDialog('')}>Đóng</button></footer></div>}
      {dialog === 'overwrite' && <div className="dialog-content"><p>Active Checklist sẽ được thay bằng Checklist mới từ Weekly Plan.</p><footer className="dialog-footer"><button className="button secondary" onClick={() => setDialog('')}>Không</button><button className="button primary" onClick={confirmChecklist}>Có</button></footer></div>}
      {dialog === 'complete' && <form className="dialog-content" onSubmit={(e) => { e.preventDefault(); completeShopping(); }}><p className="dialog-note">Lưu snapshot chỉ đọc vào Lịch sử. Có thể hoàn tất dù còn mục chưa được đánh dấu.</p><label className="form-field">Từ ngày<input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDateError(''); }} required /></label><label className="form-field">Đến ngày<input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDateError(''); }} required /></label>{(dateError || (dateFrom && dateTo && dateFrom > dateTo)) && <p className="field-error">{dateError || 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.'}</p>}<footer className="dialog-footer"><button type="button" className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" type="submit">Hoàn tất</button></footer></form>}
      {dialog === 'entity' && <form className="dialog-content" onSubmit={saveEntity}><label className="form-field">Tên<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></label>{formKind === 'meal' && <fieldset className="ingredient-select"><legend>Ingredient</legend>{data.ingredients.map((ingredient) => <label key={ingredient.id}><input type="checkbox" checked={form.ingredientIds.includes(ingredient.id)} onChange={(e) => setForm({ ...form, ingredientIds: e.target.checked ? [...form.ingredientIds, ingredient.id] : form.ingredientIds.filter((id) => id !== ingredient.id) })} />{ingredient.name}</label>)}</fieldset>}{formKind === 'product' && <label className="form-field">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>}{formError && <p className="field-error">{formError}</p>}<footer className="dialog-footer"><button type="button" className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" type="submit">Lưu</button></footer></form>}
      {dialog === 'view-history' && snapshot && <div className="dialog-content"><div className="history-meta"><b>Từ ngày</b><span>{formatDate(snapshot.from)}</span><b>Đến ngày</b><span>{formatDate(snapshot.to)}</span><b>Thời điểm tạo</b><span>{formatTimestamp(snapshot.createdAt)}</span></div><div className="snapshot-list">{snapshot.items.map((item) => <div key={item.id}><span className={`snapshot-state ${item.checked ? 'checked' : ''}`}>{item.checked ? <Check size={13} /> : <X size={13} />}</span><span>{item.mealName ? `${item.mealName} · ` : ''}{item.name}</span>{item.category && <small>{item.category}</small>}</div>)}</div>{confirmSnapshotDelete ? <><p className="dialog-note delete-confirm-copy">Xóa snapshot này khỏi Lịch sử?</p><footer className="dialog-footer"><button className="button secondary" onClick={() => setConfirmSnapshotDelete(false)}>Không</button><button className="button danger-quiet" onClick={() => { setSnapshots((entries) => entries.filter((entry) => entry.id !== snapshot.id)); setConfirmSnapshotDelete(false); setDialog(''); }}>Có</button></footer></> : <footer className="dialog-footer"><button className="button danger-quiet" onClick={() => setConfirmSnapshotDelete(true)}>Xóa snapshot</button><button className="button secondary" onClick={() => setDialog('')}>Đóng</button></footer>}</div>}
    </section></div>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    <footer className="prototype-disclaimer">Bản demo · dữ liệu chỉ trong phiên này · chưa kết nối backend</footer>
  </div>;
}

function renderChecklistGroups(
  items: ChecklistItem[], toggle: (id: string) => void, remove: (id: string) => void,
  setEditingId: (id: string | null) => void, setEditingName: (name: string) => void,
  setEditingCategory: (category: Category) => void, editingId: string | null,
  editingName: string, editingCategory: Category,
  setItems: React.Dispatch<React.SetStateAction<ChecklistItem[] | null>>,
) {
  const placements = [...new Set(items.filter((x) => x.kind === 'ingredient' && x.placementId).map((x) => x.placementId!))];
  const groups: { title: string; entries: ChecklistItem[] }[] = placements.map((id) => ({ title: items.find((x) => x.placementId === id)?.mealName ?? '', entries: items.filter((x) => x.placementId === id) }));
  const products = items.filter((x) => x.kind === 'product');
  const others = items.filter((x) => x.kind === 'other');
  if (products.length) groups.push({ title: 'Products', entries: products });
  if (others.length) groups.push({ title: 'Khác (phát sinh)', entries: others });
  const ungrouped = items.filter((x) => x.kind === 'ingredient' && !x.placementId);
  if (ungrouped.length) groups.push({ title: 'Ingredient', entries: ungrouped });
  return <>{groups.map((group, groupIndex) => <section className="occurrence-group" key={`${group.title}-${groupIndex}`}><header><span className="placement-dot" /><b>{group.title}</b>{group.entries.every((x) => x.checked) && <span className="group-done">Hoàn tất</span>}</header>{group.entries.map((item) => <article className={`check-row ${item.checked ? 'checked' : ''}`} key={item.id}>{editingId === item.id ? <><button type="button" className={`check-control ${item.checked ? 'checked' : ''}`} onClick={() => toggle(item.id)} aria-label={item.checked ? 'Bỏ đánh dấu' : 'Đánh dấu'}>{item.checked && <Check size={14} />}</button><input className="inline-edit" value={editingName} onChange={(e) => setEditingName(e.target.value)} /><select value={editingCategory} onChange={(e) => setEditingCategory(e.target.value as Category)}><option value={editingCategory}>{editingCategory}</option>{categories.filter((x) => x !== editingCategory).map((x) => <option key={x}>{x}</option>)}</select><button type="button" className="row-action" aria-label="Lưu" onClick={() => { setItems((old) => old?.map((x) => x.id === item.id ? { ...x, name: editingName.trim() || x.name, category: item.kind === 'product' ? editingCategory : x.category } : x) ?? null); setEditingId(null); }}><Check size={16} /></button></> : <><button type="button" className="check-row-toggle" onClick={() => toggle(item.id)} aria-pressed={item.checked} aria-label={`${item.checked ? 'Bỏ đánh dấu' : 'Đánh dấu'} ${item.name}`}><span aria-hidden="true" className={`check-control ${item.checked ? 'checked' : ''}`}>{item.checked && <Check size={14} />}</span><span className="check-name">{item.name}</span>{item.category && <small className="category-label">{item.category}</small>}</button><button type="button" className="row-action" aria-label={`Sửa ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); setEditingCategory(item.category ?? categories[0]); }}><Pencil size={15} /></button><button type="button" className="row-action remove-action" aria-label={`Xóa ${item.name}`} onClick={() => remove(item.id)}><X size={16} /></button></>}</article>)}</section>)}</>;
}

function dialogTitle(dialog: Dialog, day: Weekday, kind: EntityKind, snapshot: Snapshot | null) {
  if (dialog === 'meal-picker') return `Thêm Meal · ${day}`;
  if (dialog === 'product-picker') return 'Chọn Products';
  if (dialog === 'reset') return 'Đặt lại Weekly Plan?';
  if (dialog === 'preview') return 'Checklist';
  if (dialog === 'overwrite') return 'Tạo Checklist mới?';
  if (dialog === 'complete') return 'Hoàn tất shopping';
  if (dialog === 'entity') return `${kind === 'meal' ? 'Meal' : kind === 'ingredient' ? 'Ingredient' : 'Product'}`;
  if (dialog === 'view-history') return 'Lịch sử';
  if (dialog === 'add-library') return 'Thêm từ thư viện';
  return snapshot ? 'Lịch sử' : '';
}
function formatDate(value: string) { return value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : ''; }
function formatTimestamp(value: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
