'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, Archive, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronRight, Circle, ClipboardList, Clock3, Home, Info, Library, LogOut,
  Pencil, Plus, RotateCcw, Search, Settings, ShoppingBasket, Trash2,
  UtensilsCrossed, X,
} from 'lucide-react';
import {
  categories, weekdays, normalizeName,
  type Category, type ChecklistItem, type Ingredient, type Meal, type Plan,
  type Product, type ShoppingData, type Snapshot, type Weekday,
} from '@/lib/shopping-types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { authErrorMessage, saveErrorMessage } from '@/lib/supabase/messages';
import { SupabaseShoppingRepository } from '@/lib/supabase/shopping-repository';
import { copy } from '@/lib/copy';

type Screen = 'home' | 'checklist' | 'library' | 'settings';
type EntityKind = 'meal' | 'ingredient' | 'product';
type Dialog = '' | 'meal-picker' | 'product-picker' | 'reset' | 'preview' | 'overwrite' | 'complete' | 'entity' | 'add-library' | 'view-history' | 'delete-entity' | 'delete-checklist';
type FormState = { id?: string; name: string; ingredientIds: string[]; category: Category };
type Toast = { message: string; tone: 'success' | 'error' | 'info' };
type MealPlacement = { day: Weekday; index: number };
const navItems: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: copy['COPY-31'], icon: Home },
  { id: 'checklist', label: copy['COPY-32'], icon: ClipboardList },
  { id: 'library', label: copy['COPY-33'], icon: Library },
  { id: 'settings', label: copy['COPY-34'], icon: Settings },
];
const blankPlan = (): Plan => Object.fromEntries(weekdays.map((d) => [d, []])) as unknown as Plan;
const blankData: ShoppingData = { ingredients: [], meals: [], products: [], plan: blankPlan(), planProductIds: [] };
const emptyForm: FormState = { name: '', ingredientIds: [], category: categories[0] };
const shoppingRepository = new SupabaseShoppingRepository();

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [data, setData] = useState<ShoppingData>(blankData);
  const [loaded, setLoaded] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<EntityKind>('meal');
  const [activeChecklist, setActiveChecklist] = useState<ChecklistItem[] | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [dialog, setDialog] = useState<Dialog>('');
  const [confirmSnapshotDelete, setConfirmSnapshotDelete] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ kind: EntityKind; id: string } | null>(null);
  const [targetDay, setTargetDay] = useState<Weekday>('Thứ Hai');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'Tất cả'>(copy['COPY-58']);
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<Category | 'Tất cả'>(copy['COPY-58']);
  const [libraryIngredientFilter, setLibraryIngredientFilter] = useState('');
  const [draftProducts, setDraftProducts] = useState<string[]>([]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'Đăng nhập' | 'Đăng ký'>(copy['COPY-17']);
  const [authStep, setAuthStep] = useState<'email' | 'password'>('email');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formKind, setFormKind] = useState<EntityKind>('meal');
  const [formError, setFormError] = useState('');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateError, setDateError] = useState('');
  const [otherName, setOtherName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category>(categories[0]);
  const [draggingPlacement, setDraggingPlacement] = useState<MealPlacement | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Weekday | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSession(session: { user: { id: string; email?: string } } | null) {
      if (!active) return;
      if (!session) { setSignedIn(false); setLoaded(true); return; }
      setSignedIn(true); setLoaded(false);
      if (session.user.email) setAuthEmail(session.user.email);
      try {
        const [value, records] = await Promise.all([shoppingRepository.load(), shoppingRepository.loadShoppingRecords()]);
        if (active) {
          setData(value); setActiveChecklist(records.activeChecklist); setSnapshots(records.snapshots);
          setAuthError(''); setLoaded(true);
        }
      } catch (error) {
        if (active) {
          const message = saveErrorMessage(error instanceof Error ? error.message : '');
          setAuthError(message); setToast({ message, tone: 'error' }); setLoaded(true);
        }
      }
    }
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      queueMicrotask(() => {
        if (active) {
          setAuthError(copy['COPY-22']);
          setLoaded(true);
        }
      });
      return () => { active = false; };
    }
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      queueMicrotask(() => { void loadSession(session); });
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      return loadSession(data.session);
    }).catch((error: unknown) => {
      if (active) { setAuthError(error instanceof Error ? error.message : copy['COPY-23']); setLoaded(true); }
    });
    return () => { active = false; authListener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
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
  useEffect(() => {
    if (!dialog) return;
    const node = dialogRef.current;
    const returnFocus = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => node?.focus(), 0);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); setDialog(''); return; }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      returnFocus?.focus?.();
    };
  }, [dialog]);

  const itemCount = activeChecklist?.length ?? 0;
  const checkedCount = activeChecklist?.filter((item) => item.checked).length ?? 0;
  const progress = itemCount ? Math.round((checkedCount / itemCount) * 100) : 0;
  const visibleEntities = useMemo(() => {
    const source = selectedLibrary === 'meal' ? data.meals : selectedLibrary === 'ingredient' ? data.ingredients : data.products;
    return source.filter((entity) => entity.name.toLocaleLowerCase('vi').includes(libraryQuery.toLocaleLowerCase('vi')) && (selectedLibrary !== 'product' || libraryCategoryFilter === 'Tất cả' || (entity as Product).category === libraryCategoryFilter) && (selectedLibrary !== 'meal' || !libraryIngredientFilter || (entity as Meal).ingredientIds.includes(libraryIngredientFilter)));
  }, [data, selectedLibrary, libraryQuery, libraryCategoryFilter, libraryIngredientFilter]);

  function updateData(next: ShoppingData) {
    const previous = data;
    setData(next);
    void shoppingRepository.save(next).catch((error: unknown) => {
      const raw = error instanceof Error ? error.message : '';
      console.error('[supabase] save failed', raw);
      // roll back only if no newer edit has replaced this optimistic state
      setData((current) => (current === next ? previous : current));
      flash(`Không lưu được lên Supabase: ${saveErrorMessage(raw)}`, 'error');
    });
  }
  function placementBlockReason(day: Weekday, mealId: string): string | null {
    if (data.plan[day].includes(mealId)) {
      return `${day} đã có món này. Mỗi món chỉ được đặt một lần trong một ngày.`;
    }
    if (data.plan[day].length >= 3) {
      return `${day} đã có tối đa 3 món. Hãy gỡ bớt một món trước khi thêm.`;
    }
    return null;
  }
  function moveMeal(source: MealPlacement, destination: Weekday) {
    if (source.day === destination) return;
    const mealId = data.plan[source.day][source.index];
    if (!mealId) return;
    const reason = placementBlockReason(destination, mealId);
    if (reason) {
      flash(reason, 'info');
      return;
    }
    const plan = {
      ...data.plan,
      [source.day]: data.plan[source.day].filter((_, index) => index !== source.index),
      [destination]: [...data.plan[destination], mealId],
    };
    updateData({ ...data, plan });
  }
  function updateActiveChecklist(next: ChecklistItem[] | null | ((items: ChecklistItem[] | null) => ChecklistItem[] | null)) {
    const previous = activeChecklist;
    const value = typeof next === 'function' ? next(activeChecklist) : next;
    setActiveChecklist(value);
    void shoppingRepository.saveActiveChecklist(value).catch((error: unknown) => {
      const raw = error instanceof Error ? error.message : '';
      console.error('[supabase] save checklist failed', raw);
      setActiveChecklist((current) => (current === value ? previous : current));
      flash(`Không lưu được Checklist: ${saveErrorMessage(raw)}`, 'error');
    });
  }
  function flash(message: string, tone: Toast['tone'] = 'info') { setToast({ message, tone }); }
  function openMealPicker(day: Weekday) { setTargetDay(day); setQuery(''); setDialog('meal-picker'); }
  function openMealPickerFor(day: Weekday) {
    if (data.plan[day].length >= 3) {
      flash(`${day} đã có tối đa 3 món. Hãy gỡ bớt một món trước khi thêm.`, 'info');
      return;
    }
    openMealPicker(day);
  }
  function openProducts() {
    setDraftProducts(selectedProductIds());
    setQuery(''); setCategoryFilter('Tất cả'); setDialog('product-picker');
  }
  function addMeal(meal: Meal) {
    if (!meal.ingredientIds.length) {
      flash(copy['COPY-06'], 'info');
      return;
    }
    const reason = placementBlockReason(targetDay, meal.id);
    if (reason) { flash(reason, 'info'); return; }
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
    if (!items.length) { flash(copy['COPY-07'], 'info'); return; }
    setPendingChecklist(items);
    setDialog('preview');
  }
  const [pendingChecklist, setPendingChecklist] = useState<ChecklistItem[]>([]);
  function confirmChecklist() {
    updateActiveChecklist(pendingChecklist); setDialog(''); setScreen('checklist');
    flash(copy['COPY-98'], 'success');
  }
  function toggleOccurrence(id: string) {
    updateActiveChecklist((items) => items?.map((item) => item.id === id ? { ...item, checked: !item.checked } : item) ?? null);
  }
  function removeOccurrence(id: string) {
    updateActiveChecklist((items) => items?.filter((item) => item.id !== id) ?? null);
  }
  function addFromLibrary(kind: 'ingredient' | 'product', id: string) {
    const item = kind === 'ingredient' ? data.ingredients.find((entry) => entry.id === id) : data.products.find((entry) => entry.id === id);
    if (!item || !activeChecklist) return;
    const newItem: ChecklistItem = { id: crypto.randomUUID(), name: item.name, kind, checked: false, sourceId: item.id, ...(kind === 'product' ? { category: (item as Product).category } : {}) };
    updateActiveChecklist((items) => [...(items ?? []), newItem]); setDialog('');
  }
  function addOther(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = otherName.trim();
    if (!name) { flash(copy['COPY-99'], 'error'); return; }
    if (!activeChecklist) return;
    updateActiveChecklist((items) => [...(items ?? []), { id: crypto.randomUUID(), name, kind: 'other', checked: false }]);
    setOtherName('');
  }
  async function completeShopping() {
    if (!dateFrom || !dateTo) { setDateError(copy['COPY-121']); return; }
    if (dateFrom > dateTo) { setDateError(copy['COPY-122']); return; }
    if (!activeChecklist) return;
    try {
      const done = await shoppingRepository.completeShopping(dateFrom, dateTo, activeChecklist);
      setSnapshots((items) => [done, ...items]); setActiveChecklist(null); setDialog(''); setScreen('settings');
      flash(copy['COPY-123'], 'success');
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      console.error('[supabase] complete shopping failed', raw);
      flash(`Không thể hoàn tất mua sắm: ${saveErrorMessage(raw)}`, 'error');
    }
  }
  function openEntity(kind: EntityKind, entity?: Ingredient | Meal | Product) {
    setFormKind(kind); setFormError(''); setIngredientQuery('');
    if (!entity) setForm({ ...emptyForm, ingredientIds: [] });
    else setForm({ id: entity.id, name: entity.name, ingredientIds: kind === 'meal' ? [...(entity as Meal).ingredientIds] : [], category: kind === 'product' ? (entity as Product).category : categories[0] });
    setDialog('entity');
  }
  function saveEntity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (!name) { setFormError(copy['COPY-108']); return; }
    const otherEntities = formKind === 'meal' ? data.meals : formKind === 'ingredient' ? data.ingredients : data.products;
    if (otherEntities.some((entry) => entry.id !== form.id && normalizeName(entry.name) === normalizeName(name))) {
      setFormError(copy['COPY-109']); return;
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
      if (usedBy.length) { flash(`Không thể xóa. Nguyên liệu đang được dùng trong: ${usedBy.map((meal) => meal.name).join(', ')}.`, 'error'); return; }
      updateData({ ...data, ingredients: data.ingredients.filter((x) => x.id !== id) });
      if (activeChecklist) updateActiveChecklist(activeChecklist.map((item) => item.sourceId === id ? { ...item, sourceId: undefined } : item));
    } else if (kind === 'meal') {
      if (Object.values(data.plan).some((ids) => ids.includes(id))) { flash(copy['COPY-111'], 'error'); return; }
      const meal = data.meals.find((x) => x.id === id);
      updateData({ ...data, meals: data.meals.filter((x) => x.id !== id) });
      if (meal && activeChecklist) updateActiveChecklist(activeChecklist.map((item) => item.mealName === meal.name ? { ...item } : item));
    } else {
      if (selectedProductIds().includes(id)) { flash(copy['COPY-112'], 'error'); return; }
      updateData({ ...data, products: data.products.filter((x) => x.id !== id) });
      if (activeChecklist) updateActiveChecklist(activeChecklist.map((item) => item.sourceId === id ? { ...item, sourceId: undefined } : item));
    }
  }
  function confirmDeleteEntity() {
    if (!pendingDelete) return;
    deleteEntity(pendingDelete.kind, pendingDelete.id);
    setPendingDelete(null);
    setDialog('');
  }
  function clearChecklist() {
    updateActiveChecklist(null);
    setDialog('');
    flash(copy['COPY-84'], 'success');
  }
  function attemptSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authEmail.trim()) { setAuthError(copy['COPY-24']); return; }
    if (authStep === 'email') {
      setAuthError('');
      setAuthStep('password');
      return;
    }
    if (!authPassword) { setAuthError(copy['COPY-25']); return; }
    const supabase = getSupabaseBrowserClient();
    const result = authMode === 'Đăng nhập'
      ? supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
      : supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
    void result.then(({ data: authData, error }) => {
      if (error) { setAuthError(authErrorMessage(error.message)); return; }
      if (!authData.session) {
        setAuthError(copy['COPY-26']);
        return;
      }
      setAuthError('');
      setScreen('home');
    }).catch((error: unknown) => setAuthError(authErrorMessage(error instanceof Error ? error.message : '')));
  }
  function switchAuthMode() {
    setAuthMode(authMode === 'Đăng nhập' ? 'Đăng ký' : 'Đăng nhập');
    setAuthStep('email');
    setAuthError('');
  }
  function editAuthEmail() {
    setAuthStep('email');
    setAuthError('');
  }

  if (!loaded) return <main className="loading-screen"><BrandMark /><span className="loading-word">SHOPPING AUREN</span></main>;
  if (!signedIn) return <main className="auth-screen">
    <header className="auth-header">
      <div className="brand-lockup"><BrandMark /><span><b>SHOPPING AUREN</b><small>home, in good rhythm</small></span></div>
      <span className="auth-header-tag">Tài khoản Supabase</span>
    </header>
    <section className="auth-main">
      <div className="auth-hero">
        <BrandMark className="auth-logo" />
        <span className="eyebrow">CHÀO MỪNG BẠN</span>
        <h1 className="auth-title">{authMode === 'Đăng nhập' ? copy['COPY-10'] : copy['COPY-11']}</h1>
      </div>
      <form className="auth-card" onSubmit={attemptSignIn}>
        {authStep === 'email' ? <>
          <label className="auth-field"><span>Email</span><input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} autoComplete="email" placeholder="ban@example.com" required autoFocus /></label>
          {authError && <p className="field-error">{authError}</p>}
          <button className="button primary auth-submit" type="submit">Tiếp tục <ArrowRight size={16} /></button>
        </> : <>
          <div className="auth-account"><span>{authEmail}</span><button type="button" className="auth-edit" onClick={editAuthEmail}><Pencil size={13} /> Đổi</button></div>
          <label className="auth-field"><span>Mật khẩu</span><input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete={authMode === 'Đăng nhập' ? 'current-password' : 'new-password'} placeholder={authMode === 'Đăng nhập' ? copy['COPY-14'] : copy['COPY-15']} minLength={authMode === 'Đăng nhập' ? undefined : 6} required autoFocus /></label>
          {authError && <p className="field-error">{authError}</p>}
          <button className="button primary auth-submit" type="submit">{authMode} <ArrowRight size={16} /></button>
        </>}
        <div className="auth-switch">{authMode === 'Đăng nhập' ? copy['COPY-19'] : copy['COPY-20']} <button type="button" onClick={switchAuthMode}>{authMode === 'Đăng nhập' ? 'Đăng ký' : 'Đăng nhập'}</button></div>
      </form>
    </section>
    <footer className="auth-footer"><small className="sim-note">MVP · Xác thực và lưu dữ liệu bằng Supabase.</small></footer>
  </main>;

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Bỏ qua tới nội dung chính</a>
    <aside className="sidebar">
      <div className="brand-lockup"><BrandMark /><span><b>SHOPPING AUREN</b><small>home, in good rhythm</small></span></div>
      <p className="sidebar-caption">KHÔNG GIAN CỦA BẠN</p>
      <nav className="side-nav" aria-label={copy['COPY-28']}>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-button ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)}><Icon size={19} strokeWidth={1.8} /><span>{label}</span>{id === 'checklist' && activeChecklist && <i className="nav-indicator" />}</button>)}</nav>
      <button className="sidebar-profile" onClick={() => setScreen('settings')}><span className="avatar">{(authEmail[0] ?? 'A').toUpperCase()}</span><span><b>{authEmail || copy['COPY-29']}</b><small>Tài khoản Supabase</small></span><ChevronRight size={18} /></button>
    </aside>

    <div className="mobile-top"><BrandMark /><b>SHOPPING AUREN</b></div>
    <main className="main-area" id="main-content" tabIndex={-1}>
      <header className="topbar"><div className="breadcrumb">Không gian của bạn <ChevronRight size={14} /> <b>{navItems.find((x) => x.id === screen)?.label}</b></div></header>

      {screen === 'home' && <section className="page-content">
        <div className="week-caption"><ShoppingBasket size={16} /><b>Tuần hiện tại</b><span>· 7 ngày</span></div>
        <div className="day-grid">{weekdays.map((day) => <article className={`day-card ${dragOverDay === day ? 'drag-over' : ''}`} key={day} onDragOver={(event) => { event.preventDefault(); setDragOverDay(day); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverDay(null); }} onDrop={(event) => { event.preventDefault(); const source = draggingPlacement; setDragOverDay(null); setDraggingPlacement(null); if (source) moveMeal(source, day); }}><header><b>{day}</b></header><div className="meal-list">{!data.plan[day].length && <p className="meal-empty"><UtensilsCrossed size={15} /><span>Chưa có món ăn</span></p>}{data.plan[day].map((id, index) => {
          const meal = data.meals.find((entry) => entry.id === id);
          return meal ? <div className={`meal-chip ${draggingPlacement?.day === day && draggingPlacement.index === index ? 'dragging' : ''}`} key={`${id}-${index}`} draggable onDragStart={(event) => { setDraggingPlacement({ day, index }); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', meal.name); }} onDragEnd={() => { setDraggingPlacement(null); setDragOverDay(null); }} title={copy['COPY-39']}><span className="meal-chip-copy"><b>{meal.name}</b><small>{meal.ingredientIds.map((ingredientId) => data.ingredients.find((ingredient) => ingredient.id === ingredientId)?.name).filter((name): name is string => Boolean(name)).join(' · ') || copy['COPY-38']}</small></span><button aria-label={`Gỡ ${meal.name}`} draggable={false} onClick={() => { updateData({ ...data, plan: { ...data.plan, [day]: data.plan[day].filter((_, i) => i !== index) } }); }}><X size={14} /></button></div> : null;
        })}</div><button className="add-meal" onClick={() => openMealPickerFor(day)}><Plus size={16} /><span>Thêm món ăn</span><small>{data.plan[day].length}/3</small></button></article>)}</div>
        <section className="products-section"><div className="section-heading"><div><h2>Sản phẩm</h2><p>Sản phẩm cần mua trong tuần này.</p></div><button className="button secondary" onClick={openProducts}><Plus size={16} /> Chọn sản phẩm</button></div><div className="product-panel"><div className="product-panel-heading"><b>{selectedProductIds().length} sản phẩm</b><span>· được chọn cho tuần này</span></div><div className="product-chips">{selectedProductIds().map((id) => data.products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)).map((product) => <div className="product-chip" key={product.id}><ShoppingBasket size={15} /><span>{product.name}</span><button aria-label={`Bỏ ${product.name}`} onClick={() => changeProductSelection(selectedProductIds().filter((id) => id !== product.id))}><X size={14} /></button></div>)}{!selectedProductIds().length && <p className="empty-inline">Chưa có sản phẩm nào được chọn.</p>}</div></div></section>
        <div className="bottom-actions"><button className="button primary" onClick={startChecklist}>Tạo Checklist <ArrowRight size={16} /></button><button className="button secondary" onClick={() => setDialog('reset')}><RotateCcw size={15} /> Đặt lại mẫu</button></div>
      </section>}

      {screen === 'checklist' && <section className="page-content checklist-page">
        {activeChecklist ? <><div className="progress-card"><div className="progress-title"><span className="progress-icon"><Check size={17} /></span><span><b>Đang tiến hành</b><small>{checkedCount} / {itemCount} mục đã hoàn tất</small></span></div><div className="progress-track"><span style={{ transform: `scaleX(${progress / 100})` }} /></div><b>{progress}%</b></div>
          <div className="checklist-layout"><div className="checklist-list"><div className="list-toolbar"><b>Tất cả mục <span>{itemCount}</span></b></div>
            {renderChecklistGroups(activeChecklist, toggleOccurrence, removeOccurrence, setEditingItemId, setEditingName, setEditingCategory, editingItemId, editingName, editingCategory, updateActiveChecklist)}
            <button className="add-from-library" onClick={() => setDialog('add-library')}><Plus size={16} /> Thêm nguyên liệu hoặc sản phẩm từ thư viện</button>
            <form className="other-form" onSubmit={addOther}><Plus size={16} /><input value={otherName} onChange={(e) => setOtherName(e.target.value)} aria-label={copy['COPY-73']} placeholder={copy['COPY-74']} /><button type="submit">Thêm</button></form>
          </div></div>
        </> : <div className="empty-card"><ClipboardList size={28} /><h2>Chưa có Checklist đang hoạt động</h2><p>Xem trước nội dung từ kế hoạch tuần rồi xác nhận để tạo phiên mua sắm.</p></div>}
        <div className="bottom-actions">{activeChecklist ? <><button className="button primary" onClick={() => { setDateFrom(''); setDateTo(''); setDateError(''); setDialog('complete'); }}>Hoàn tất mua sắm <Check size={16} /></button><button className="button danger-quiet" onClick={() => setDialog('delete-checklist')}><Trash2 size={15} /> Xóa Checklist</button></> : <button className="button primary" onClick={startChecklist}>Tạo Checklist <ArrowRight size={16} /></button>}</div>
      </section>}

      {screen === 'library' && <section className="page-content library-page">
        <div className="library-switch" role="tablist" aria-label={copy['COPY-152']}>{([['meal', copy['COPY-101']], ['ingredient', copy['COPY-97']], ['product', copy['COPY-46']]] as [EntityKind, string][]).map(([kind, label]) => <button key={kind} role="tab" aria-selected={selectedLibrary === kind} className={selectedLibrary === kind ? 'selected' : ''} onClick={() => { setSelectedLibrary(kind); setLibraryQuery(''); }}>{label}<span>{kind === 'meal' ? data.meals.length : kind === 'ingredient' ? data.ingredients.length : data.products.length}</span></button>)}</div>
        <div className="library-toolbar"><label className="search-field"><Search size={16} /><input value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} placeholder={`Tìm ${selectedLibrary === 'meal' ? 'món ăn' : selectedLibrary === 'ingredient' ? 'nguyên liệu' : 'sản phẩm'}`} /></label>{selectedLibrary === 'meal' && <label className="select-field library-select-filter"><span>Nguyên liệu</span><select value={libraryIngredientFilter} onChange={(e) => setLibraryIngredientFilter(e.target.value)}><option value="">Tất cả</option>{data.ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}</select><ChevronDown size={15} /></label>}{selectedLibrary === 'product' && <label className="select-field library-select-filter"><span>Danh mục</span><select value={libraryCategoryFilter} onChange={(e) => setLibraryCategoryFilter(e.target.value as Category | 'Tất cả')}><option>Tất cả</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={15} /></label>}</div>
        {visibleEntities.length ? <div className="entity-list">{visibleEntities.map((entity) => <article className="entity-row" key={entity.id}><div className="entity-mark">{selectedLibrary === 'meal' ? <BookOpen size={18} /> : selectedLibrary === 'ingredient' ? <Circle size={17} /> : <ShoppingBasket size={17} />}</div><div className="entity-copy"><b>{entity.name}</b><small>{selectedLibrary === 'meal' ? `${(entity as Meal).ingredientIds.length} nguyên liệu` : selectedLibrary === 'product' ? (entity as Product).category : (data.meals.filter((meal) => meal.ingredientIds.includes(entity.id)).length ? `Được dùng trong ${data.meals.filter((meal) => meal.ingredientIds.includes(entity.id)).map((meal) => meal.name).join(', ')}` : copy['COPY-97'])}</small></div><div className="entity-actions"><button aria-label={`Sửa ${entity.name}`} onClick={() => openEntity(selectedLibrary, entity as Ingredient | Meal | Product)}><Pencil size={16} /></button><button aria-label={`Xóa ${entity.name}`} onClick={() => { setPendingDelete({ kind: selectedLibrary, id: entity.id }); setDialog('delete-entity'); }}><Trash2 size={16} /></button></div></article>)}</div> : libraryQuery || (selectedLibrary === 'product' && libraryCategoryFilter !== 'Tất cả') || (selectedLibrary === 'meal' && libraryIngredientFilter) ? <div className="entity-list"><div className="empty-list">Không có kết quả phù hợp.</div></div> : <div className="empty-card"><Library size={28} /><button className="button primary" onClick={() => openEntity(selectedLibrary)}><Plus size={16} /> Thêm {selectedLibrary === 'meal' ? 'món ăn' : selectedLibrary === 'ingredient' ? 'nguyên liệu' : 'sản phẩm'}</button></div>}
        <button className="library-add-fab" aria-label={`Thêm ${selectedLibrary === 'meal' ? 'món ăn' : selectedLibrary === 'ingredient' ? 'nguyên liệu' : 'sản phẩm'}`} title={`Thêm ${selectedLibrary === 'meal' ? 'món ăn' : selectedLibrary === 'ingredient' ? 'nguyên liệu' : 'sản phẩm'}`} onClick={() => openEntity(selectedLibrary)}><Plus size={23} /></button>
      </section>}

      {screen === 'settings' && <section className="page-content settings-page">
        <section className="settings-card"><div className="card-title"><span className="settings-symbol"><Settings size={18} /></span><div><b>Tài khoản</b><small>Đăng nhập Supabase</small></div></div><div className="account-row"><span className="avatar large">{(authEmail[0] ?? 'A').toUpperCase()}</span><span><b>{authEmail || copy['COPY-29']}</b></span></div><p className="account-note"><CheckCircle2 size={15} /><span><b>Dữ liệu đồng bộ</b> · Lưu trong Supabase, riêng tư theo tài khoản đăng nhập.</span></p><button className="settings-action" onClick={() => { void getSupabaseBrowserClient().auth.signOut(); setAuthMode('Đăng nhập'); setAuthPassword(''); }}><LogOut size={17} /><span>Đăng xuất</span><ChevronRight size={17} /></button></section>
        <section className="settings-card history-section"><div className="card-title"><span className="settings-symbol"><Clock3 size={18} /></span><div><b>Lịch sử</b><small>Bản ghi mua sắm đã hoàn tất</small></div><span className="history-count">{snapshots.length}</span></div>{snapshots.length ? <div className="history-list">{snapshots.map((entry) => <article className="history-row" key={entry.id}><Archive size={18} /><div><b>{formatDate(entry.from)} – {formatDate(entry.to)}</b><small>{entry.items.length} mục · {formatTimestamp(entry.createdAt)}</small></div><button className="text-button" onClick={() => { setSnapshot(entry); setConfirmSnapshotDelete(false); setDialog('view-history'); }}>Xem <ArrowRight size={14} /></button></article>)}</div> : <div className="history-empty"><Clock3 size={23} /><b>Chưa có lịch sử</b><p>Bản ghi sẽ xuất hiện tại đây sau khi bạn hoàn tất mua sắm.</p></div>}</section>
      </section>}
    </main>
    <nav className="mobile-nav" aria-label={copy['COPY-28']}>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'active' : ''} onClick={() => setScreen(id)}><Icon size={20} strokeWidth={1.8} /><span>{label}</span></button>)}</nav>

    {dialog && <div className={`dialog-backdrop ${dialog === 'delete-entity' || dialog === 'delete-checklist' ? 'dialog-backdrop-centered' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(''); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} ref={dialogRef}><header><h2 id="dialog-title">{dialogTitle(dialog, targetDay, formKind, snapshot)}</h2><button className="icon-button" aria-label={copy['COPY-96']} onClick={() => setDialog('')}><X size={18} /></button></header>
      {dialog === 'meal-picker' && <div className="dialog-content"><p className="dialog-note">Chọn món ăn cho {targetDay} · tối đa 3 món.</p><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy['COPY-43']} /></label><div className="picker-list">{data.meals.filter((meal) => meal.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).map((meal) => <button className="picker-row" key={meal.id} onClick={() => addMeal(meal)} disabled={data.plan[targetDay].includes(meal.id) || data.plan[targetDay].length >= 3}><span><b>{meal.name}</b><small>{[meal.ingredientIds.map((id) => data.ingredients.find((ingredient) => ingredient.id === id)?.name).filter(Boolean).join(', '), data.plan[targetDay].includes(meal.id) ? copy['COPY-44'] : ''].filter(Boolean).join(' · ')}</small></span>{meal.ingredientIds.length ? <Plus size={17} /> : <span className="disabled-label">Chưa có nguyên liệu</span>}</button>)}</div><footer><button className="button secondary" onClick={() => setDialog('')}>Đóng</button></footer></div>}
      {dialog === 'product-picker' && <div className="dialog-content"><p className="dialog-note">Tìm và chọn nhiều sản phẩm từ thư viện cho kế hoạch tuần.</p><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy['COPY-54']} /></label><label className="select-field"><span>Danh mục</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as Category | 'Tất cả')}><option>Tất cả</option>{categories.map((c) => <option key={c}>{c}</option>)}</select><ChevronDown size={15} /></label><div className="picker-list">{data.products.filter((p) => p.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')) && (categoryFilter === 'Tất cả' || p.category === categoryFilter)).map((product) => { const already = selectedProductIds().includes(product.id); const checked = draftProducts.includes(product.id); return <button key={product.id} className="picker-row" disabled={already} onClick={() => setDraftProducts((old) => checked ? old.filter((id) => id !== product.id) : [...old, product.id])}><span><b>{product.name}</b><small>{product.category}</small></span>{already ? <span className="added-label">Đã thêm</span> : <span className={`select-check ${checked ? 'checked' : ''}`}>{checked && <Check size={14} />}</span>}</button>; })}{!data.products.some((p) => p.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')) && (categoryFilter === 'Tất cả' || p.category === categoryFilter)) && <p className="empty-list">Không có kết quả phù hợp.</p>}</div><footer className="dialog-footer"><span>{draftProducts.length} đã chọn</span><button className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" onClick={saveProductPicker}>Lưu lựa chọn</button></footer></div>}
      {dialog === 'delete-entity' && <div className="dialog-content"><p className="delete-confirm-copy">Bạn có chắc muốn xóa “{pendingDelete ? (pendingDelete.kind === 'meal' ? data.meals.find((item) => item.id === pendingDelete.id)?.name : pendingDelete.kind === 'ingredient' ? data.ingredients.find((item) => item.id === pendingDelete.id)?.name : data.products.find((item) => item.id === pendingDelete.id)?.name) : ''}” khỏi thư viện?</p><p>Thao tác này không thể hoàn tác.</p><footer className="dialog-footer"><button className="button secondary" onClick={() => { setPendingDelete(null); setDialog(''); }}>Hủy</button><button className="button danger-quiet" onClick={confirmDeleteEntity}>Xóa</button></footer></div>}
      {dialog === 'delete-checklist' && <div className="dialog-content"><p className="delete-confirm-copy">Xóa Checklist đang hoạt động?</p><p>Tất cả mục và trạng thái đã đánh dấu sẽ bị xóa.</p><footer className="dialog-footer"><button className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button danger-quiet" onClick={clearChecklist}>Xóa Checklist</button></footer></div>}
      {dialog === 'reset' && <div className="dialog-content"><p>Đặt lại mẫu sẽ xóa các món ăn và sản phẩm đã chọn trong kế hoạch tuần. Checklist đang hoạt động vẫn được giữ nguyên.</p><footer className="dialog-footer"><button className="button secondary" onClick={() => setDialog('')}>Không</button><button className="button primary" onClick={resetPlan}>Có</button></footer></div>}
      {dialog === 'preview' && <div className="dialog-content"><p className="dialog-note">Xem trước Checklist được tạo từ kế hoạch tuần hiện tại.</p><div className="preview-list">{groupPreviewItems(pendingChecklist).map((group, index) => <section className="preview-group" key={`${group.title}-${index}`}><header><span className="placement-dot" /><b>{group.title}</b></header>{group.entries.map((item) => <div className="preview-row" key={item.id}><Circle size={15} /><span>{item.name}</span></div>)}</section>)}</div><footer className="dialog-footer"><button className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" onClick={() => activeChecklist ? setDialog('overwrite') : confirmChecklist()}>Tạo Checklist</button></footer></div>}
      {dialog === 'add-library' && <div className="dialog-content"><p className="dialog-note">Mỗi lựa chọn được thêm thành một mục riêng trong Checklist.</p><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy['COPY-95']} /></label><div className="picker-list">{[...data.ingredients.map((x) => ({ ...x, kind: 'ingredient' as const })), ...data.products.map((x) => ({ ...x, kind: 'product' as const }))].filter((x) => x.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).map((item) => <button className="picker-row" key={`${item.kind}-${item.id}`} onClick={() => addFromLibrary(item.kind, item.id)}><span><b>{item.name}</b><small>{item.kind === 'ingredient' ? copy['COPY-97'] : item.category}</small></span><Plus size={16} /></button>)}</div><footer><button className="button secondary" onClick={() => setDialog('')}>Đóng</button></footer></div>}
      {dialog === 'overwrite' && <div className="dialog-content"><p>Checklist đang hoạt động sẽ được thay bằng Checklist mới từ kế hoạch tuần.</p><footer className="dialog-footer"><button className="button secondary" onClick={() => setDialog('')}>Không</button><button className="button primary" onClick={confirmChecklist}>Có</button></footer></div>}
      {dialog === 'complete' && <form className="dialog-content" onSubmit={(e) => { e.preventDefault(); completeShopping(); }}><p className="dialog-note">Lưu bản ghi chỉ đọc vào Lịch sử. Có thể hoàn tất dù còn mục chưa được đánh dấu.</p><label className="form-field">Từ ngày<input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDateError(''); }} required /></label><label className="form-field">Đến ngày<input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDateError(''); }} required /></label>{(dateError || (dateFrom && dateTo && dateFrom > dateTo)) && <p className="field-error">{dateError || copy['COPY-122']}</p>}<footer className="dialog-footer"><button type="button" className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" type="submit">Hoàn tất</button></footer></form>}
      {dialog === 'entity' && <form className="dialog-content" onSubmit={saveEntity}><label className="form-field">Tên<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></label>{formKind === 'meal' && <><label className="search-field"><Search size={16} /><input value={ingredientQuery} onChange={(e) => setIngredientQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} placeholder={copy['COPY-107']} /></label><fieldset className="ingredient-select"><legend>Nguyên liệu</legend>{data.ingredients.filter((ingredient) => ingredient.name.toLocaleLowerCase('vi').includes(ingredientQuery.toLocaleLowerCase('vi'))).sort((a, b) => Number(form.ingredientIds.includes(b.id)) - Number(form.ingredientIds.includes(a.id))).map((ingredient) => <label key={ingredient.id}><input type="checkbox" checked={form.ingredientIds.includes(ingredient.id)} onChange={(e) => setForm({ ...form, ingredientIds: e.target.checked ? [...form.ingredientIds, ingredient.id] : form.ingredientIds.filter((id) => id !== ingredient.id) })} />{ingredient.name}</label>)}{!data.ingredients.some((ingredient) => ingredient.name.toLocaleLowerCase('vi').includes(ingredientQuery.toLocaleLowerCase('vi'))) && <p className="empty-list">Không có kết quả phù hợp.</p>}</fieldset></>}{formKind === 'product' && <label className="form-field">Danh mục<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>}{formError && <p className="field-error">{formError}</p>}<footer className="dialog-footer"><button type="button" className="button secondary" onClick={() => setDialog('')}>Hủy</button><button className="button primary" type="submit">Lưu</button></footer></form>}
      {dialog === 'view-history' && snapshot && <div className="dialog-content"><div className="history-meta"><b>Từ ngày</b><span>{formatDate(snapshot.from)}</span><b>Đến ngày</b><span>{formatDate(snapshot.to)}</span><b>Thời điểm tạo</b><span>{formatTimestamp(snapshot.createdAt)}</span></div><div className="snapshot-list">{snapshot.items.map((item) => <div key={item.id}><span className={`snapshot-state ${item.checked ? 'checked' : ''}`}>{item.checked ? <Check size={13} /> : <X size={13} />}</span><span>{item.mealName ? `${item.mealName} · ` : ''}{item.name}</span>{item.category && <small>{item.category}</small>}</div>)}</div>{confirmSnapshotDelete ? <><p className="dialog-note delete-confirm-copy">Xóa bản ghi này khỏi Lịch sử?</p><footer className="dialog-footer"><button className="button secondary" onClick={() => setConfirmSnapshotDelete(false)}>Không</button><button className="button danger-quiet" onClick={() => { void shoppingRepository.deleteHistory(snapshot.id).then(() => { setSnapshots((entries) => entries.filter((entry) => entry.id !== snapshot.id)); setConfirmSnapshotDelete(false); setDialog(''); }).catch((error: unknown) => flash(error instanceof Error ? error.message : copy['COPY-136'], 'error')); }}>Có</button></footer></> : <footer className="dialog-footer"><button className="button danger-quiet" onClick={() => setConfirmSnapshotDelete(true)}>Xóa bản ghi</button><button className="button secondary" onClick={() => setDialog('')}>Đóng</button></footer>}</div>}
    </section></div>}
    {toast && <div className={`toast ${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>{toast.tone === 'error' ? <AlertCircle size={17} /> : toast.tone === 'success' ? <CheckCircle2 size={17} /> : <Info size={17} />}{toast.message}</div>}
  </div>;
}

function BrandMark({ className = '' }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-hidden="true"><svg viewBox="0 0 512 512" focusable="false"><rect width="512" height="512" rx="144" fill="#405140"/><path d="M124 164h264l28 230c4 34-19 58-53 58H149c-34 0-57-24-53-58l28-230Z" fill="#F8F7F1"/><path d="M183 177v-18c0-40 32-73 73-73s73 33 73 73v18" fill="none" stroke="#F8F7F1" strokeLinecap="round" strokeWidth="25"/></svg></span>;
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
  if (products.length) groups.push({ title: copy['COPY-46'], entries: products });
  if (others.length) groups.push({ title: copy['COPY-78'], entries: others });
  const ungrouped = items.filter((x) => x.kind === 'ingredient' && !x.placementId);
  if (ungrouped.length) groups.push({ title: copy['COPY-97'], entries: ungrouped });
  return <div className="checklist-groups">{groups.map((group, groupIndex) => <section className="occurrence-group" key={`${group.title}-${groupIndex}`}><header><span className="placement-dot" /><b>{group.title}</b>{group.entries.every((x) => x.checked) && <span className="group-done">Hoàn tất</span>}</header>{group.entries.map((item) => <article className={`check-row ${item.checked ? 'checked' : ''}`} key={item.id}>{editingId === item.id ? <><button type="button" className={`check-control ${item.checked ? 'checked' : ''}`} onClick={() => toggle(item.id)} aria-label={item.checked ? copy['COPY-85'] : copy['COPY-86']}>{item.checked && <Check size={14} />}</button><input className="inline-edit" value={editingName} onChange={(e) => setEditingName(e.target.value)} />{item.kind === 'product' && <select value={editingCategory} onChange={(e) => setEditingCategory(e.target.value as Category)}><option value={editingCategory}>{editingCategory}</option>{categories.filter((x) => x !== editingCategory).map((x) => <option key={x}>{x}</option>)}</select>}<button type="button" className="row-action" aria-label={copy['COPY-89']} onClick={() => { setItems((old) => old?.map((x) => x.id === item.id ? { ...x, name: editingName.trim() || x.name, category: item.kind === 'product' ? editingCategory : x.category } : x) ?? null); setEditingId(null); }}><Check size={16} /></button></> : <><button type="button" className="check-row-toggle" onClick={() => toggle(item.id)} aria-pressed={item.checked} aria-label={`${item.checked ? copy['COPY-85'] : copy['COPY-86']} ${item.name}`}><span aria-hidden="true" className={`check-control ${item.checked ? 'checked' : ''}`}>{item.checked && <Check size={14} />}</span><span className="check-name">{item.name}</span>{item.category && <small className="category-label">{item.category}</small>}</button><button type="button" className="row-action" aria-label={`Sửa ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); setEditingCategory(item.category ?? categories[0]); }}><Pencil size={15} /></button><button type="button" className="row-action remove-action" aria-label={`Xóa ${item.name}`} onClick={() => remove(item.id)}><X size={16} /></button></>}</article>)}</section>)}</div>;
}

function groupPreviewItems(items: ChecklistItem[]) {
  const placements = [...new Set(items.filter((item) => item.kind === 'ingredient' && item.placementId).map((item) => item.placementId!))];
  const groups = placements.map((id) => ({
    title: items.find((item) => item.placementId === id)?.mealName ?? copy['COPY-101'],
    entries: items.filter((item) => item.placementId === id),
  }));
  const products = items.filter((item) => item.kind === 'product');
  if (products.length) groups.push({ title: copy['COPY-46'], entries: products });
  return groups;
}

function dialogTitle(dialog: Dialog, day: Weekday, kind: EntityKind, snapshot: Snapshot | null) {
  if (dialog === 'meal-picker') return `Thêm món ăn · ${day}`;
  if (dialog === 'product-picker') return copy['COPY-48'];
  if (dialog === 'reset') return copy['COPY-63'];
  if (dialog === 'delete-entity') return copy['COPY-113'];
  if (dialog === 'delete-checklist') return copy['COPY-81'];
  if (dialog === 'preview') return copy['COPY-90'];
  if (dialog === 'overwrite') return copy['COPY-92'];
  if (dialog === 'complete') return 'Hoàn tất mua sắm';
  if (dialog === 'entity') return `${kind === 'meal' ? copy['COPY-101'] : kind === 'ingredient' ? copy['COPY-97'] : copy['COPY-46']}`;
  if (dialog === 'view-history') return copy['COPY-127'];
  if (dialog === 'add-library') return copy['COPY-151'];
  return snapshot ? copy['COPY-127'] : '';
}
function formatDate(value: string) { return value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : ''; }
function formatTimestamp(value: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
