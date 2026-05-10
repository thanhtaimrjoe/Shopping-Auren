# Migration Analysis — Old Schema vs New Schema

**作成日**: 2026-05-10  
**目的**: 既存データベースと新設計の比較・移行計画

---

## 📊 既存Schema（Supabase）

### 1. meals
```sql
- id: uuid (PK)
- name: text
- ingredients: jsonb (配列形式)
- created_at: timestamp
- updated_at: timestamp
```

### 2. products
```sql
- id: uuid (PK)
- name: text
- image_url: text
- created_at: timestamp
- updated_at: timestamp
```

### 3. weekly_plans
```sql
- id: uuid (PK)
- week_label: text
- notes: text
- days: jsonb (オブジェクト形式)
- extra_items: jsonb (配列形式)
- week_start_date: date
- week_end_date: date
- status: text (draft/active/archived)
- archived_at: timestamp
- snapshot_version: integer
- created_at: timestamp
- updated_at: timestamp
```

### 4. weekly_checklist_items
```sql
- id: uuid (PK)
- weekly_plan_id: uuid (FK)
- name: text
- source_type: text (ingredient/extra)
- source_ref_id: text
- checked: boolean
- note: text
- day_keys: jsonb (配列)
- meal_names: jsonb (配列)
- meta: jsonb
- sort_order: integer
- created_at: timestamp
- updated_at: timestamp
```

---

## 🆚 新Schema（設計）との比較

### 1. meals → dishes

| 既存 (meals) | 新設計 (dishes) | 互換性 | 移行方法 |
|-------------|----------------|--------|---------|
| id | id | ✅ 互換 | そのまま |
| name | name | ✅ 互換 | そのまま |
| ingredients (jsonb) | ingredients (text) | ⚠️ 変換必要 | JSON配列 → 改行区切りテキスト |
| - | user_id | ❌ 新規 | デフォルトユーザーID設定 |
| - | category | ❌ 新規 | デフォルト値 'other' |
| - | deleted_at | ❌ 新規 | NULL |
| created_at | created_at | ✅ 互換 | そのまま |
| updated_at | updated_at | ✅ 互換 | そのまま |

**移行SQL例**:
```sql
INSERT INTO dishes (id, user_id, name, ingredients, category, created_at, updated_at)
SELECT 
    id,
    'default-user-id',
    name,
    array_to_string(ARRAY(SELECT jsonb_array_elements_text(ingredients)), E'\n'),
    'other',
    created_at,
    updated_at
FROM meals;
```

---

### 2. products → miscellaneous

| 既存 (products) | 新設計 (miscellaneous) | 互換性 | 移行方法 |
|----------------|----------------------|--------|---------|
| id | id | ✅ 互換 | そのまま |
| name | name | ✅ 互換 | そのまま |
| image_url | - | ⚠️ 削除 | 新設計では画像なし |
| - | user_id | ❌ 新規 | デフォルトユーザーID設定 |
| - | category | ❌ 新規 | デフォルト値 'other' |
| - | deleted_at | ❌ 新規 | NULL |
| created_at | created_at | ✅ 互換 | そのまま |
| updated_at | updated_at | ✅ 互換 | そのまま |

**移行SQL例**:
```sql
INSERT INTO miscellaneous (id, user_id, name, category, created_at, updated_at)
SELECT 
    id,
    'default-user-id',
    name,
    'other',
    created_at,
    updated_at
FROM products;
```

**注意**: `image_url` は新設計にないため、保持する場合は別途対応が必要

---

### 3. weekly_plans → meal_plans + meal_plan_items

| 既存 (weekly_plans) | 新設計 (meal_plans) | 互換性 | 移行方法 |
|--------------------|-------------------|--------|---------|
| id | id | ✅ 互換 | そのまま |
| week_label | - | ⚠️ 削除 | 不要（week_start_dateで識別） |
| notes | - | ⚠️ 削除 | 新設計では不要 |
| days (jsonb) | meal_plan_items | ⚠️ 正規化 | JSONを展開してitemsテーブルへ |
| extra_items (jsonb) | - | ⚠️ 別管理 | miscellaneousへ移行 |
| week_start_date | week_start_date | ✅ 互換 | そのまま |
| week_end_date | - | ⚠️ 削除 | 不要（week_start_dateから計算） |
| status | status | ✅ 互換 | draft/active → そのまま、archived → completed |
| archived_at | - | ⚠️ 削除 | 不要 |
| snapshot_version | - | ⚠️ 削除 | 不要 |
| - | user_id | ❌ 新規 | デフォルトユーザーID設定 |
| created_at | created_at | ✅ 互換 | そのまま |
| updated_at | updated_at | ✅ 互換 | そのまま |

**移行SQL例**:
```sql
-- meal_plans
INSERT INTO meal_plans (id, user_id, week_start_date, status, created_at, updated_at)
SELECT 
    id,
    'default-user-id',
    week_start_date,
    CASE 
        WHEN status = 'archived' THEN 'completed'
        ELSE status
    END,
    created_at,
    updated_at
FROM weekly_plans;

-- meal_plan_items (daysのJSONを展開)
-- 複雑なため、別途スクリプト作成が必要
```

---

### 4. weekly_checklist_items → shopping_items

| 既存 (weekly_checklist_items) | 新設計 (shopping_items) | 互換性 | 移行方法 |
|------------------------------|------------------------|--------|---------|
| id | id | ✅ 互換 | そのまま |
| weekly_plan_id | shopping_list_id | ⚠️ 変換 | weekly_plan_id → shopping_list_id（新規作成） |
| name | name | ✅ 互換 | そのまま |
| source_type | source_type | ⚠️ 変換 | ingredient → dish, extra → manual |
| source_ref_id | source_id | ✅ 互換 | そのまま |
| checked | is_checked | ✅ 互換 | そのまま |
| note | - | ⚠️ 削除 | 新設計では不要 |
| day_keys | - | ⚠️ 削除 | 新設計では不要 |
| meal_names | - | ⚠️ 削除 | 新設計では不要 |
| meta | - | ⚠️ 削除 | 新設計では不要 |
| sort_order | - | ⚠️ 削除 | 新設計では不要 |
| - | category | ❌ 新規 | デフォルト値 'other' |
| - | checked_at | ❌ 新規 | checked=true の場合 updated_at |
| created_at | created_at | ✅ 互換 | そのまま |
| updated_at | updated_at | ✅ 互換 | そのまま |

**移行SQL例**:
```sql
-- まず shopping_lists を作成
INSERT INTO shopping_lists (id, user_id, meal_plan_id, week_start_date, status, created_at)
SELECT 
    gen_random_uuid(),
    'default-user-id',
    wp.id,
    wp.week_start_date,
    'completed',
    wp.created_at
FROM weekly_plans wp;

-- shopping_items を移行
INSERT INTO shopping_items (id, shopping_list_id, name, category, source_type, source_id, is_checked, checked_at, created_at)
SELECT 
    wci.id,
    sl.id,
    wci.name,
    'other',
    CASE 
        WHEN wci.source_type = 'ingredient' THEN 'dish'
        WHEN wci.source_type = 'extra' THEN 'manual'
        ELSE 'manual'
    END,
    wci.source_ref_id::uuid,
    wci.checked,
    CASE WHEN wci.checked THEN wci.updated_at ELSE NULL END,
    wci.created_at
FROM weekly_checklist_items wci
JOIN shopping_lists sl ON sl.meal_plan_id = wci.weekly_plan_id;
```

---

## 🔍 主要な違い

### 1. データ構造
| 項目 | 既存 | 新設計 | 理由 |
|------|------|--------|------|
| 材料保存 | JSONB配列 | TEXT（改行区切り） | シンプル化、MVP優先 |
| 食事計画 | days (JSONB) | meal_plan_items (正規化) | クエリ効率化 |
| 追加アイテム | extra_items (JSONB) | miscellaneous (正規化) | データ整合性 |
| ユーザー管理 | なし | user_id (全テーブル) | マルチユーザー対応 |

### 2. 削除されたフィールド
- `products.image_url` → 新設計では画像なし
- `weekly_plans.notes` → 不要
- `weekly_plans.week_label` → week_start_dateで識別
- `weekly_checklist_items.note` → 不要
- `weekly_checklist_items.day_keys` → 不要
- `weekly_checklist_items.meal_names` → 不要
- `weekly_checklist_items.meta` → 不要
- `weekly_checklist_items.sort_order` → 不要

### 3. 追加されたフィールド
- 全テーブル: `user_id` → マルチユーザー対応
- `dishes.category` → カテゴリ分類
- `dishes.deleted_at` → Soft Delete
- `miscellaneous.category` → カテゴリ分類
- `miscellaneous.deleted_at` → Soft Delete
- `shopping_items.checked_at` → チェック日時

---

## 📋 移行計画

### Phase 1: 新スキーマ作成
1. 新しいテーブルを作成（migration script）
2. Enum型を作成
3. インデックスを作成
4. RLS（Row Level Security）を設定

### Phase 2: データ移行
1. **meals → dishes**
   - ingredients: JSONB配列 → 改行区切りテキスト
   - user_id: デフォルトユーザーID設定
   - category: 'other'

2. **products → miscellaneous**
   - image_url: 保存するか検討（別テーブル？）
   - user_id: デフォルトユーザーID設定
   - category: 'other'

3. **weekly_plans → meal_plans + meal_plan_items**
   - days (JSONB) を展開して meal_plan_items へ
   - extra_items は miscellaneous へ移行
   - status: archived → completed

4. **weekly_checklist_items → shopping_lists + shopping_items**
   - shopping_lists を新規作成
   - weekly_checklist_items → shopping_items
   - source_type: ingredient → dish, extra → manual

### Phase 3: データ検証
1. レコード数確認
2. データ整合性チェック
3. サンプルデータ確認

### Phase 4: 旧テーブル削除
1. バックアップ作成
2. 旧テーブルをリネーム（_old suffix）
3. 1週間様子見
4. 問題なければ削除

---

## ⚠️ 注意点

### 1. image_url の扱い
**問題**: `products.image_url` が新設計にない

**選択肢**:
- **Option A**: 画像機能を削除（MVP範囲外）
- **Option B**: 別テーブル作成（`dish_images`, `misc_images`）
- **Option C**: `dishes.image_url`, `miscellaneous.image_url` カラム追加

**推奨**: Option A（MVP優先）、将来的に Option B

### 2. days (JSONB) の展開
**問題**: `weekly_plans.days` の構造が不明

**必要な情報**:
- days の JSON 構造例
- どの曜日にどの料理が割り当てられているか

**例**:
```json
{
  "monday": { "breakfast": "meal-id-1", "lunch": "meal-id-2", "dinner": "meal-id-3" },
  "tuesday": { ... }
}
```

### 3. デフォルトユーザーID
**問題**: 既存データに user_id がない

**対応**:
1. Supabase Auth でデフォルトユーザー作成
2. 全データにそのユーザーIDを設定
3. 将来的に他のユーザーが追加可能

---

## 🎯 次のステップ

1. **days (JSONB) の構造確認**
   - サンプルデータを見せてください
   - 移行スクリプトを作成します

2. **image_url の方針決定**
   - 画像機能を残すか？
   - 残す場合、どう実装するか？

3. **デフォルトユーザー作成**
   - Supabase Auth でユーザー作成
   - user_id を取得

4. **Migration Script作成**
   - SQL migration files
   - データ移行スクリプト

---

## 📝 質問

1. **days (JSONB) の構造**: サンプルデータを見せてください
2. **image_url**: 画像機能を残しますか？
3. **extra_items (JSONB)**: 構造を見せてください
4. **移行タイミング**: いつ移行しますか？（開発前？開発後？）

---

**作成者**: Claude (PM)  
**作成日**: 2026-05-10  
**ステータス**: 🟡 分析中（追加情報待ち）
