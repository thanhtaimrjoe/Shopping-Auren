# Migration Guide — Shopping Memo

**作成日**: 2026-05-10  
**プロジェクト**: Shopping Memo  
**目的**: データベース移行手順書

---

## 📋 Migration Files

| File | Description | Status |
|------|-------------|--------|
| `001_drop_old_tables.sql` | 旧テーブル削除 | ✅ Ready |
| `002_add_columns_to_existing_tables.sql` | 既存テーブルにカラム追加 | ✅ Ready |
| `003_create_new_tables.sql` | 新規テーブル作成 | ✅ Ready |
| `004_setup_rls.sql` | RLS設定 | ✅ Ready |

---

## ⚠️ 重要な注意事項

### 実行前の準備
1. **バックアップ作成**
   - Supabase Dashboard → Database → Backups
   - または手動でデータエクスポート

2. **デフォルトユーザー作成**
   - Supabase Dashboard → Authentication → Users
   - 新規ユーザー作成（メール + パスワード）
   - **user_id をコピー**（後で使用）

3. **本番環境では実行しない**
   - まず開発環境でテスト
   - 問題なければ本番環境へ

---

## 🚀 Migration手順

### Step 1: 旧テーブル削除

**ファイル**: `001_drop_old_tables.sql`

**実行方法**:
1. Supabase Dashboard → SQL Editor
2. `001_drop_old_tables.sql` の内容をコピー
3. 実行

**確認**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('weekly_plans', 'weekly_checklist_items');
```
→ 0 rows が返ればOK

---

### Step 2: 既存テーブルにカラム追加

**ファイル**: `002_add_columns_to_existing_tables.sql`

**実行方法**:

#### 2-1. カラム追加（最初の部分のみ実行）
```sql
BEGIN;

-- meals テーブル
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- products テーブル
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

COMMIT;
```

#### 2-2. デフォルトユーザーID設定
**重要**: `YOUR_DEFAULT_USER_ID` を実際のユーザーIDに置き換える

```sql
BEGIN;

UPDATE public.meals
SET user_id = 'YOUR_DEFAULT_USER_ID'
WHERE user_id IS NULL;

UPDATE public.products
SET user_id = 'YOUR_DEFAULT_USER_ID'
WHERE user_id IS NULL;

COMMIT;
```

**確認**:
```sql
-- user_id が NULL のレコードがないことを確認
SELECT COUNT(*) FROM public.meals WHERE user_id IS NULL;
SELECT COUNT(*) FROM public.products WHERE user_id IS NULL;
```
→ 両方とも 0 が返ればOK

#### 2-3. NOT NULL制約と外部キー追加
```sql
BEGIN;

-- NOT NULL 制約
ALTER TABLE public.meals
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.products
ALTER COLUMN user_id SET NOT NULL;

-- 外部キー制約
ALTER TABLE public.meals
ADD CONSTRAINT meals_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.products
ADD CONSTRAINT products_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
```

#### 2-4. CHECK制約追加
```sql
BEGIN;

ALTER TABLE public.meals
ADD CONSTRAINT meals_category_check
CHECK (category IN ('japanese', 'western', 'chinese', 'other'));

ALTER TABLE public.products
ADD CONSTRAINT products_category_check
CHECK (category IN ('daily', 'consumable', 'other'));

COMMIT;
```

#### 2-5. インデックス作成
```sql
BEGIN;

-- meals indexes
CREATE INDEX IF NOT EXISTS idx_meals_user_id_deleted_at
ON public.meals(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_meals_category
ON public.meals(category);

-- products indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id_deleted_at
ON public.products(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_products_category
ON public.products(category);

COMMIT;
```

**確認**:
```sql
-- meals テーブル構造確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'meals'
ORDER BY ordinal_position;

-- products テーブル構造確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;
```

---

### Step 3: 新規テーブル作成

**ファイル**: `003_create_new_tables.sql`

**実行方法**:
1. Supabase Dashboard → SQL Editor
2. `003_create_new_tables.sql` の内容をコピー
3. 実行

**確認**:
```sql
-- 新規テーブルが作成されたことを確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('meal_plans', 'meal_plan_items', 'shopping_lists', 'shopping_items')
ORDER BY table_name;
```
→ 4 rows が返ればOK

---

### Step 4: RLS設定

**ファイル**: `004_setup_rls.sql`

**実行方法**:
1. Supabase Dashboard → SQL Editor
2. `004_setup_rls.sql` の内容をコピー
3. 実行

**確認**:
```sql
-- RLS が有効になっていることを確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('meals', 'products', 'meal_plans', 'meal_plan_items', 'shopping_lists', 'shopping_items');
```
→ すべて `rowsecurity = true` であればOK

```sql
-- ポリシー数を確認
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
→ 各テーブルに4つのポリシーがあればOK

---

## ✅ 最終確認

### 1. テーブル一覧
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**期待される結果**:
- ✅ meals
- ✅ products
- ✅ meal_plans
- ✅ meal_plan_items
- ✅ shopping_lists
- ✅ shopping_items
- ❌ weekly_plans (削除済み)
- ❌ weekly_checklist_items (削除済み)

### 2. データ確認
```sql
-- meals データ確認
SELECT id, name, user_id, category, deleted_at
FROM public.meals
LIMIT 5;

-- products データ確認
SELECT id, name, image_url, user_id, category, deleted_at
FROM public.products
LIMIT 5;
```

### 3. RLS動作確認
```sql
-- 現在のユーザーで meals を取得できるか
SELECT * FROM public.meals LIMIT 1;

-- 現在のユーザーで products を取得できるか
SELECT * FROM public.products LIMIT 1;
```

---

## 🔄 Rollback手順

万が一問題が発生した場合：

### Option 1: Supabase Backup から復元
1. Supabase Dashboard → Database → Backups
2. 最新のバックアップを選択
3. Restore

### Option 2: 手動Rollback

#### Step 4 のRollback（RLS削除）
```sql
-- RLS を無効化
ALTER TABLE public.meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items DISABLE ROW LEVEL SECURITY;

-- ポリシー削除
DROP POLICY IF EXISTS "Users can view their own meals" ON public.meals;
-- (他のポリシーも同様に削除)
```

#### Step 3 のRollback（新規テーブル削除）
```sql
DROP TABLE IF EXISTS public.shopping_items CASCADE;
DROP TABLE IF EXISTS public.shopping_lists CASCADE;
DROP TABLE IF EXISTS public.meal_plan_items CASCADE;
DROP TABLE IF EXISTS public.meal_plans CASCADE;
```

#### Step 2 のRollback（カラム削除）
```sql
ALTER TABLE public.meals DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.meals DROP COLUMN IF EXISTS category;
ALTER TABLE public.meals DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE public.products DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS category;
ALTER TABLE public.products DROP COLUMN IF EXISTS deleted_at;
```

---

## 📝 トラブルシューティング

### エラー: "foreign key constraint fails"
**原因**: user_id が auth.users に存在しない

**解決**:
1. Supabase Auth でユーザーを作成
2. 正しい user_id を使用

### エラー: "column already exists"
**原因**: カラムが既に存在する

**解決**:
- `IF NOT EXISTS` を使用しているので通常は問題なし
- 既存のカラムを確認して、必要に応じてスキップ

### エラー: "permission denied"
**原因**: RLS が有効で、ポリシーが正しく設定されていない

**解決**:
1. Supabase Dashboard → Authentication でログイン
2. または一時的に RLS を無効化してテスト

---

## 🎯 Next Steps

Migration完了後：

1. **Backend実装開始**
   - FastAPI project setup
   - Supabase接続設定
   - Models & Schemas作成

2. **API実装**
   - Meals API（JSONB ↔ TEXT 変換）
   - Products API（image_url対応）
   - Meal Plans API
   - Shopping Lists API

3. **Frontend実装**
   - Next.js setup
   - Supabase Client setup
   - UI実装

---

**作成者**: Claude (PM)  
**作成日**: 2026-05-10  
**最終更新**: 2026-05-10  
**ステータス**: ✅ Ready for execution
