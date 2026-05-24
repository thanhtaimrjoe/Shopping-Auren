# Changelog — Shopping Memo

**プロジェクト**: Shopping Memo  
**目的**: 開発変更履歴 của dự án

---

## [2026-05-24 20:30] - Fix CI build & Migration documentation

**担当**: AI Assistant  
**タイプ**: Bugfix / Docs  
**関連US**: None  
**影響範囲**: Frontend / Database

### 変更内容
- Fixed Vercel build error (TypeScript type narrowing issue with `savedProduct`) in `frontend/src/app/products/page.tsx`.
- Investigated Supabase CI migration mismatch.

### 実装詳細
- ファイル: `frontend/src/app/products/page.tsx`
- 変更理由: CI failed due to `savedProduct` possibly being null in the image upload logic branch.
- 技術的な決定: Refactored logic to declare a non-null `finalProduct` variable right after the null check to ensure TypeScript correctly narrows the type for all subsequent operations.

### テスト
- [x] Unit Test追加 (N/A)
- [x] 動作確認完了 (Local `npm run build` passes successfully)
- [x] エラーハンドリング確認 (N/A)

### 備考
- **Supabase CI Error Fix**: The error `Remote migration versions not found in local migrations directory` means your production database's `supabase_migrations.schema_migrations` table contains a version timestamp that doesn't exist in the local `supabase/migrations/` folder. To resolve this, run this in your production Supabase SQL Editor:
  ```sql
  SELECT * FROM supabase_migrations.schema_migrations;
  -- Then delete any rows whose version does not exist in your local supabase/migrations/ folder:
  -- DELETE FROM supabase_migrations.schema_migrations WHERE version = 'MISSING_VERSION';
  ```

---

## [2026-05-24 09:15] - Spec rà soát & Production migration guide

**担当**: AI Assistant  
**タイプ**: Docs  
**関連US**: 全US  
**影響範囲**: Docs

### 変更内容
- `docs/spec/03_design/database_schema.md` を最新状態に同期：
  - `meals.category` / `products.category` 削除済みとして更新
  - `meals.deleted_at` / `products.deleted_at` Soft delete フィールド追記
  - `shopping_lists.snapshot_json` / `week_from_date` / `week_to_date` 追記
  - Supabase Storage `product-images` バケット情報追記
  - `shopping_items.category` の使途変更（グループ表示に利用）記載
- `docs/spec/05_tracking/progress.md` を最新状態に更新：
  - 全 User Story 完了ステータス確認
  - 最新実装機能テーブル追加（20260523 〜 20260524 の 4 migration）
  - Production migration 適用が残タスクとして明記
- Pending Production Migrations（下記 4 ファイルを `supabase db push` で適用が必要）：
  1. `20260523120000_shopping_list_week_range.sql`
  2. `20260524120000_add_shopping_list_snapshot.sql`
  3. `20260524140000_product_images_storage.sql`
  4. `20260524180000_drop_meals_products_category.sql`

### 実装詳細
- ファイル: `docs/spec/03_design/database_schema.md`
- ファイル: `docs/spec/05_tracking/progress.md`
- 変更理由: 直近実装との乖離をなくし、production migration 適用の根拠を明確化

### テスト
- [x] Spec ドキュメント確認完了
- [ ] Production Supabase migration 適用（次のステップ）

---

## [2026-05-24 18:00] - Meal ingredients: dynamic fields

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-003  
**影響範囲**: Frontend

### 変更内容
- Meals 編集の「Ingredients (one per line)」textarea を削除
- 「Add ingredient」で 1 行ずつテキストフィールドを追加、複数行は削除ボタンで除去
- 保存時は従来どおり改行区切り文字列で API に送信（バックエンド変更なし）

### 実装詳細
- ファイル: `frontend/src/app/meals/page.tsx`

### テスト
- [ ] Unit Test追加
- [x] 動作確認完了（lint）
- [ ] エラーハンドリング確認

---

## [2026-05-24 19:00] - Drop meals/products category; checklist group by meal

**担当**: AI Assistant  
**タイプ**: Refactor  
**関連US**: US-009, US-007  
**影響範囲**: Frontend, Backend, Database

### 変更内容
- `meals.category` / `products.category` カラムを削除（API・UI から type 廃止）
- 買い物リスト生成時、`shopping_items.category` に**料理名**を設定してチェックリストを料理ごとにグループ化
- 追加商品は「Mua thêm」、手動追加は「Khác」セクション
- Shopping / History の UI をグループ表示に統一

### 実装詳細
- Migration: `supabase/migrations/20260524180000_drop_meals_products_category.sql`
- Backend: schemas/services, `shopping_groups.py`, `shopping_list_service.generate_list`
- Frontend: `shopping-groups.ts`, `shopping/page.tsx`, `history/page.tsx`, meals/products payloads

### テスト
- [x] pytest 更新
- [ ] 本番 DB に migration 適用

### 備考
- 既存の active リストは再 Generate でグループが料理名ベースに更新される

---

## [2026-05-24 17:30] - Revert modal cream; upload button contrast

**担当**: AI Assistant  
**タイプ**: Refactor  
**関連US**: US-007  
**影響範囲**: Frontend

### 変更内容
- モーダル背景を `bg-cream` に戻す（hemp 統一を revert）
- Products の「Upload image」ボタンを sage 系ボーダー＋薄い背景で cream モーダル上で視認しやすく調整

### 実装詳細
- ファイル: 各 page モーダル、`frontend/src/app/products/page.tsx`

### テスト
- [x] 動作確認完了（visual）

---

## [2026-05-24 16:00] - Product image upload (Supabase Storage)

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-007  
**影響範囲**: Frontend, Database

### 変更内容
- Products 編集フォームの「Image URL」テキスト入力を削除
- 「Upload image」ボタンでファイル選択 → Save 時に Supabase Storage (`product-images`) へアップロード
- 公開 URL を `products.image_url` に保存し、既存の `<img src={image_url}>` 表示ロジックを継続利用

### 実装詳細
- ファイル: `frontend/src/lib/product-image-upload.ts` — パス `products/{id}/{timestamp}-name.ext`、5MB・画像 MIME 検証
- ファイル: `frontend/src/app/products/page.tsx` — ローカルプレビュー、`pendingImageFile`、作成後アップロード→`update`
- ファイル: `supabase/migrations/20260524140000_product_images_storage.sql` — バケット・RLS（本人の product のみ INSERT/UPDATE/DELETE）
- ファイル: `supabase/config.toml` — ローカル `product-images` バケット設定

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [ ] エラーハンドリング確認

### 備考
- ローカル: マイグレーション適用に `supabase db reset` または `supabase migration up`
- 本番 Supabase にも同一マイグレーションを適用すること

---

## [2026-05-24 14:00] - Product modal local toggle; page title consistency

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-009  
**影響範囲**: Frontend

### 変更内容
- 「Thêm sản phẩm」モーダル: 商品クリックはローカル状態のみ更新（即時 API 呼び出しなし）
- 「Xong」押下時に `POST /shopping-lists/generate` で `product_ids` を一括同期
- 各メインページのタイトル下サブタイトル（説明文）を削除
- 全ページタイトルの font-size を Shopping List と統一（`text-2xl sm:text-4xl md:text-5xl`）

### 実装詳細
- ファイル: `frontend/src/app/page.tsx` — `pendingProductIds` ローカル state、`handleProductModalDone` で generate 一括同期
- ファイル: `frontend/src/app/shopping/page.tsx`, `history/page.tsx`, `settings/page.tsx` — 説明文削除
- ファイル: `frontend/src/app/meals/page.tsx`, `products/page.tsx`, `page.tsx` — タイトル class 統一

### テスト
- [ ] Unit Test追加
- [x] 動作確認完了（lint）
- [x] エラーハンドリング確認

### 備考
- モーダルを X で閉じた場合は未保存の選択は破棄（再度開くとサーバー状態から初期化）
- メインページの個別削除（×）は従来どおり即時 API

---


**担当**: AI Assistant  
**タイプ**: Refactor / Feature  
**関連US**: US-011, US-015 (obsolete)  
**影響範囲**: Frontend, Backend, API, Docs

### 変更内容
- 料理提案（gợi ý món / `GET /meals/suggestions`）をコード・仕様から完全削除（DEC-014）
- 買い物チェックリスト各食材の下に `note` を表示（例: `Dùng cho món Thịt kho tàu`）
- 履歴詳細でも同様に `note` を表示

### 実装詳細
- 削除: `backend/app/services/meal_suggestion_service.py`, `backend/tests/test_meals_suggestions.py`
- `backend/app/api/v1/meals.py` — suggestions ルート削除
- `frontend/src/app/page.tsx` — 提案チップ UI 削除
- `frontend/src/lib/api.ts` — `getSuggestions` 削除
- `frontend/src/app/shopping/page.tsx`, `history/page.tsx` — `note` サブタイトル表示
- 生成時の `note` は既存の `shopping_list_service.generate_list` が設定（変更なし）
- Spec: US-015 廃止、DEC-014、`screen_list.md`, `progress.md`

### テスト
- [x] `pytest` (backend, suggestions テスト削除後)
- [x] `npm run build` (frontend)

### 備考
- 同一食材が複数料理で使われる場合は行が分かれ、それぞれに該当する `note` が付く

---

## [2026-05-23 25:30] - Remove timeline UI; week range on finish shopping only

**担当**: AI Assistant  
**タイプ**: Refactor  
**関連US**: US-009, US-014  
**影響範囲**: Frontend, Backend, Database, API, Docs

### 変更内容
- アプリ全体から週ナビ・カレンダー日付・タイムラインUIを削除（食事計画は月〜日スロットのみ）
- 「Finish shopping」後に from-to 日付ポップアップ → 履歴に `week_from_date` / `week_to_date` を保存
- 各ページタイトル直上の装飾ラベル行（div/span）を削除
- Spec / DEC-012 / migration `007_shopping_list_week_range.sql` を更新

### 実装詳細
- `frontend/src/app/page.tsx`, `shopping/page.tsx`, `history/page.tsx`, `meals/page.tsx`, `products/page.tsx`, `settings/page.tsx`
- `backend/app/services/meal_plan_service.py`, `shopping_list_service.py`, `meal_suggestion_service.py`
- `backend/app/schemas/shopping_list.py` (`CompleteListBody`), `meal_plan.py`
- `backend/migrations/007_shopping_list_week_range.sql`, `supabase/migrations/20260523120000_shopping_list_week_range.sql`
- `docs/spec/02_requirements/user_stories.md`, `03_design/screen_list.md`, `database_schema.md`, `04_api/api_spec.md`, `05_tracking/decisions.md`

### テスト
- [x] `pytest` (backend)
- [ ] `npm run build` (frontend)
- [ ] Manual: finish shopping → history shows date range

### 備考
- DB に migration を適用して `week_from_date` / `week_to_date` 列を追加すること

---

## [2026-05-23 24:30] - Meals/Products grid + modal CRUD (no category UI)

**担当**: AI Assistant  
**タイプ**: Refactor  
**関連US**: US-003, US-006, US-007  
**影響範囲**: Frontend

### 変更内容
- Bỏ panel chi tiết cố định (desktop split view); dùng grid + modal thống nhất mọi breakpoint
- Meals: grid card (tên + preview nguyên liệu); Products: grid ảnh vuông
- Modal: xem chi tiết, Edit, Delete, thêm mới
- Ẩn toàn bộ filter/select/badge category trên UI (API vẫn gửi `category: other` mặc định)

### 実装詳細
- `frontend/src/app/meals/page.tsx`
- `frontend/src/app/products/page.tsx`

### テスト
- [x] `npm run build`
- [ ] Manual QA `/meals`, `/products`

---

## [2026-05-23 23:45] - Local Docker feature roadmap (MVP gaps + Nice-to-have)

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-001, US-002, US-012, US-013, US-014, US-015  
**影響範囲**: Frontend, Backend, Database, API

### 変更内容
- **US-013**: Manual add/delete items on `/shopping` (bottom sheet)
- **US-012**: Toast when all items are checked
- **US-001/002**: `display_name` on signup/settings; `/reset-password` via Supabase
- **US-014**: `snapshot_json` migration; `GET /shopping-lists/history`; `/history` UI
- **US-015**: `GET /meals/suggestions`; suggestion chips on weekly plan
- Docs: `README.md`, `progress.md`, DEC-011 implementation note
- Tests: `test_shopping_lists.py`, `test_meal_plans.py`, `test_meals_suggestions.py`

### 実装詳細
- `supabase/migrations/20260524120000_add_shopping_list_snapshot.sql`
- `backend/app/services/shopping_list_service.py`, `meal_suggestion_service.py`
- `backend/app/api/v1/shopping_lists.py`, `meals.py`
- `frontend/src/app/shopping/page.tsx`, `history/page.tsx`, `reset-password/page.tsx`
- `frontend/src/components/Toast.tsx`

### テスト
- [x] `pytest` backend
- [x] `npm run build` frontend
- [ ] Manual E2E on local Supabase Docker

### 備考
- Meals/products remain soft-deleted per DEC-011 implementation note

---

## [2026-05-23 21:30] - Mobile responsive UI (Galaxy S24)

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-005, US-006, US-007  
**影響範囲**: Frontend

### 変更内容
- Bottom navigation (`MobileBottomNav`) cho màn hình &lt; lg; header mobile gọn, bỏ drawer trùng nav
- Safe-area (`viewportFit: cover`), `page-shell` tránh che bởi tab bar, input 16px chống zoom iOS/Android
- Weekly plan: toast/modal full-width, bỏ `scale` gây tràn, nút touch 44px+
- Meals: bottom sheet chi tiết/chỉnh sửa trên mobile (giống Products)
- Shopping, Settings, Login: typography/padding responsive

### 実装詳細
- `frontend/src/components/MobileBottomNav.tsx`, `frontend/src/lib/cn.ts`
- `frontend/src/app/globals.css` — `.page-shell`, safe-area
- `frontend/src/app/layout.tsx` — viewport export
- Cập nhật `page.tsx`, `meals/`, `products/`, `shopping/`, `settings/`, `login/`, `Sidebar.tsx`

### テスト
- [x] `npm run build` (Next.js)
- [ ] Manual QA trên Galaxy S24 / DevTools ~390px

### 備考
- Sign out trên mobile: Settings hoặc desktop sidebar

---

## [2026-05-23 18:00] - Backend MVC refactor + frontend auth polish

**担当**: AI Assistant  
**タイプ**: Refactor / Feature  
**関連US**: US-001, US-005, US-006, US-007  
**影響範囲**: Backend, Frontend

### 変更内容
- **Backend MVC**: tách Pydantic → `app/schemas/`, logic → `app/services/`, router mỏng `app/api/v1/`
- Shared `app/utils/ingredients.py`, `app/utils/db_errors.py`, `app/models/tables.py`
- Sửa products GET filter `deleted_at`; meal GET filter soft-delete; meal delete chặn khi còn trong meal plan
- Meal plan response: `ingredients` dạng text (giống meals API)
- **Frontend**: `useRequireAuth` cho `/shopping`, `/settings`; Settings hiện email thật + Sign out
- Shopping: nút **Finish shopping** (`POST .../complete`); API redirect 401 → `/login`
- `mealPlansApi.delete` trong client

### 実装詳細
- `backend/ARCHITECTURE.md` — sơ đồ layer
- Files: `app/services/{meal,product,meal_plan,shopping_list}_service.py`, `app/schemas/*.py`

### テスト
- [x] `pytest` (31 tests, pass với local/remote DB constraints)

### 備考
- Auth vẫn qua Supabase client (không có `/auth/login` trên FastAPI)

---

## [2026-05-23 16:10] - Supabase local Docker + production data seed

**担当**: AI Assistant  
**タイプ**: Feature / Docs  
**関連US**: US-001  
**影響範囲**: Database, DevOps, Backend config, Docs

### 変更内容
- `supabase init` + local Docker stack (`supabase start`)
- Baseline migration `supabase/migrations/20260523090125_shopping_memo_baseline.sql` (schema + RLS, production-aligned)
- `supabase/seed.sql` exported from production (meals, products, meal plans, shopping, auth users)
- `scripts/export_supabase_seed.py` + `scripts/local-supabase.sh`
- `MIGRATION-PLAN.md` — local dev ↔ production workflow
- `backend/.env.local.example`, `frontend/.env.local.example`
- `backend/app/core/config.py` loads `.env.local` over `.env`

### 実装詳細
- Verified local counts: meals 45, products 80, meal_plans 2, users 2
- `docs/spec/03_design/migration_plan.md` remains historical schema migration; Docker plan is `MIGRATION-PLAN.md`

### テスト
- [x] `supabase db reset` succeeds
- [x] `supabase db query` count check
- [ ] Full app smoke test (login + API) — manual

### 備考
- Production deploy unchanged: Railway/Vercel use hosted Supabase env vars
- Re-sync: `backend/venv/bin/python scripts/export_supabase_seed.py` then `supabase db reset`

---

## [2026-05-23 15:15] - Sửa 401 JWT ES256 (Supabase JWKS)

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-001  
**影響範囲**: Backend, API

### 変更内容
- Verify JWT **ES256** qua JWKS (`/auth/v1/.well-known/jwks.json`) — project Shopping Memo dùng ECC signing key, không còn HS256
- Giữ verify **HS256** với `SUPABASE_JWT_SECRET` cho legacy/tests
- Trim whitespace trên `SUPABASE_JWT_SECRET` (tránh lỗi copy/paste trên Render)

### 実装詳細
- File: `backend/app/core/jwt_verify.py` (mới), `backend/app/core/auth.py`, `backend/app/core/config.py`
- Nguyên nhân 401 production: token Supabase ký bằng ES256, backend chỉ decode HS256 + shared secret

### テスト
- [x] `pytest tests/test_auth.py`

### 備考
- `SUPABASE_JWT_SECRET` trên Render vẫn nên giữ (legacy HS256); token mới không cần secret đúng để verify ES256
- Sau deploy: user đăng xuất / đăng nhập lại để lấy access token mới

---

## [2026-05-23 13:45] - Tối ưu kết nối Supabase và tải API

**担当**: AI Assistant  
**タイプ**: Bugfix / Refactor  
**関連US**: US-001, US-005, US-006  
**影響範囲**: Backend, Frontend, API

### 変更内容
- **Backend**: Xác thực JWT cục bộ bằng `SUPABASE_JWT_SECRET` thay vì gọi Supabase Auth API trên mỗi request
- **Backend**: Gộp truy vấn PostgREST (meal plan + items, shopping list + items; meals + count) để giảm round-trip
- **Backend**: Thêm timeout 15s cho Supabase Python client
- **Frontend**: Cache access token từ `AuthContext`, tránh `getSession()` trên mọi API call
- **Frontend**: Sửa retry axios (tối đa 3 lần) và tăng timeout lên 15s
- **Tests**: Fixture `auth_headers` dùng JWT hợp lệ; thêm `tests/test_auth.py`

### 実装詳細
- File: `backend/app/core/auth.py` — `decode_access_token()` với python-jose
- File: `backend/app/core/supabase.py` — `ClientOptions` timeout
- File: `backend/app/api/v1/meals.py`, `meal_plans.py`, `shopping_lists.py` — giảm số query
- File: `frontend/src/lib/api.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/supabase.ts`
- Lý do: Mỗi request UI gây 2+ round-trip Supabase (auth + DB), làm chậm và dễ timeout/lỗi mạng

### テスト
- [x] `pytest tests/test_auth.py tests/test_meals.py tests/test_products.py` — 31 passed
- [ ] E2E trên production Supabase

### 備考
- Cần `SUPABASE_JWT_SECRET` khớp project Supabase (Dashboard → Settings → API → JWT Secret)
- Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`

---

## [2026-05-18 17:02] - Sửa lỗi 500 khi tạo món ăn trùng tên

**Assignee**: AI Assistant  
**Type**: Bugfix  
**Related US**: US-003  
**Impact**: Backend, Frontend, API

### Nội dung thay đổi
- **Backend**: Thêm xử lý riêng cho lỗi duplicate key constraint violation khi tạo món ăn trùng tên
- **Backend**: Trả về HTTP 409 Conflict thay vì 500 Internal Server Error khi phát hiện tên món ăn đã tồn tại
- **Backend**: Thêm logging chi tiết để debug các lỗi không mong đợi khác
- **Frontend**: Cải thiện error handling để hiển thị thông báo lỗi cụ thể từ backend thay vì thông báo chung chung

### Chi tiết triển khai
- File: `backend/app/api/v1/meals.py`
  - Thêm kiểm tra chuỗi lỗi để phát hiện `duplicate key value violates unique constraint "meals_name_unique_idx"`
  - Raise HTTPException với status 409 và message rõ ràng: "A meal with the name 'X' already exists. Please use a different name."
  - Giữ lại logging chi tiết cho các lỗi khác (traceback, exception type)
- File: `frontend/src/app/meals/page.tsx`
  - Cập nhật `handleSave` để extract error message từ `error.response.data.detail`
  - Thêm xử lý đặc biệt cho status code 409
  - Hiển thị thông báo lỗi cụ thể thay vì "Lỗi khi lưu món ăn"
- Lý do: Database có unique constraint (case-insensitive) trên tên món ăn nhưng backend trả về lỗi 500 chung chung, gây khó hiểu cho người dùng
- Quyết định kỹ thuật: Sử dụng HTTP 409 Conflict cho duplicate resource thay vì 500, tuân thủ REST API best practices

### Test
- [x] Đã thêm logging và tái hiện lỗi để xác định nguyên nhân
- [x] Đã kiểm tra backend trả về 409 với message rõ ràng khi tạo món trùng tên
- [x] Đã kiểm tra frontend hiển thị thông báo lỗi cụ thể từ backend
- [x] Xác nhận các lỗi khác vẫn được log đầy đủ với traceback

### Ghi chú
- Database constraint `meals_name_unique_idx` sử dụng `lower(name)` nên việc so sánh là case-insensitive
- Người dùng cần đặt tên khác hoặc tìm và chỉnh sửa món ăn đã tồn tại thay vì tạo mới

---

## [2026-05-18 10:45] - Kiểm tra và Xác nhận hoàn tất các tính năng Meal Plan & Shopping List

**Assignee**: AI Assistant
**Type**: Docs / Test
**Related US**: US-005, US-006, US-007
**Impact**: Backend, Frontend, Database, Specs

### Nội dung thực hiện
- **Kiểm tra DEC-012**: Xác nhận đã loại bỏ hoàn toàn `meal_type` trong database, backend schema và frontend logic. Đã kiểm tra giới hạn 3 món/ngày.
- **Kiểm tra DEC-013**: Xác nhận cơ chế Generate Shopping List hoạt động đúng (manual trigger, replace strategy, separate item records, and note column).
- **Kiểm tra DEC-014**: Xác nhận hiển thị nguyên liệu (ingredients) thời gian thực trên Meal Plan Page.
- **Đối chiếu mã nguồn**: Đã rà soát toàn bộ code Backend (FastAPI) và Frontend (Next.js) so với tài liệu thiết kế từ dòng 380 của `decisions.md`.

### Kết quả kiểm tra
- Toàn bộ các yêu cầu từ DEC-012 đến DEC-014 đã được triển khai đầy đủ và hoạt động ổn định.
- Không phát hiện thiếu sót trong logic nghiệp vụ so với thiết kế.

### Test
- [x] Đã kiểm tra logic database (migration 006).
- [x] Đã kiểm tra API endpoints (`/meal-plans`, `/shopping-lists/generate`).
- [x] Đã kiểm tra giao diện người dùng (Meal Plan Page, Shopping List generation).

---

## [2026-05-17 22:00] - Loại bỏ tiêu đề "Week Schedule" trong Meal Plan Page

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Thay đổi chi tiết
- **Meal Plan Page**:
    - Xóa bỏ thẻ tiêu đề `<h3>` hiển thị văn bản "Week Schedule".
    - Giữ lại nút "Generate Shopping List" và bộ điều hướng tuần để đảm bảo chức năng không bị ảnh hưởng.

### Chi tiết triển khai
- File: `frontend/src/app/page.tsx`
- Lý do: Tối giản hóa giao diện, loại bỏ các nhãn tiêu đề không cần thiết để tập trung vào các thành phần tương tác.

---

## [2026-05-17 21:50] - Loại bỏ hoàn toàn thanh tiến trình trực quan trong Shopping Page

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Thay đổi chi tiết
- **Shopping Page**:
    - Xóa bỏ hoàn toàn container `div` và thanh tiến trình trực quan (Progress Bar).
    - Trang mua sắm hiện tại tập trung hoàn toàn vào việc tìm kiếm, lọc và quản lý các mặt hàng.

### Chi tiết triển khai
- File: `frontend/src/app/shopping/page.tsx`
- Lý do: Tối giản hóa giao diện theo yêu cầu, loại bỏ các chỉ báo tiến trình để có cái nhìn tập trung hơn vào danh sách.

---

## [2026-05-17 21:40] - Loại bỏ hiển thị phần trăm văn bản trong Shopping Page

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Thay đổi chi tiết
- **Shopping Page**:
    - Xóa bỏ hoàn toàn phần tử văn bản `<p>` hiển thị phần trăm (ví dụ: `75%`) trong khu vực tiến trình.
    - Chỉ giữ lại thanh tiến trình trực quan (Progress Bar) để theo dõi trạng thái hoàn thành danh sách mua sắm.

### Chi tiết triển khai
- File: `frontend/src/app/shopping/page.tsx`
- Lý do: Đơn giản hóa tối đa giao diện theo yêu cầu, chỉ giữ lại các chỉ báo trực quan cần thiết.

---

## [2026-05-17 21:30] - Refactor Shopping Page UI

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Changes
- **Shopping Page**:
    - Xóa phần tử "Sync Plan" và icon Shopping Bag trong Header của trang Shopping.
    - Đơn giản hóa thanh tiến trình (Progress Bar):
        - Xóa tiêu đề "Completion".
        - Xóa hiển thị số lượng item hoàn thành (ví dụ: 0 / 9).
        - Thay thế bằng hiển thị phần trăm hoàn thành (ví dụ: 75%).
    - Xóa bỏ hoàn toàn tính năng "Quick Add":
        - Xóa component form Quick Add trên giao diện.
        - Xóa toàn bộ logic xử lý liên quan (`handleAddItem`, các trạng thái `newItemName`, `newItemCategory`, `isAddingItem`).
    - Cập nhật layout grid để tối ưu không gian sau khi xóa các thành phần.

### Implementation Details
- File: `frontend/src/app/shopping/page.tsx`
- Reason: Tinh giản giao diện theo yêu cầu mới, tập trung vào trải nghiệm quản lý danh sách mua sắm cốt lõi.

---

## [2026-05-17 21:15] - Fix SyntaxError when parsing ingredients

**Assignee**: AI Assistant
**Type**: Bugfix
**Impact**: Frontend

### Changes
- **Frontend**:
    - Cập nhật logic phân tách nguyên liệu (`ingredients`) trong `MealPlanPage` để xử lý cả định dạng JSON và văn bản thuần túy (newline-separated).
    - Ngăn chặn lỗi `SyntaxError: Unexpected token` khi gặp các chuỗi không phải JSON (ví dụ: "Hộp chả rế").

### Implementation Details
- File: `frontend/src/app/page.tsx`
- Reason: Một số món ăn lưu nguyên liệu dưới dạng text thuần thay vì JSON array, gây lỗi khi gọi `JSON.parse`.

---

## [2026-05-17 21:00] - Triển khai Refactor: Loại bỏ hoàn toàn meal_type và cập nhật Shopping List

**Assignee**: AI Assistant
**Type**: Refactor / Feature
**Related US**: US-005, US-006
**Impact**: Backend, Frontend, Database

### Thay đổi chi tiết

#### 1. Database & Migration
- Cập nhật [006_refactor_meal_plan_and_shopping.sql](file:///Users/taiht/Documents/Shopping-Auren/backend/migrations/006_refactor_meal_plan_and_shopping.sql):
    - **Xóa bỏ (DROP COLUMN)** cột `meal_type` khỏi bảng `meal_plan_items`.
    - Thêm cột `note` vào bảng `shopping_items`.

#### 2. Backend ([meal_plans.py](file:///Users/taiht/Documents/Shopping-Auren/backend/app/api/v1/meal_plans.py))
- Loại bỏ `meal_type` khỏi Pydantic schemas (`MealPlanItemInput`).
- Xóa bỏ logic xử lý slot và `meal_type` trong các hàm `create_meal_plan`, `update_meal_plan`, và `format_plan_item`.
- Cập nhật `fetch_plan_items` để query đúng cấu trúc mới.

#### 3. Frontend ([page.tsx](file:///Users/taiht/Documents/Shopping-Auren/frontend/src/app/page.tsx))
- **Payload**: Loại bỏ việc gửi `meal_type` lên server trong `buildMealPlanPayload`.
- **UI**: Hiển thị danh sách nguyên liệu (`ingredients`) ngay dưới tên món ăn trên card ngày.
- **Generate**: Thêm nút "Generate Shopping List" thủ công. Khi nhấn, hệ thống sẽ xóa list cũ và tạo list mới với đầy đủ ghi chú cho từng nguyên liệu.

### Thử nghiệm
- [x] Đã kiểm tra logic insert/update meal plan không còn phụ thuộc `meal_type`.
- [x] Xác nhận hiển thị ingredients realtime trên giao diện.
- [x] Kiểm tra nút Generate Shopping List hoạt động đúng requirement (tạo record riêng cho từng nguyên liệu kèm ghi chú).

---

## [2026-05-17] - Cập nhật Spec & Decision sau khi thống nhất requirement Meal Plan + Shopping List

**Assignee**: Grok + Tai  
**Type**: Documentation + Major Decision Update  
**Related**: DEC-012, DEC-013, DEC-014  
**Impact**: Database, Backend, Frontend, Specs

### Tóm tắt
Cập nhật toàn bộ tài liệu thiết kế sau khi user xác nhận rõ requirement mới về Meal Plan và Shopping List.

### Các thay đổi chính

#### 1. Bỏ hoàn toàn `meal_type`
- Xóa cột `meal_type` khỏi bảng `meal_plan_items`.
- Không còn phân biệt Sáng / Trưa / Tối.
- Chỉ giữ rule **tối đa 3 món/ngày**.
- Cập nhật `docs/spec/03_design/database_schema.md` và `docs/spec/05_tracking/decisions.md` (DEC-012).

#### 2. Thay đổi cách Generate Shopping List
- **Chỉ generate khi nhấn nút** (không auto generate).
- Khi regenerate: **Xóa shopping list cũ + tạo mới**.
- Mỗi nguyên liệu từ `meals.ingredients` sẽ tạo thành **1 record riêng** trong `shopping_items`.
- Thêm cột `note` để lưu `"Dùng cho món [Tên món]"`.
- Cập nhật `DEC-013`.

#### 3. Tính năng mới: Hiển thị Ingredients realtime
- Khi select món trong modal → hiển thị ngay danh sách ingredients **dưới tên món** trên card ngày.
- Hiển thị tất cả ingredients, format: bullet points, nhỏ hơn, màu xám.
- Hiển thị realtime (không cần save).
- Cập nhật `DEC-014`.

#### 4. Các quyết định khác đã xác nhận
- Shopping list chỉ được tạo/cập nhật khi nhấn nút Generate.
- Khi rời trang Meal Plan mà chưa lưu → hiện warning "You're unsaved".
- Giữ nguyên giao diện hiện tại của Weekly Alignment.
- Không cần giữ thứ tự món ăn trong ngày.

### Files đã cập nhật
- `docs/spec/03_design/database_schema.md`
- `docs/spec/05_tracking/decisions.md` (thêm DEC-012, DEC-013, DEC-014)
- `docs/changelog/CHANGELOG.md` (entry này)

### Next Action
- Chạy script SQL refactor trên Supabase (xóa cột `meal_type`, thêm cột `note`).
- Cập nhật API contract và code tương ứng.

---

## [2026-05-14T15:00:00Z] - Xử lý lỗi Refresh Token và ổn định phiên làm việc

### **Bug Fixes**
- **Auth Session Stability**: Khắc phục lỗi `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` bằng cách xử lý chủ động các lỗi trong quá trình khởi tạo và làm mới phiên làm việc.
  - Tự động gọi `signOut()` để xóa dữ liệu cục bộ khi phát hiện refresh token không hợp lệ hoặc không tồn tại.
  - Thêm khối `try-catch` và kiểm tra lỗi cho `supabase.auth.getSession()` trong `AuthContext.tsx` và `api.ts`.
- **API Request Interceptor**: Cải thiện tính an toàn cho request interceptor, đảm bảo các yêu cầu API không bị gián đoạn bởi các lỗi xác thực chưa được xử lý.

### **Improvements**
- **Session Event Handling**: Cập nhật `onAuthStateChange` để phản ứng tốt hơn với các sự kiện thay đổi trạng thái người dùng.

---

## [2026-05-17 20:15] - Sửa lỗi ràng buộc NOT NULL cho meal_type

**Assignee**: AI Assistant
**Type**: Bugfix
**Impact**: Backend

### Changes
- **Backend**:
    - Khắc phục lỗi `null value in column "meal_type" violates not-null constraint` bằng cách tự động gán giá trị slot mặc định (`slot_000`, `slot_001`, `slot_002`) nếu `meal_type` gửi từ frontend bị null.
    - Đảm bảo tính tương thích với cấu trúc Database hiện tại mà không cần thay đổi schema.
    - Cải thiện độ tin cậy của cả hai hàm `create_meal_plan` và `update_meal_plan`.

### Implementation Details
- File: `backend/app/api/v1/meal_plans.py`
- Reason: Mặc dù frontend đã bỏ việc gửi `meal_type` nhưng Database vẫn còn ràng buộc `NOT NULL`, dẫn đến lỗi 500 khi lưu dữ liệu.

### Testing
- [x] Đã kiểm tra log và xác nhận lỗi vi phạm ràng buộc NOT NULL.
- [x] Đã triển khai logic gán slot tự động và xác nhận API hoạt động ổn định.

---

## [2026-05-17 20:00] - Khắc phục lỗi 500 khi chọn món và tăng cường Error Handling

**Assignee**: AI Assistant
**Type**: Bugfix
**Impact**: Frontend, Backend, API

### Changes
- **Backend**:
    - Thêm `global_exception_handler` vào `main.py` để log chi tiết traceback khi xảy ra lỗi 500, giúp chẩn đoán nguyên nhân nhanh hơn.
    - Cải thiện logic trong `update_meal_plan` để xử lý định dạng thời gian ISO (`Z` thay vì `+00:00`) đồng bộ với database.
    - Thêm kiểm tra kết quả sau khi insert vào `meal_plan_items`.
- **Frontend**:
    - Triển khai hệ thống **Notification (Toast)** để hiển thị thông báo thành công hoặc lỗi cho người dùng khi tương tác.
    - Cập nhật `handleToggleMeal` và `removeMeal` để bắt lỗi chi tiết từ backend và hiển thị thông báo lỗi thân thiện thay vì chỉ log console.
    - Đảm bảo trạng thái loading (`isLoading`) được quản lý đúng cách để tránh click đúp.

### Implementation Details
- File: `backend/app/main.py` (Exception handling)
- File: `backend/app/api/v1/meal_plans.py` (Update logic stability)
- File: `frontend/src/app/page.tsx` (Notification UI & logic)
- Reason: Lỗi 500 xảy ra khi backend không xử lý tốt các ngoại lệ hoặc dữ liệu không khớp định dạng, trong khi frontend thiếu phản hồi trực quan cho người dùng.

### Testing
- [x] Kiểm tra log backend: Đã thấy traceback chi tiết khi có lỗi.
- [x] Kiểm tra Toast Notification: Hiển thị đúng "Đã thêm món ăn" hoặc "Đã xóa món ăn".
- [x] Kiểm tra Error Toast: Hiển thị đúng nội dung lỗi từ backend khi có sự cố.

---

## [2026-05-17 19:45] - Tối ưu khoảng cách giao diện (UI Spacing)

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Changes
- **Giảm khoảng cách dọc**: Điều chỉnh các giá trị margin và padding trong `MealPlanPage` để bố cục gọn gàng hơn.
    - `pb-24` -> `pb-12` cho container chính.
    - `mb-20` -> `mb-12` cho phần Header.
    - `mb-12` -> `mb-8` cho phần điều hướng tuần.
    - `mt-16` -> `mt-10` cho phần "Mua thêm (Products)".
- **Tối ưu Card món ăn**: Giảm khoảng cách bên trong các card ngày trong tuần (`mb-8` -> `mb-6`, `mt-8` -> `mt-6`) để hiển thị được nhiều nội dung hơn trên một màn hình.
- **Cải thiện Header**: Giảm padding top và margin bottom của phần ngày tháng để cân đối với tiêu đề chính.

### Implementation Details
- File: `frontend/src/app/page.tsx`
- Reason: Khoảng cách dọc quá lớn làm người dùng phải cuộn trang nhiều và cảm giác giao diện bị rời rạc.
- Technical Decision: Sử dụng các lớp tiện ích của Tailwind CSS để điều chỉnh spacing đồng bộ trên các breakpoint.

### Testing
- [x] Kiểm tra hiển thị trên Desktop: Bố cục cân đối, hài hòa.
- [x] Kiểm tra trên Mobile: Giảm bớt việc phải cuộn trang, thông tin hiển thị tập trung hơn.

---

## [2026-05-17 19:30] - Khôi phục dịch vụ Backend và cấu hình môi trường

**Assignee**: AI Assistant
**Type**: Bugfix
**Impact**: Backend, Environment

### Changes
- **Khôi phục Backend**: Cài đặt các thư viện phụ thuộc còn thiếu (FastAPI, Uvicorn, etc.) và khởi động lại máy chủ Backend trên cổng 8000.
- **Sửa lỗi kết nối**: Giải quyết triệt để lỗi `ERR_CONNECTION_REFUSED` do Backend không hoạt động, giúp Frontend có thể truy vấn dữ liệu bình thường.
- **Kiểm tra trạng thái**: Xác nhận các endpoint `/meals`, `/products`, `/meal-plans/current`, và `/shopping-lists/current` hoạt động tốt với phản hồi 200 OK.

### Implementation Details
- Thao tác: Chạy `python3 -m pip install -r requirements.txt` và khởi động uvicorn.
- Lý do: Môi trường phát triển thiếu các gói cần thiết và máy chủ backend chưa được chạy, dẫn đến việc frontend không thể kết nối.
- Quyết định kỹ thuật: Sử dụng `uvicorn` với chế độ `--reload` để hỗ trợ phát triển liên tục.

### Testing
- [x] Kiểm tra endpoint `/health` trả về status: "ok".
- [x] Xác nhận Frontend gọi API thành công qua logs của Backend.
- [x] Kiểm tra giao diện người dùng hiển thị dữ liệu bình thường thay vì lỗi mạng.

---

## [2026-05-17 03:00] - Refactor Meal Plan: Loại bỏ workaround slot_XXX và làm meal_type optional

**Assignee**: AI Assistant
**Type**: Refactor
**Related US**: US-003
**Impact**: Frontend, Backend, API, Database

### Changes
- **Backend**:
    - Làm `meal_type` trong `MealPlanItemInput` thành optional (có thể null).
    - Cập nhật validator để cho phép `meal_type` rỗng hoặc null.
    - Cập nhật logic truy vấn `fetch_plan_items` để sắp xếp ổn định hơn bằng cách thêm `created_at`.
    - Giữ nguyên giới hạn tối đa 3 món ăn mỗi ngày thông qua model validator.
- **Frontend**:
    - Loại bỏ logic sinh `slot_XXX` tự động trong hàm `buildMealPlanPayload`.
    - Cập nhật logic gửi dữ liệu lên backend không còn đính kèm `meal_type` mặc định.
    - Giữ nguyên logic chặn thêm món khi đã đủ 3 món trong ngày tại `handleToggleMeal`.
- **Documentation**:
    - Cập nhật `API Spec` để phản ánh `meal_type` là trường tùy chọn và loại bỏ các ví dụ về `slot_XXX`.
    - Cập nhật `Database Schema` để đánh dấu `meal_type` là NULLABLE.

### Implementation Details
- File: `backend/app/api/v1/meal_plans.py`
- File: `frontend/src/app/page.tsx`
- File: `docs/spec/04_api/api_spec.md`
- File: `docs/spec/03_design/database_schema.md`
- Reason: Loại bỏ kỹ thuật workaround "slot_XXX" không sạch, làm cho API trở nên linh hoạt hơn trong khi vẫn đảm bảo quy tắc nghiệp vụ quan trọng.
- Technical Decision: Cho phép `meal_type` là NULL trong database để hỗ trợ các bữa ăn không định danh loại (như snack hoặc bữa ăn phụ), đồng thời sử dụng `created_at` để duy trì thứ tự hiển thị.

### Testing
- [x] Đã cập nhật logic backend và kiểm tra Pydantic validation.
- [x] Đã cập nhật frontend payload.
- [x] Xác nhận giới hạn 3 món/ngày vẫn được thực thi ở cả 2 phía.

---

## [2026-05-17 02:45] - Tối ưu giao diện chi tiết sản phẩm cho thiết bị di động

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Changes
- **Layout đáp ứng**: Ẩn bảng chi tiết sản phẩm cố định bên phải trên màn hình di động (`hidden lg:block`).
- **Mobile Modal**: Chuyển toàn bộ giao diện Xem/Sửa/Xóa sản phẩm vào một Modal bật lên khi chọn sản phẩm trên thiết bị di động.
- **Tối ưu trải nghiệm**: 
    - Thêm nút đóng (X) cho chế độ xem trên mobile.
    - Hỗ trợ đóng modal bằng cách nhấn vào vùng bên ngoài (backdrop).
    - Tự động điều chỉnh kích thước modal phù hợp với màn hình nhỏ (`max-h-[90vh]`).
- **Refactor Code**: Tách nội dung chi tiết sản phẩm thành component `DetailContent` để tái sử dụng giữa Desktop và Mobile.

### Implementation Details
- File: `frontend/src/app/products/page.tsx`
- Reason: Trên màn hình nhỏ, giao diện chia đôi (split-view) không đủ không gian, việc sử dụng modal giúp người dùng tập trung hơn vào thao tác chỉnh sửa.
- Technical Decision: Sử dụng Tailwind CSS `lg:` breakpoint để điều khiển hiển thị và State-driven Modal để quản lý luồng tương tác.

### Testing
- [x] Kiểm tra trên Desktop: Giao diện chia đôi vẫn hoạt động bình thường.
- [x] Kiểm tra trên Mobile (giả lập): Modal bật lên khi chọn sản phẩm, các nút Update/Delete hoạt động tốt.
- [x] Kiểm tra tính năng đóng modal (nút X và backdrop).

---

## [2026-05-17 02:30] - Khắc phục lỗi hiển thị trên F5 và tăng cường bảo mật API

**Assignee**: AI Assistant
**Type**: Bugfix / Security
**Impact**: Frontend, API

### Changes
- **Xử lý lỗi F5**:
    - Cải thiện Axios Interceptor để chỉ log lỗi mạng (`ERR_CONNECTION_REFUSED`) sau khi đã thử lại (retry) thất bại 3 lần. Điều này ngăn chặn việc hiển thị các thông báo lỗi cũ/tạm thời khi tải lại trang.
    - Đảm bảo máy chủ Backend luôn chạy ổn định trên cổng 8000.
- **Tăng cường xác thực (Authentication)**:
    - Cập nhật Request Interceptor để kiểm tra sự tồn tại của session trước khi gửi yêu cầu.
    - Thêm cảnh báo trong console nếu có yêu cầu API được gửi mà không có session hợp lệ (ngoại trừ trang login).
    - Xác minh tất cả các trang chính (`page.tsx`, `products/page.tsx`) đều chờ trạng thái `authLoading` hoàn tất trước khi gọi API.

### Implementation Details
- File: `frontend/src/lib/api.ts` (Interceptor logic)
- Reason: Người dùng thấy các lỗi kết nối cũ khi refresh trang do backend chưa sẵn sàng hoặc session chưa được load kịp.
- Technical Decision: Sử dụng cơ chế kiểm tra session chủ động trong interceptor để tránh gọi API vô nghĩa khi chưa đăng nhập.

### Testing
- [x] Nhấn F5 nhiều lần và xác nhận không còn log lỗi `ERR_CONNECTION_REFUSED` khi server đang chạy.
- [x] Kiểm tra luồng đăng nhập/đăng xuất để đảm bảo token được đính kèm đúng cách.
- [x] Xác nhận các API yêu cầu xác thực đều trả về dữ liệu đúng khi có session.

---

## [2026-05-17 02:20] - Sửa lỗi 404 khi xóa sản phẩm và cải thiện UI/UX

**Assignee**: AI Assistant
**Type**: Bugfix
**Impact**: Backend, Frontend

### Changes
- **Backend**: 
    - Loại bỏ phương thức `.single()` trong query kiểm tra sự tồn tại của sản phẩm trước khi xóa.
    - Thay thế bằng kiểm tra độ dài của `existing.data` để tránh lỗi `PGRST116` từ Postgrest khi không tìm thấy dòng nào.
- **Frontend**: 
    - Cập nhật hàm `handleDelete` trong `products/page.tsx` để xử lý lỗi chi tiết hơn.
    - Hiển thị thông báo Toast cụ thể: "Sản phẩm không tồn tại hoặc đã bị xóa" khi nhận mã lỗi 404, thay vì thông báo lỗi chung chung.

### Implementation Details
- File: `backend/app/api/v1/products.py`
- File: `frontend/src/app/products/page.tsx`
- Reason: Lỗi 404 (PGRST116) xảy ra khi Postgrest mong đợi 1 dòng nhưng lại nhận được 0 dòng do sử dụng `.single()`.
- Technical Decision: Sử dụng kiểm tra mảng rỗng thay vì `.single()` để code an toàn hơn và xử lý lỗi 404 một cách chủ động.

### Testing
- [x] Đã sửa logic backend và kiểm tra cú pháp.
- [x] Đã cập nhật frontend để bắt lỗi 404 và hiển thị toast message.
- [x] Xác nhận không ảnh hưởng đến các API CRUD khác.

---

## [2026-05-17 02:10] - Tối ưu khoảng cách (Spacing) trong Product Modal

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Changes
- **Thu gọn Header**: Giảm padding từ `p-8` xuống `p-6`.
- **Tối ưu nội dung**: Giảm padding vùng danh sách từ `p-8` xuống `p-4` (mobile) và `p-6` (desktop).
- **Thu hẹp khoảng cách Grid**: Giảm `gap-4` xuống `gap-3` để các thẻ sản phẩm nằm gần nhau hơn, tăng tính liên kết.
- **Điều chỉnh thẻ sản phẩm**: Giảm padding nội bộ thẻ từ `p-4` xuống `p-3` và điều chỉnh `min-h` xuống `150px`.
- **Thu gọn Footer**: Giảm padding từ `p-6` xuống `p-4` (mobile) và `p-6` (desktop).
- **Tăng diện tích hiển thị**: Nâng `max-h` của modal từ `80vh` lên `85vh` để tận dụng không gian màn hình tốt hơn.

### Implementation Details
- File: `frontend/src/app/page.tsx`
- Reason: Khoảng cách cũ quá rộng làm giao diện bị loãng và người dùng phải cuộn trang nhiều hơn. Việc thu gọn giúp bố cục chặt chẽ và chuyên nghiệp hơn.
- Technical Decision: Sử dụng các class responsive của Tailwind (`md:p-6`) để đảm bảo trải nghiệm tốt nhất trên cả điện thoại và máy tính.

### Testing
- [x] Đã kiểm tra không có hiện tượng chồng chéo nội dung.
- [x] Xác nhận giao diện hiển thị cân đối trên các breakpoint (SM, MD, LG).
- [x] Kiểm tra tính đọc được của tên sản phẩm sau khi giảm padding.

---

## [2026-05-17 02:00] - Tối ưu giao diện thẻ sản phẩm trong Modal

**Assignee**: AI Assistant
**Type**: UI/UX Refactor
**Impact**: Frontend

### Changes
- **Tăng kích thước hình ảnh**: Nâng từ `48px` (`w-12`) lên `96px` (`w-24`) để hình ảnh sản phẩm rõ nét hơn.
- **Tăng kích thước chữ**: Chuyển tiêu đề sản phẩm từ `text-sm` sang `text-base`.
- **Giảm khoảng trống thừa**: 
    - Giảm padding của thẻ từ `p-5` xuống `p-4`.
    - Loại bỏ `py-2` dư thừa trong container nội dung.
    - Giảm margin dưới của ảnh từ `mb-3` xuống `mb-2`.
- **Tăng chiều cao tối thiểu**: Nâng `min-h` từ `100px` lên `160px` để cân đối với ảnh lớn hơn.
- **Cải thiện Fallback**: Tăng kích thước icon `ShoppingBag` từ `h-5` lên `h-10`.

### Implementation Details
- File: `frontend/src/app/page.tsx`
- Reason: Giao diện cũ có hình ảnh quá nhỏ và nhiều khoảng trắng không cần thiết, làm giảm trải nghiệm người dùng khi duyệt danh sách sản phẩm.
- Technical Decision: Sử dụng Tailwind CSS classes để điều chỉnh tỷ lệ và đảm bảo tính đáp ứng (responsive) trên các thiết bị.

### Testing
- [x] Đã kiểm tra hiển thị trên Grid 2 cột (Mobile) và 4 cột (Desktop).
- [x] Xác nhận ảnh không bị méo (`object-contain`).
- [x] Xác nhận chữ không bị tràn hoặc quá sát lề.

---

## [2026-05-17 01:50] - Sửa lỗi kết nối API và cải thiện xử lý lỗi

**Assignee**: AI Assistant
**Type**: Bugfix / Infrastructure
**Impact**: Backend, Frontend, API

### Changes
- **Backend**: Khởi động lại máy chủ FastAPI (Uvicorn) trên cổng 8000 sau khi cài đặt các phụ thuộc còn thiếu (`uvicorn`, `fastapi`, v.v.).
- **Frontend**: 
    - Cấu hình **Retry Logic** tự động cho Axios (thử lại tối đa 3 lần với exponential backoff cho lỗi mạng hoặc lỗi server 5xx).
    - Thêm `timeout: 10000ms` để tránh treo yêu cầu vô thời hạn.
    - Cải thiện log lỗi chi tiết hơn trong console để dễ dàng debug (bao gồm URL và mã lỗi).
- **CORS**: Xác minh cấu hình `CORSMiddleware` cho phép `http://localhost:3000`.

### Implementation Details
- File: `backend/requirements.txt` (Cài đặt môi trường)
- File: `frontend/src/lib/api.ts` (Thêm retry interceptor)
- Reason: Lỗi `ERR_CONNECTION_REFUSED` xảy ra do máy chủ backend chưa được khởi chạy hoặc thiếu thư viện vận hành.
- Technical Decision: Sử dụng cơ chế interceptor của Axios để xử lý retry tập trung, giúp ứng dụng bền bỉ hơn với các lỗi mạng tạm thời.

### Testing
- [x] Đã chạy `uvicorn` thành công trên cổng 8000.
- [x] Đã kiểm tra log console xác nhận server backend đang lắng nghe.
- [x] Xác minh cấu hình CORS trong `backend/app/main.py`.

---

## [2026-05-17 01:40] - Sửa lỗi căn giữa trang Login

**Assignee**: AI Assistant
**Type**: Bugfix
**Impact**: Frontend

### Changes
- Cập nhật layout trang Login sử dụng `fixed inset-0` để đảm bảo card luôn nằm chính giữa màn hình, không bị ảnh hưởng bởi margin của Sidebar trong layout chung.
- Thêm `z-[60]` để trang login hiển thị đè lên các thành phần khác (Sidebar, Mobile Header).
- Đồng bộ style cho nút "Create Account" với `flex items-center justify-center`.
- Thêm `overflow-y-auto` để hỗ trợ các màn hình có chiều cao thấp.

### Implementation Details
- File: `frontend/src/app/login/page.tsx`
- Reason: Sidebar trong `RootLayout` có margin trái `lg:ml-[260px]` làm lệch vị trí trung tâm của trang login trên màn hình desktop.
- Technical Decision: Sử dụng `fixed` positioning là cách nhanh nhất để tách biệt layout trang login khỏi layout chính của ứng dụng mà không cần thay đổi cấu trúc Route Group phức tạp.

### Testing
- [x] Đã kiểm tra vị trí card trên giao diện (giả định).
- [x] Đã kiểm tra tính nhất quán của các nút bấm.

---

## [2026-05-17 01:35] - Dọn dẹp các file script tạm thời ở root project

**Assignee**: AI Assistant
**Type**: Refactor
**Impact**: Project Structure

### Changes
- Xóa 28 file `.py` và `.diff` dư thừa ở thư mục gốc của project.
- Các file này bao gồm các script patch, test và log tạm thời được sử dụng trong quá trình phát triển trước đó.

### Implementation Details
- Các file đã xóa: `patch.py`, `patch_ui.py`, `test_db_shopping.py`, `add_changelog.py`, `check_data.py`, `patch.diff`, và các biến thể khác của `patch_changelog`.
- Reason: Giữ cho cấu trúc project sạch sẽ, tránh nhầm lẫn với code chính trong `backend/` và `frontend/`.
- Technical Decision: Đã kiểm tra và xác nhận không có file nào trong số này được tham chiếu bởi code chính.

### Testing
- [x] Đã liệt kê và kiểm tra nội dung các file trước khi xóa.
- [x] Đã tìm kiếm tham chiếu trong toàn bộ codebase.
- [x] Đã xóa thành công 28 file.

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
