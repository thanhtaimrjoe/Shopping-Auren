# Migration Plan — Final Decision

**作成日**: 2026-05-10  
**決定者**: Tai (BrSE) + Claude (PM)  
**目的**: 既存Supabaseデータベースの移行方針

---

## 🎯 最終決定

### 保持するテーブル
1. ✅ **meals** → そのまま使用（名前変更なし）
2. ✅ **products** → そのまま使用（名前変更なし、image_url保持）

### 削除するテーブル
1. ❌ **weekly_plans** → 削除（新設計で再構築）
2. ❌ **weekly_checklist_items** → 削除（新設計で再構築）

---

## 📋 新旧Schema対応

### 1. meals テーブル

#### 既存Schema（保持）
```sql
CREATE TABLE public.meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meals_pkey PRIMARY KEY (id)
);
```

#### 追加が必要なカラム
```sql
ALTER TABLE public.meals
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN category text NOT NULL DEFAULT 'other' CHECK (category IN ('japanese', 'western', 'chinese', 'other')),
ADD COLUMN deleted_at timestamp with time zone;

-- デフォルトユーザーIDを設定（後で実行）
UPDATE public.meals SET user_id = 'default-user-id';

-- user_id を NOT NULL に変更
ALTER TABLE public.meals ALTER COLUMN user_id SET NOT NULL;

-- インデックス追加
CREATE INDEX idx_meals_user_id_deleted_at ON public.meals(user_id, deleted_at);
CREATE INDEX idx_meals_category ON public.meals(category);
```

#### 変更点まとめ
| 項目 | 既存 | 変更後 | 理由 |
|------|------|--------|------|
| ingredients | jsonb | jsonb（保持） | 既存データ保持、APIで変換対応 |
| user_id | なし | uuid (FK) | マルチユーザー対応 |
| category | なし | text (Enum) | カテゴリ分類 |
| deleted_at | なし | timestamp | Soft Delete |

---

### 2. products テーブル

#### 既存Schema（保持）
```sql
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
```

#### 追加が必要なカラム
```sql
ALTER TABLE public.products
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN category text NOT NULL DEFAULT 'other' CHECK (category IN ('daily', 'consumable', 'other')),
ADD COLUMN deleted_at timestamp with time zone;

-- デフォルトユーザーIDを設定（後で実行）
UPDATE public.products SET user_id = 'default-user-id';

-- user_id を NOT NULL に変更
ALTER TABLE public.products ALTER COLUMN user_id SET NOT NULL;

-- インデックス追加
CREATE INDEX idx_products_user_id_deleted_at ON public.products(user_id, deleted_at);
CREATE INDEX idx_products_category ON public.products(category);
```

#### 変更点まとめ
| 項目 | 既存 | 変更後 | 理由 |
|------|------|--------|------|
| image_url | text | text（保持） | 既存画像データ保持 |
| user_id | なし | uuid (FK) | マルチユーザー対応 |
| category | なし | text (Enum) | カテゴリ分類 |
| deleted_at | なし | timestamp | Soft Delete |

---

### 3. 新規作成テーブル

#### meal_plans
```sql
CREATE TABLE public.meal_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL CHECK (EXTRACT(DOW FROM week_start_date) = 1),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meal_plans_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plans_user_week_unique UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_meal_plans_user_status ON public.meal_plans(user_id, status);
```

#### meal_plan_items
```sql
CREATE TABLE public.meal_plan_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE RESTRICT,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meal_plan_items_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plan_items_unique UNIQUE (meal_plan_id, day_of_week, meal_type)
);

CREATE INDEX idx_meal_plan_items_plan ON public.meal_plan_items(meal_plan_id);
```

#### shopping_lists
```sql
CREATE TABLE public.shopping_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  week_start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT shopping_lists_pkey PRIMARY KEY (id),
  CONSTRAINT shopping_lists_completed_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  )
);

CREATE INDEX idx_shopping_lists_user_status ON public.shopping_lists(user_id, status);
CREATE INDEX idx_shopping_lists_week ON public.shopping_lists(week_start_date);
```

#### shopping_items
```sql
CREATE TABLE public.shopping_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('meal', 'product', 'manual')),
  source_id uuid,
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shopping_items_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_shopping_items_list_checked ON public.shopping_items(shopping_list_id, is_checked);
CREATE INDEX idx_shopping_items_category ON public.shopping_items(category);
```

---

## 🔄 API設計の調整

### 既存テーブル名に合わせた変更

#### 旧API設計 → 新API設計
| 旧エンドポイント | 新エンドポイント | 理由 |
|----------------|----------------|------|
| `/api/v1/dishes` | `/api/v1/meals` | テーブル名 meals に合わせる |
| `/api/v1/miscellaneous` | `/api/v1/products` | テーブル名 products に合わせる |

#### meals API
```
GET    /api/v1/meals           # 料理一覧
GET    /api/v1/meals/{id}      # 料理詳細
POST   /api/v1/meals           # 料理登録
PUT    /api/v1/meals/{id}      # 料理更新
DELETE /api/v1/meals/{id}      # 料理削除
```

#### products API
```
GET    /api/v1/products        # 雑貨一覧
GET    /api/v1/products/{id}   # 雑貨詳細
POST   /api/v1/products        # 雑貨登録
PUT    /api/v1/products/{id}   # 雑貨更新
DELETE /api/v1/products/{id}   # 雑貨削除
```

---

## 📝 Migration Steps

### Step 1: バックアップ
```sql
-- 既存データをバックアップ
CREATE TABLE meals_backup AS SELECT * FROM meals;
CREATE TABLE products_backup AS SELECT * FROM products;
```

### Step 2: 旧テーブル削除
```sql
-- weekly_plans と weekly_checklist_items を削除
DROP TABLE IF EXISTS weekly_checklist_items CASCADE;
DROP TABLE IF EXISTS weekly_plans CASCADE;
```

### Step 3: 既存テーブルにカラム追加
```sql
-- meals テーブル
ALTER TABLE public.meals
ADD COLUMN user_id uuid,
ADD COLUMN category text NOT NULL DEFAULT 'other',
ADD COLUMN deleted_at timestamp with time zone;

-- products テーブル
ALTER TABLE public.products
ADD COLUMN user_id uuid,
ADD COLUMN category text NOT NULL DEFAULT 'other',
ADD COLUMN deleted_at timestamp with time zone;
```

### Step 4: デフォルトユーザー設定
```sql
-- Supabase Auth でユーザー作成後、そのIDを使用
UPDATE public.meals SET user_id = 'your-user-id';
UPDATE public.products SET user_id = 'your-user-id';

-- NOT NULL 制約追加
ALTER TABLE public.meals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN user_id SET NOT NULL;

-- 外部キー制約追加
ALTER TABLE public.meals
ADD CONSTRAINT meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.products
ADD CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Step 5: CHECK制約追加
```sql
-- meals category
ALTER TABLE public.meals
ADD CONSTRAINT meals_category_check CHECK (category IN ('japanese', 'western', 'chinese', 'other'));

-- products category
ALTER TABLE public.products
ADD CONSTRAINT products_category_check CHECK (category IN ('daily', 'consumable', 'other'));
```

### Step 6: インデックス追加
```sql
-- meals
CREATE INDEX idx_meals_user_id_deleted_at ON public.meals(user_id, deleted_at);
CREATE INDEX idx_meals_category ON public.meals(category);

-- products
CREATE INDEX idx_products_user_id_deleted_at ON public.products(user_id, deleted_at);
CREATE INDEX idx_products_category ON public.products(category);
```

### Step 7: 新規テーブル作成
```sql
-- meal_plans, meal_plan_items, shopping_lists, shopping_items
-- (上記のCREATE TABLE文を実行)
```

### Step 8: RLS (Row Level Security) 設定
```sql
-- meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own meals"
ON public.meals
FOR ALL
USING (auth.uid() = user_id);

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own products"
ON public.products
FOR ALL
USING (auth.uid() = user_id);

-- 同様に他のテーブルにも適用
```

---

## 🎯 ingredients (JSONB) の扱い

### 既存データ形式
```json
["じゃがいも", "人参", "玉ねぎ", "豚肉", "カレールー"]
```

### API対応方針
**Backend (FastAPI) で変換**:
- **GET**: JSONB配列 → 改行区切りテキスト（Frontend向け）
- **POST/PUT**: 改行区切りテキスト → JSONB配列（DB保存）

```python
# Backend変換例
def jsonb_to_text(ingredients_jsonb):
    return "\n".join(ingredients_jsonb)

def text_to_jsonb(ingredients_text):
    return ingredients_text.split("\n")
```

**理由**:
- 既存データ（JSONB）を保持
- Frontend は改行区切りテキストで扱う（シンプル）
- Backend で透過的に変換

---

## 📊 更新が必要なドキュメント

### 1. API Spec (`docs/spec/04_api/api_spec.md`)
- [ ] `/api/v1/dishes` → `/api/v1/meals`
- [ ] `/api/v1/miscellaneous` → `/api/v1/products`
- [ ] `products` に `image_url` フィールド追加

### 2. Database Schema (`docs/spec/03_design/database_schema.md`)
- [ ] `dishes` → `meals`
- [ ] `miscellaneous` → `products`
- [ ] `meals.ingredients`: TEXT → JSONB
- [ ] `products.image_url` 追加

### 3. User Stories (`docs/spec/02_requirements/user_stories.md`)
- [ ] 用語統一: 料理 → meals, 雑貨 → products

### 4. Decision Log (`docs/spec/05_tracking/decisions.md`)
- [ ] DEC-010: 既存テーブル名保持の決定を記録

---

## ✅ Next Steps

1. **デフォルトユーザー作成**
   - Supabase Auth でユーザー登録
   - user_id を取得

2. **Migration Script作成**
   - `migrations/001_add_user_columns.sql`
   - `migrations/002_create_new_tables.sql`
   - `migrations/003_setup_rls.sql`

3. **ドキュメント更新**
   - API Spec
   - Database Schema
   - Decision Log

4. **Backend実装開始**
   - meals API (JSONB ↔ TEXT 変換)
   - products API (image_url 対応)

---

**作成者**: Claude (PM)  
**承認者**: Tai (BrSE)  
**作成日**: 2026-05-10  
**ステータス**: ✅ Approved
