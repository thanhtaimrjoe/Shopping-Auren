# Database Schema — Shopping Memo

**作成日**: 2026-05-09  
**プロジェクト**: Shopping Memo  
**目的**: データベース設計とテーブル定義

---

## ER図

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐         ┌──────────────┐
│    meals    │         │   products   │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │ N:M                   │
       ▼                       │
┌─────────────┐                │
│ meal_plans  │                │
└──────┬──────┘                │
       │                       │
       │ 1:1                   │
       ▼                       │
┌─────────────┐                │
│shopping_lists│◄──────────────┘
└──────┬──────┘         1:N
       │
       │ 1:N
       ▼
┌─────────────┐
│shopping_items│
└─────────────┘
```

---

## テーブル定義

### 1. users（ユーザー）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NOT NULL | gen_random_uuid() | ユーザーID（PK） |
| email | VARCHAR(255) | NOT NULL | - | メールアドレス（Unique） |
| display_name | VARCHAR(100) | NULL | - | Tên hiển thị |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | now() | 更新日時 |

---

### 2. meals（料理）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NOT NULL | gen_random_uuid() | 料理ID（PK） |
| user_id | UUID | NOT NULL | - | ユーザーID（FK） |
| name | VARCHAR(100) | NOT NULL | - | 料理名 |
| ingredients | JSONB | NOT NULL | '[]'::jsonb | 材料 danh sách |
| category | VARCHAR(50) | NOT NULL | 'other' | カテゴリ（japanese/western/chinese/other） |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- INDEX: `user_id`
- INDEX: `category`

---

### 3. products（雑貨）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NOT NULL | gen_random_uuid() | 雑貨ID（PK） |
| user_id | UUID | NOT NULL | - | ユーザーID（FK） |
| name | VARCHAR(100) | NOT NULL | - | 雑貨名 |
| image_url | TEXT | NULL | - | 画像URL |
| category | VARCHAR(50) | NOT NULL | 'other' | カテゴリ（daily/consumable/other） |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- INDEX: `user_id`

---

### 4. meal_plans（食事計画）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NOT NULL | gen_random_uuid() | 計画ID（PK） |
| user_id | UUID | NOT NULL | - | ユーザーID（FK） |
| week_start_date | DATE | NOT NULL | - | 週の開始日（月曜日） |
| status | VARCHAR(20) | NOT NULL | 'draft' | ステータス（draft/active/completed） |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- UNIQUE INDEX: `user_id, week_start_date`
- INDEX: `status`

---

### 5. meal_plan_items（食事計画アイテム）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NOT NULL | gen_random_uuid() | アイテムID（PK） |
| meal_plan_id | UUID | NOT NULL | - | 食事計画ID（FK） |
| meal_id | UUID | NOT NULL | - | 料理ID（FK - public.meals.id） |
| day_of_week | INTEGER | NOT NULL | - | 曜日（0=月, 6=日） |
| meal_type | VARCHAR(20) | NULL | - | 日ごとの表示順スロット（例: breakfast, lunch, dinner / 最大3件） |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `meal_plan_id` REFERENCES `meal_plans(id)` ON DELETE CASCADE
- FOREIGN KEY: `meal_id` REFERENCES `meals(id)` ON DELETE RESTRICT
- UNIQUE INDEX: `meal_plan_id, day_of_week, meal_type`
- INDEX: `meal_plan_id`

---

### 6. shopping_lists（買い物リスト）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NOT NULL | gen_random_uuid() | リストID（PK） |
| user_id | UUID | NOT NULL | - | ユーザーID（FK） |
| meal_plan_id | UUID | NULL | - | 食事計画ID（FK） |
| week_start_date | DATE | NOT NULL | - | 週の開始日 |
| status | VARCHAR(20) | NOT NULL | 'active' | ステータス（active/completed） |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |
| completed_at | TIMESTAMP | NULL | - | 完了日時 |

**インデックス**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- FOREIGN KEY: `meal_plan_id` REFERENCES `meal_plans(id)` ON DELETE SET NULL
- INDEX: `user_id, status`
- INDEX: `week_start_date`

---

### 7. shopping_items（買い物アイテム）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NOT NULL | gen_random_uuid() | アイテムID（PK） |
| shopping_list_id | UUID | NOT NULL | - | 買い物リストID（FK） |
| name | VARCHAR(100) | NOT NULL | - | アイテム名 |
| category | VARCHAR(50) | NOT NULL | - | カテゴi |
| source_type | VARCHAR(20) | NOT NULL | - | ソース（meal/product/manual） |
| source_id | UUID | NULL | - | ソースID（料理IDまたは雑貨ID） |
| is_checked | BOOLEAN | NOT NULL | false | チェック済みフラグ |
| checked_at | TIMESTAMP | NULL | - | チェック日時 |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `shopping_list_id` REFERENCES `shopping_lists(id)` ON DELETE CASCADE
- INDEX: `shopping_list_id, is_checked`

**備考**:
- `source_type`: 料理由来/雑貨由来/手動追加を区別
- `source_id`: 元の料理IDまたは雑貨ID（トレーサビリティ用）

---

## マスターデータ

### カテゴリマスター（Enum型で定義）

#### dish_category（料理カテゴリ）
```sql
CREATE TYPE dish_category AS ENUM (
    'japanese',   -- 和食
    'western',    -- 洋食
    'chinese',    -- 中華
    'other'       -- その他
);
```

#### misc_category（雑貨カテゴリ）
```sql
CREATE TYPE misc_category AS ENUM (
    'daily',      -- 日用品
    'consumable', -- 消耗品
    'other'       -- その他
);
```

#### meal_type（食事タイプ）
```sql
CREATE TYPE meal_type AS ENUM (
    'breakfast',  -- 朝食
    'lunch',      -- 昼食
    'dinner'      -- 夕食
);
```

#### item_source_type（アイテムソース）
```sql
CREATE TYPE item_source_type AS ENUM (
    'dish',           -- 料理由来
    'miscellaneous',  -- 雑貨由来
    'manual'          -- 手動追加
);
```

---

## 初期データ

### サンプル料理
```sql
INSERT INTO dishes (user_id, name, ingredients, category) VALUES
('user-uuid', 'カレーライス', 'じゃがいも\n人参\n玉ねぎ\n豚肉\nカレールー', 'japanese'),
('user-uuid', 'パスタカルボナーラ', 'パスタ\nベーコン\n卵\n粉チーズ\n黒胡椒', 'western'),
('user-uuid', '麻婆豆腐', '豆腐\n豚ひき肉\n長ネギ\n豆板醤\n甜麺醤', 'chinese');
```

### サンプル雑貨
```sql
INSERT INTO miscellaneous (user_id, name, category) VALUES
('user-uuid', 'トイレットペーパー', 'daily'),
('user-uuid', '洗剤', 'consumable'),
('user-uuid', 'ゴミ袋', 'consumable');
```

---

## データ整合性ルール

### 1. 週の開始日は月曜日
```sql
ALTER TABLE meal_plans
ADD CONSTRAINT check_week_start_is_monday
CHECK (EXTRACT(DOW FROM week_start_date) = 1);
```

### 2. 曜日は0〜6の範囲
```sql
ALTER TABLE meal_plan_items
ADD CONSTRAINT check_day_of_week_range
CHECK (day_of_week BETWEEN 0 AND 6);
```

### 3. 完了日時はステータスがcompletedの時のみ
```sql
ALTER TABLE shopping_lists
ADD CONSTRAINT check_completed_at_with_status
CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
);
```

---

## パフォーマンス最適化

### 1. パーティショニング（将来的に検討）
- `shopping_lists`を`week_start_date`でパーティション
- 履歴データが増えた場合に有効

### 2. インデックス戦略
- 頻繁に検索される`user_id`にインデックス
- `deleted_at IS NULL`の条件を含む複合インデックス
- `status`でのフィルタリング用インデックス

### 3. クエリ最適化
- N+1問題を避けるためのJOIN最適化
- 必要なカラムのみSELECT（SELECT *を避ける）

---

## バックアップ・リストア戦略

### バックアップ
- **頻度**: 毎日1回（深夜）
- **保持期間**: 7日間
- **方法**: Supabase自動バックアップ

### リストア
- **RTO**: 1時間以内
- **RPO**: 24時間以内

---

## マイグレーション戦略

### 旧データ移行
1. **旧システムからエクスポート**
   - Docker Localから既存データをCSV/JSON出力
2. **データクレンジング**
   - 不要なデータ削除
   - フォーマット統一
3. **新システムへインポート**
   - Supabaseへバッチインポート
   - データ整合性チェック

---

## セキュリティ

### Row Level Security (RLS)
```sql
-- ユーザーは自分のデータのみアクセス可能
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own dishes"
ON dishes
FOR ALL
USING (auth.uid() = user_id);

-- 同様のポリシーを全テーブルに適用
```

### 暗号化
- **通信**: TLS 1.3
- **保存**: Supabase標準暗号化（AES-256）

---

## 次のステップ

1. **API Spec作成** → `04_api/api_spec.md`
2. **マイグレーションファイル作成** → `migrations/`
3. **Seed Data作成** → `seeds/`

---

**作成者**: Claude + Tai  
**レビュー日**: 2026-05-09  
**ステータス**: ✅ Draft
