# Changelog — Shopping Memo

**プロジェクト**: Shopping Memo  
**目的**: 開発変更履歴の記録

---

## 📝 記録ルール

### フォーマット
```markdown
## [YYYY-MM-DD HH:MM] - 機能名/バグ修正

**担当**: [AI名 or "AI Assistant"]  
**タイプ**: [Feature/Bugfix/Refactor/Test/Docs]  
**関連US**: [User Story ID]  
**影響範囲**: [Frontend/Backend/Database/API]

### 変更内容
- 変更点1
- 変更点2

### 実装詳細
- ファイル: `path/to/file`
- 変更理由: ...
- 技術的な決定: ...

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [ ] エラーハンドリング確認

### 備考
- 注意点や今後の課題

---
```

---

## 変更履歴

### [2026-05-09 17:18] - プロジェクト初期設定

**担当**: Claude (PM)  
**タイプ**: Docs  
**関連US**: -  
**影響範囲**: Project Setup

#### 変更内容
- プロジェクト仕様書作成完了
- Inception Deck作成
- User Stories作成（7 Epics, 15 Stories）
- Screen List作成（12画面定義）
- Database Schema設計（7テーブル）
- API Specification作成（30+ endpoints）
- Decision Log作成（9 decisions）
- Progress Tracking作成
- CLAUDE.md作成（AI開発者向けガイドライン）
- CHANGELOG.md作成（このファイル）

#### 実装詳細
- ファイル: `docs/spec/01_inception/inception_deck.md`
- ファイル: `docs/spec/02_requirements/user_stories.md`
- ファイル: `docs/spec/03_design/screen_list.md`
- ファイル: `docs/spec/03_design/database_schema.md`
- ファイル: `docs/spec/04_api/api_spec.md`
- ファイル: `docs/spec/05_tracking/decisions.md`
- ファイル: `docs/spec/05_tracking/progress.md`
- ファイル: `CLAUDE.md`
- ファイル: `docs/changelog/CHANGELOG.md`

#### Tech Stack決定
- Frontend: Next.js 14+ (App Router), TypeScript, TailwindCSS
- Backend: FastAPI (Python 3.13), PostgreSQL (Supabase)
- Auth: Supabase Auth
- Deployment: Vercel (Frontend), Railway (Backend)

#### 設計決定
- 材料管理: テキスト保存（改行区切り）→ MVP優先
- Soft Delete採用 → 履歴機能対応
- 週単位制約（月曜日開始）
- RESTful API採用
- 完全一致で材料重複排除

#### テスト
- [x] 仕様書レビュー完了
- [x] Tech Stack承認
- [x] Timeline確認（MVP: 1週間）

#### 備考
- 次のステップ: Backend project structure作成
- MVP期間: 2026-05-09 〜 2026-05-16
- デフォルトページ: `/meal-plan` (Dashboard削除)
- Main Layout: Sidebar + Header (Page Title) + Content Area

---

### [2026-05-10 02:32] - 既存データベース分析・移行計画作成

**担当**: Claude (PM)  
**タイプ**: Docs  
**関連US**: -  
**影響範囲**: Database, API

#### 変更内容
- 既存Supabase Schema分析完了
- Migration Analysis作成
- Migration Plan作成
- Decision Log更新（DEC-010追加）
- Project Setup Summary作成

#### 実装詳細
- ファイル: `docs/spec/03_design/migration_analysis.md`
- ファイル: `docs/spec/03_design/migration_plan.md`
- ファイル: `docs/spec/05_tracking/decisions.md` (DEC-010追加)
- ファイル: `docs/spec/00_summary/project_setup_summary.md`

#### 設計決定（DEC-010）
- **既存テーブル名保持**: `meals`, `products`
- **image_url保持**: `products.image_url` 保持
- **削除テーブル**: `weekly_plans`, `weekly_checklist_items`
- **API名変更**: `/api/v1/dishes` → `/api/v1/meals`, `/api/v1/miscellaneous` → `/api/v1/products`
- **ingredients保持**: JSONB形式保持、Backend で TEXT ↔ JSONB 変換

#### Migration Steps定義
1. `weekly_plans`, `weekly_checklist_items` 削除
2. `meals`, `products` にカラム追加（`user_id`, `category`, `deleted_at`）
3. 新規テーブル作成（`meal_plans`, `meal_plan_items`, `shopping_lists`, `shopping_items`）
4. RLS設定

#### テスト
- [x] 既存Schema分析完了
- [x] 新旧Schema比較完了
- [x] Migration Plan承認

#### 備考
- 既存データ（特に画像）を保持
- データ移行の手間を最小化
- Backend で JSONB ↔ TEXT 変換を実装予定

---

### [2026-05-10 02:47] - Migration Scripts作成

**担当**: Claude (PM)  
**タイプ**: Docs, Database  
**関連US**: -  
**影響範囲**: Database

#### 変更内容
- Database Migration Scripts作成完了（4ファイル）
- Migration Guide作成

#### 実装詳細
- ファイル: `backend/migrations/001_drop_old_tables.sql`
  - 旧テーブル削除（weekly_plans, weekly_checklist_items）
  
- ファイル: `backend/migrations/002_add_columns_to_existing_tables.sql`
  - meals, products にカラム追加（user_id, category, deleted_at）
  - CHECK制約追加
  - インデックス作成
  
- ファイル: `backend/migrations/003_create_new_tables.sql`
  - 新規テーブル作成（meal_plans, meal_plan_items, shopping_lists, shopping_items）
  - 外部キー制約
  - インデックス作成
  
- ファイル: `backend/migrations/004_setup_rls.sql`
  - Row Level Security (RLS) 設定
  - 全テーブルにポリシー作成（各4つ）
  
- ファイル: `backend/migrations/README.md`
  - Migration手順書
  - Rollback手順
  - トラブルシューティング

#### Migration Steps
1. 旧テーブル削除
2. 既存テーブルにカラム追加
3. デフォルトユーザーID設定
4. NOT NULL制約・外部キー追加
5. CHECK制約追加
6. インデックス作成
7. 新規テーブル作成
8. RLS設定

#### テスト
- [x] SQL構文チェック完了
- [ ] 開発環境で実行テスト（次のステップ）
- [ ] データ検証（次のステップ）

#### 備考
- 実行前に必ずバックアップ作成
- デフォルトユーザーを Supabase Auth で作成必要
- RLS により各ユーザーは自分のデータのみアクセス可能

---

### [2026-05-10 09:15] - Database Migration実行完了

**担当**: Claude (PM) + Tai (BrSE)  
**タイプ**: Database  
**関連US**: -  
**影響範囲**: Database

#### 変更内容
- Migration Step 1: weekly_plans, weekly_checklist_items 削除完了
- Migration Step 2: meals, products にカラム追加完了
  - user_id (NOT NULL, FK to auth.users)
  - category (default: 'other')
  - deleted_at (soft delete)
- Migration Step 3: 新規テーブル作成完了
  - meal_plans, meal_plan_items, shopping_lists, shopping_items
- Migration Step 4: RLS設定完了
  - 6テーブル × 4ポリシー = 24ポリシー

#### デフォルトユーザー
- user_id: `2e962ef9-d902-46db-ba2b-1f339b12a4f3`
- 既存 meals, products データに設定済み

#### テスト
- [x] 旧テーブル削除確認（0 rows）
- [x] 新規テーブル作成確認（4 rows）
- [x] RLS有効確認（6 tables, rowsecurity = true）
- [x] Policy確認（24 policies, 4 per table）

#### 備考
- meals.ingredients は JSONB 形式のまま保持
- Backend で JSONB ↔ TEXT 変換予定

---

### [2026-05-10 10:30] - Backend FastAPI Setup完了

**担当**: Claude (PM)  
**タイプ**: Feature  
**関連US**: -  
**影響範囲**: Backend

#### 変更内容
- FastAPI project structure作成
- Supabase接続設定
- JWT認証ミドルウェア実装
- 4つのrouter skeleton作成（meals, products, meal_plans, shopping_lists）
- requirements.txt作成（supabase 2.30.0, fastapi, uvicorn）
- .env設定完了
- Swagger UI動作確認完了 (http://localhost:8000/docs)

#### 実装詳細
- ファイル: `backend/app/main.py` — FastAPI app + CORS設定
- ファイル: `backend/app/core/config.py` — pydantic-settings
- ファイル: `backend/app/core/supabase.py` — Supabase client
- ファイル: `backend/app/core/auth.py` — JWT検証
- ファイル: `backend/app/api/v1/__init__.py` — router登録
- ファイル: `backend/app/api/v1/meals.py` — skeleton
- ファイル: `backend/app/api/v1/products.py` — skeleton
- ファイル: `backend/app/api/v1/meal_plans.py` — skeleton
- ファイル: `backend/app/api/v1/shopping_lists.py` — skeleton
- ファイル: `backend/requirements.txt`
- ファイル: `backend/.env`

#### テスト
- [x] uvicorn起動確認
- [x] Swagger UI確認 (http://localhost:8000/docs)
- [x] /health endpoint確認

#### 備考
- Python 3.13 + venv使用
- 次: meals API実装（JSONB ↔ TEXT変換）

---

### [2026-05-10 11:00] - Meals API実装

**担当**: Antigravity (AI Assistant)  
**タイプ**: Feature  
**関連US**: US-003 (meal CRUD)  
**影響範囲**: Backend, API

#### 変更内容
- `GET /api/v1/meals` — paginated list with category/search/sort/order/limit/offset filters
- `GET /api/v1/meals/{meal_id}` — single meal detail
- `POST /api/v1/meals` — create meal with validation
- `PUT /api/v1/meals/{meal_id}` — partial update (only provided fields)
- `DELETE /api/v1/meals/{meal_id}` — soft delete (sets deleted_at)
- JSONB ↔ TEXT conversion helpers (`jsonb_to_text`, `text_to_jsonb`)
- Pydantic schemas: `MealCreate`, `MealUpdate` with category enum validation

#### 実装詳細
- ファイル: `backend/app/api/v1/meals.py`
- JSONB変換: DB stores ingredients as JSON array → API returns newline-separated TEXT
- Soft Delete: DELETE sets `deleted_at` timestamp, does not remove row
- 409 Conflict: DELETE blocked if meal referenced in `meal_plan_items`
- 変更理由: DEC-010 — `meals` table replaces `dishes`, JSONB ↔ TEXT conversion in backend
- 技術的な決定: partial update in PUT (only non-None fields updated); count query separate for pagination total

#### テスト
- [ ] Unit Test追加
- [x] 動作確認完了 (curl + FastAPI)
- [x] エラーハンドリング確認（400, 401, 404, 422）

#### 備考
- `ingredients` JSONB in DB, TEXT (newline-separated) in API contract
- RLS enforced via Supabase anon key — each user sees only own meals
- `meal_plan_items.meal_id` column assumed; if not yet created, delete will proceed (graceful fallback)

---

## 次の開発者へ

このファイルに必ず変更内容を記録してください。

- コード実装 → 記録
- バグ修正 → 記録
- リファクタリング → 記録
- テスト追加 → 記録

**記録しないと、PMとBrSEがレビューできません！**

---

**最終更新**: 2026-05-09 17:18  
**更新者**: Claude (PM)
