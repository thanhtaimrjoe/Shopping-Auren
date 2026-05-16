# Changelog — Shopping Memo

**プロジェクト**: Shopping Memo  
**目的**: 開発変更履歴 của dự án

---

## [2026-05-17 01:25] - Update Product Modal Rendering

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Changes
- Removed the `category` tag from products within the Extra Products modal.
- Added support for displaying the product's `image_url` if available, or a fallback `ShoppingBag` icon.
- Centered the content of the product grid items for a cleaner visual layout.

### Implementation Details
- File: `frontend/src/app/page.tsx`
- Reason: The user requested a simpler view focusing on the product image and name without the extra clutter of category tags in the modal.
- Technical Decision: Replaced the left-aligned text approach with a flex-column centered layout. Used `lucide-react`'s `ShoppingBag` icon as a placeholder for products without images.

### Testing
- [x] Verified products render with placeholder icons.
- [x] Verified category tags are removed.

---

## [2026-05-17 01:15] - Improve Meal Selection Modal UI

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Changes
- Applied the same visual feedback logic to the Meal Selection modal as the Product modal.
- Meals now show a `CheckCircle` icon and a highlighted background when selected for a specific day.
- Replaced `handleSelectMeal` with `handleToggleMeal`, allowing users to both add and remove meals directly from within the modal grid.
- Added a "Xong" button to the Meal modal to allow multi-selection before closing.

### Implementation Details
- File: `frontend/src/app/page.tsx`
- Reason: Consistency in UI design across different modals and improving the user experience for planning multiple meals.
- Technical Decision: Used a toggle pattern instead of simple add-and-close to reduce the number of clicks required when filling out a week's schedule.

### Testing
- [x] Verified meals can be toggled on/off within the modal.
- [x] Verified visual state (checkmarks) updates in real-time.
- [x] Verified "Xong" button closes the modal correctly.

---

## [2026-05-17 01:05] - Refactor Extra Products to Modal Grid View

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Related US**: US-013
**Impact**: Frontend

### Changes
- Replaced the inline product library in the Weekly Plan tab with a dedicated Modal window.
- Added a "Thêm sản phẩm" button to open the library.
- Implemented a Grid View for the product library modal for easier browsing and selection.
- Integrated multi-selection visual feedback (CheckCircle icon) inside the modal.

### Implementation Details
- File: `frontend/src/app/page.tsx`
- Reason: Showing the entire database of products inline takes up too much vertical space and cluttered the weekly schedule view.
- Technical Decision: Used a full-screen blurred backdrop modal with a responsive CSS grid (2 to 4 columns) to provide a modern, dashboard-like feel for selecting extra items.

### Testing
- [x] Verified modal opens/closes correctly.
- [x] Verified products can be selected from the grid and are immediately added to the shopping list.
- [x] Verified grid layout is responsive.

---

## [2026-05-17 00:55] - Add Extra Products section to Weekly Plan

**Assignee**: AI Assistant
**Type**: Feature
**Related US**: US-013
**Impact**: Frontend, Backend

### Changes
- Added a "Mua thêm (Products)" section to the Weekly Plan page (`/`).
- Users can now select items from their Product library directly while planning their week.
- Integrated `extraProducts` with the active shopping list using the `addItem` and `deleteItem` endpoints.
- Added a new `DELETE /api/v1/shopping-lists/{list_id}/items/{item_id}` endpoint to the backend.

### Implementation Details
- File: `backend/app/api/v1/shopping_lists.py` (Added `delete_item` endpoint)
- File: `frontend/src/app/page.tsx` (Added "Mua thêm" UI and logic)
- Reason: Buying groceries involves more than just meal ingredients. Allowing users to pick products from their library while viewing their weekly schedule improves the planning experience.
- Technical Decision: Instead of creating a new schema for "Extra Plan Items", we leverage the existing active shopping list. Selecting a product in the Weekly Plan tab immediately adds it to the Shopping List in the background. If no list exists, it is automatically generated.

### Testing
- [x] Verified products can be added to the shopping list from the Weekly Plan tab.
- [x] Verified products can be removed.
- [x] Verified integration between the two tabs (added items appear in Shopping List checklist).

---

## [2026-05-17 00:42] - Fix Sync Plan button disappearing

**Assignee**: AI Assistant
**Type**: Bugfix
**Related US**: US-012
**Impact**: Frontend

### Changes
- Updated etchCurrentList logic in shopping/page.tsx to unconditionally fetch the current meal plan's ID, even if an active shopping list already exists.

### Implementation Details
- File: rontend/src/app/shopping/page.tsx
- Reason: The currentMealPlanId was previously only populated if shoppingListsApi.getCurrent() returned a 404. When a shopping list existed, the ID was null, causing the Sync Plan button to be hidden.
- Technical Decision: Independent execution of both queries ensures the UI has access to all related weekly data (shopping list & meal plan), keeping action buttons consistently visible.

### Testing
- [x] Verified Sync Plan button is always visible when there is an active meal plan, regardless of shopping list existence.

---

## [2026-05-17 00:35] - Fix Shopping List not loading planned meals

**Assignee**: AI Assistant
**Type**: Bugfix
**Related US**: US-012
**Impact**: Frontend, Backend

### Changes
- Updated `shoppingListsApi.generate` to allow updating an existing empty/active shopping list instead of failing with 409 Conflict.
- Added a `Sync Plan` button to the Shopping List UI to allow users to manually pull in the latest meals from their weekly plan.
- Filtered out soft-deleted meals from the ingredient extraction process during shopping list generation.

### Implementation Details
- File: `backend/app/api/v1/shopping_lists.py` (Modified `generate_list` endpoint)
- File: `frontend/src/app/shopping/page.tsx` (Added `Sync Plan` button)
- Reason: Previously, if a user viewed the shopping list before adding meals to their plan, an empty list was created. Subsequent attempts to generate ingredients were blocked by a 409 error. Additionally, there was no UI to trigger a re-sync if the plan changed.
- Technical Decision: Allow the `generate` endpoint to gracefully delete old `source_type=meal` items and insert new ones while preserving `source_type=manual` custom items. This makes the shopping list robust and self-healing.

### Testing
- [x] Verified `Sync Plan` button correctly updates the shopping list items without duplicating.
- [x] Verified manual custom items are preserved during sync.

---

## [2026-05-17 00:25] - Implement Shopping List UI and Features

**Assignee**: AI Assistant
**Type**: Feature
**Related US**: US-012, US-013
**Impact**: Frontend

### Changes
- Implemented real integration for the Shopping List tab (frontend/src/app/shopping/page.tsx).
- Connected the page to shoppingListsApi.getCurrent, generate, updateItem, and addItem.
- Replaced the hardcoded INITIAL_ITEMS with dynamically fetched data from the user's active shopping list.
- Added a 'Generate List' fallback state when no active list exists for the current week but a meal plan is available.
- Added UI for manual item addition (Custom Item) directly from the shopping list view.

### Implementation Details
- File: frontend/src/app/shopping/page.tsx
- File: frontend/src/lib/api.ts (Added missing shoppingListsApi endpoints)
- Reason: Fulfillment of user stories to track checked status of items and allow ad-hoc manual additions.
- Technical Decision: Used optimistic UI updates for toggling item status to make the checklist feel responsive on mobile devices, falling back to server state on error.

### Testing
- [x] Verified shopping list generation works using a meal plan.
- [x] Verified items can be checked/unchecked.
- [x] Verified manual items can be added with chosen category.

---

## [2026-05-17 00:17] - Fix 422 error on saving meal plan with soft-deleted meals

**Assignee**: AI Assistant  
**Type**: Bugfix  
**Related US**: US-004  
**Impact**: Backend

### Changes
- Exclude soft-deleted meals (where deleted_at is not null) from GET /api/v1/meals endpoint.
- Added .is_(\"deleted_at\", \"null\") filter to both the main query and the count query in meals.py.

### Implementation Details
- File: ackend/app/api/v1/meals.py
- Reason: Prevents 422 Unprocessable Entity errors when a user tries to save a meal plan containing meals that were soft-deleted but still appeared in the UI.
- Technical Decision: Filtering deleted meals at the API source ensures UI consistency and data integrity.

### Testing
- [x] Verified filtering logic in backend.
- [x] Verified self-healing behavior in frontend (deleted meals are automatically stripped from payloads).

---

## [2026-05-17 00:08] - Meal slot仕様調整

**担当**: AI Assistant  
**タイプ**: Refactor  
**関連US**: US-006  
**影響範囲**: Frontend, Backend, Database, API

### 変更内容
- `breakfast/lunch/dinner` 固定名称は廃止しつつ、1日最大3件の制限は維持
- Frontend で4件目追加を抑止
- Backend で1日3件を超える payload を validation error に変更
- Migration 名と仕様説明を「可変スロットだが最大3件」へ修正

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `backend/app/api/v1/meal_plans.py`
- ファイル: `backend/migrations/005_replace_meal_type_slots.sql`
- ファイル: `docs/spec/03_design/database_schema.md`
- ファイル: `docs/spec/04_api/api_spec.md`
- 変更理由: Meal type の意味づけは不要だが、日次登録数の上限は現行運用に必要なため
- 技術的な決定: `slot_000` / `slot_001` / `slot_002` を使用し、件数上限は backend validator で担保

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- Supabase DB には `backend/migrations/005_replace_meal_type_slots.sql` を適用

---

## [2026-05-16 22:27] - 1日複数Meal登録制限解除

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-006  
**影響範囲**: Frontend, Backend, Database, API

### 変更内容
- Weekly Alignment で1日3件までしか meal を追加できない制限を解除
- `breakfast/lunch/dinner` 固定スロットを廃止し、`slot_000`, `slot_001` 形式の可変スロットへ変更
- Database migration を追加し、`meal_plan_items_type_check` 制約を削除
- API仕様書とDB設計書を新しい可変スロット仕様へ更新

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `backend/app/api/v1/meal_plans.py`
- ファイル: `backend/migrations/005_allow_unlimited_daily_meals.sql`
- ファイル: `docs/spec/03_design/database_schema.md`
- ファイル: `docs/spec/04_api/api_spec.md`
- 変更理由: 1日に4件以上 meal を登録するユースケースに対応するため
- 技術的な決定: 既存 `meal_type` カラムを表示順スロットとして再利用し、DB構造変更を最小化

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- Supabase DB に `backend/migrations/005_allow_unlimited_daily_meals.sql` の適用が必要

---

## [2026-05-16 22:18] - Weekly Plan保存422修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend, API

### 変更内容
- Weekly Alignment で meal plan 保存時に `422` となる問題を修正
- Frontend 保存 payload を backend spec の `week_start_date` + `meals[]` 形式へ変更
- 既存 plan は `PUT /meal-plans/{id}`、未作成週は `POST /meal-plans` を使用

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `frontend/src/lib/api.ts`
- 変更理由: Frontend が `date` と `meal_names` を送っており、backend の Pydantic schema と不一致だったため
- 技術的な決定: 画面の meal 名一覧を `mealDatabase` から `meal_id` へ変換し、表示順を `breakfast/lunch/dinner` スロットへマッピング

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- 1日3件を超える meal は backend 制約上保存対象外

---

## [2026-05-16 22:11] - Weekly Plan未作成時404ハンドリング修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend, API

### 変更内容
- Weekly Alignment で meal plan 未作成週の `404` を正常な空状態として扱うよう修正
- `Meal plan not found for this week` の console error を抑止
- 未作成週では `selectedMeals` を空に初期化

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `frontend/src/lib/api.ts`
- 変更理由: Backend の `404` は異常系ではなく「まだ meal plan がない」状態を表していたため
- 技術的な決定: `/meal-plans/current` の `404` は interceptor と画面側の両方で期待値として扱う

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- 真の API 異常は引き続き console に表示される

---

## [2026-05-16 22:06] - Meal選択モーダル一覧取得修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend

### 変更内容
- Weekly Alignment の meal 選択モーダルで meal list が空のままになる問題を修正
- 初回取得に失敗または未取得の場合、モーダルを開いたタイミングで再取得
- 読み込み中は既存の spinner 表示を継続

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- 変更理由: 画面初回 effect 時点で meal list が未取得のままでも、モーダル表示時に再取得していなかったため
- 技術的な決定: `openModal` 内で `mealDatabase.length === 0` かつ未読込中の場合のみ `fetchMeals()` を再実行

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- Backend 認証エラー時は一覧ではなく空表示のままになるため、必要なら通知追加を検討

---

## [2026-05-16 22:00] - Weekly Alignment APIループ修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend, API

### 変更内容
- Weekly Alignment画面で meal plan API が連続呼び出しされる問題を修正
- `weekStart` の再生成による effect 再発火を抑止
- Backend仕様に合わせて meal plan 取得クエリを `week_start` に修正

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- 変更理由: `Date` オブジェクトが毎レンダー新規生成され `useCallback` と `useEffect` の依存が毎回変化していたため
- 技術的な決定: `useMemo` で `weekStart` と `weekStartKey` を安定化し、 API クエリを backend endpoint 仕様に合わせた

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- `fetchMeals` は初回表示ごとに1回呼ばれる想定

---

## [2026-05-16 21:52] - 食事計画取得エラー修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend

### 変更内容
- Weekly Plan画面で meal plan 取得時に `data.meals.map` が undefined で落ちる問題を修正
- Backendの `meal_plan.meals` 配列レスポンスを日付キーの表示状態へ変換
- 旧形式の日付キー付き meal plan レスポンスにも引き続き対応

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- 変更理由: Backend APIの現在レスポンス形式とFrontend変換ロジックが不一致だったため
- 技術的な決定: `day_of_week` から週開始日基準の日付キーを生成し、meal名のみ表示状態へ格納

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- 保存処理のAPI形式差分は別途確認が必要

---

## [2026-05-14T14:30:00Z] - Release v0.2.0

### **New Features**
- **Authentication System**: Triển khai hệ thống xác thực người dùng hoàn chỉnh.
  - Tích hợp `Supabase Auth` cho việc đăng ký, đăng nhập và đăng xuất.
  - Thêm trang `login/page.tsx` với giao diện hiện đại.
  - Quản lý trạng thái người dùng toàn cục qua `AuthContext.tsx`.
- **Database Integration**: Chuyển đổi từ dữ liệu mẫu (mockup) sang cơ sở dữ liệu thực tế.
  - Kết nối Frontend với Backend FastAPI và Supabase DB.
  - Cập nhật các trang `meals`, `products` và `page.tsx` (Weekly Plan) để truy xuất dữ liệu thực.
- **API Client Standard**: Xây dựng bộ API client sử dụng `axios` với cơ chế tự động đính kèm JWT token.
  - Tệp ảnh hưởng: `frontend/src/lib/api.ts`, `frontend/src/lib/supabase.ts`.

### **Bug Fixes**
- **API Data Retrieval**: Sửa lỗi API `meals` và `products` trả về mảng rỗng do truy vấn cột `deleted_at` không tồn tại sau khi chuyển sang Hard Delete.
  - Tệp ảnh hưởng: `backend/app/api/v1/meals.py`, `backend/app/api/v1/products.py`.
- **Authentication Logic**: Khắc phục lỗi `401 Unauthorized` bằng cách chuyển cơ chế xác thực JWT từ giải mã cục bộ sang sử dụng Supabase SDK.
  - Tệp ảnh hưởng: `backend/app/core/auth.py`.
- **Rules of Hooks**: Sửa lỗi vi phạm thứ tự gọi Hooks trong `Sidebar.tsx` gây ra bởi việc `return null` sớm trước các `useEffect`.
  - Tệp ảnh hưởng: `frontend/src/components/Sidebar.tsx`.
- **Unnecessary 401 Logs**: Ngăn chặn việc gọi API khi người dùng chưa đăng nhập và ẩn log lỗi 401 không cần thiết trong console.
  - Tệp ảnh hưởng: `frontend/src/lib/api.ts`, `frontend/src/app/page.tsx`.
- **Network Connectivity**: Khắc phục lỗi `ERR_CONNECTION_REFUSED` bằng cách đảm bảo Backend server được khởi chạy và cấu hình CORS chính xác.

### **Improvements**
- **Error Handling**: Thêm cơ chế interceptors cho `axios` để ghi lại nhật ký lỗi chi tiết (API Error Response, Network Error) giúp dễ dàng chẩn đoán sự cố.
  - Tệp ảnh hưởng: `frontend/src/lib/api.ts`.
- **UI/UX Refinement**: 
  - Tăng khoảng cách (padding-top) cho tiêu đề phụ (Editorial Header) trên tất cả các trang chính để giao diện thoáng đãng hơn.
  - Bổ sung các biểu tượng điều hướng bị thiếu (`ChevronLeft`, `ChevronRight`) trong trang Meals.

### **Documentation Updates**
- **Spec Synchronization**: Đồng bộ hóa toàn bộ tài liệu đặc tả kỹ thuật (`docs/spec/`) để khớp với các quyết định thiết kế mới (DEC-011).
  - Thống nhất thuật ngữ: `dishes` -> `meals`, `miscellaneous` -> `products`.
  - Cập nhật logic xóa sang Hard Delete và cấu hình `JSONB` cho nguyên liệu.
- **Decision Log**: Ghi nhận quyết định **DEC-011** về việc thống nhất thuật ngữ và logic xóa dữ liệu.

---

## [2026-05-09T17:18:00Z] - Release v0.1.0

### **Documentation Updates**
- Khởi tạo toàn bộ bộ hồ sơ đặc tả dự án bao gồm: Inception Deck, User Stories, Screen List, Database Schema, API Specification, và Decision Log.
- Thiết lập quy trình phát triển và hướng dẫn cho AI Assistant (`AGENTS.md`).

---

**Người thực hiện**: AI Assistant  
**Ngày cập nhật cuối**: 2026-05-14  
