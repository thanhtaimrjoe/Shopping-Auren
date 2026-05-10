# Project Setup Summary — Shopping Memo

**日付**: 2026-05-09  
**作成者**: Claude (PM) + Tai (BrSE)  
**ステータス**: ✅ 完了

---

## 🎉 完了した作業

### 1. プロジェクト仕様書作成（100%完了）

#### ✅ Inception Deck
- 5つの質問に回答
- Tech Stack決定
- スコープ定義
- リスク洗い出し
- タイムライン設定（MVP: 1週間）

#### ✅ User Stories
- 7 Epics定義
- 15 User Stories作成
- 受け入れ基準定義
- 優先順位マトリクス

#### ✅ Screen List
- 12画面定義
- URL・機能・遷移定義
- Main Layout設計（Sidebar + Header + Content）
- デフォルトページ: `/meal-plan`
- レスポンシブ対応方針

#### ✅ Database Schema
- 7テーブル設計
- ER図作成
- インデックス戦略
- RLS設計

#### ✅ API Specification
- 6カテゴリ、30+エンドポイント定義
- Request/Response定義
- エラーハンドリング
- レート制限

#### ✅ Decision Log
- 10個の設計決定記録
- 2個の未決定事項
- 変更履歴管理

#### ✅ Progress Tracking
- 開発ロードマップ
- タスク分解
- 進捗管理

---

### 2. AI開発者向けガイドライン作成

#### ✅ CLAUDE.md
- プロジェクト概要
- 開発ワークフロー
- **Changelog記録ルール（必須）**
- セキュリティガイドライン
- コードスタイル
- やってはいけないこと

#### ✅ CHANGELOG.md
- 変更履歴フォーマット
- 記録例
- 初回エントリ（Project Setup）

---

### 3. 既存データベース分析・移行計画

#### ✅ Migration Analysis
- 既存Schema分析（meals, products, weekly_plans, weekly_checklist_items）
- 新Schema比較
- 互換性チェック

#### ✅ Migration Plan
- **決定**: `meals`, `products` テーブル名保持
- **決定**: `image_url` 保持
- **決定**: `weekly_plans`, `weekly_checklist_items` 削除
- Migration Steps定義
- API名調整（`/api/v1/meals`, `/api/v1/products`）

---

## 📁 作成されたファイル

```
Shopping-Auren/
├── CLAUDE.md                          # AI開発者向けガイドライン
├── README.md                          # プロジェクト概要
└── docs/
    ├── changelog/
    │   └── CHANGELOG.md              # 開発変更履歴
    └── spec/
        ├── 01_inception/
        │   └── inception_deck.md     # Inception Deck
        ├── 02_requirements/
        │   └── user_stories.md       # User Stories
        ├── 03_design/
        │   ├── database_schema.md    # Database Schema
        │   ├── screen_list.md        # Screen List
        │   ├── migration_analysis.md # Migration分析
        │   └── migration_plan.md     # Migration計画
        ├── 04_api/
        │   └── api_spec.md           # API Specification
        └── 05_tracking/
            ├── decisions.md          # Decision Log
            └── progress.md           # Progress Tracking
```

**合計**: 12ファイル作成

---

## 🎯 Tech Stack（確定）

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui（検討中）
- **State Management**: React Context / Zustand（検討中）

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: PostgreSQL (Supabase)
- **ORM**: SQLAlchemy
- **Authentication**: Supabase Auth

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Supabase (Free Tier)

---

## 📊 Database設計（最終版）

### 既存テーブル（保持・拡張）
1. **meals** (既存)
   - 追加: `user_id`, `category`, `deleted_at`
   - 保持: `ingredients` (JSONB)

2. **products** (既存)
   - 追加: `user_id`, `category`, `deleted_at`
   - 保持: `image_url`

### 新規テーブル
3. **meal_plans** (新規)
4. **meal_plan_items** (新規)
5. **shopping_lists** (新規)
6. **shopping_items** (新規)

### 削除テーブル
- ❌ `weekly_plans`
- ❌ `weekly_checklist_items`

---

## 🔄 API設計（最終版）

### 認証
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/reset-password`

### Meals（料理）
- `GET /api/v1/meals`
- `GET /api/v1/meals/{id}`
- `POST /api/v1/meals`
- `PUT /api/v1/meals/{id}`
- `DELETE /api/v1/meals/{id}`

### Products（雑貨）
- `GET /api/v1/products`
- `GET /api/v1/products/{id}`
- `POST /api/v1/products`
- `PUT /api/v1/products/{id}`
- `DELETE /api/v1/products/{id}`

### Meal Plans（食事計画）
- `GET /api/v1/meal-plans/current`
- `POST /api/v1/meal-plans`
- `PUT /api/v1/meal-plans/{id}`
- `DELETE /api/v1/meal-plans/{id}`

### Shopping Lists（買い物リスト）
- `POST /api/v1/shopping-lists/generate`
- `GET /api/v1/shopping-lists/current`
- `PATCH /api/v1/shopping-lists/{list_id}/items/{item_id}`
- `POST /api/v1/shopping-lists/{list_id}/items`
- `POST /api/v1/shopping-lists/{list_id}/complete`
- `GET /api/v1/shopping-lists/history` (Nice to Have)

---

## 🎨 UI/UX設計

### Layout
- **Sidebar**: 左側固定メニュー
- **Header**: ページタイトル表示
- **Content**: メインコンテンツエリア
- **Footer**: なし

### Default Page
- ログイン後: `/meal-plan`

### Navigation
- Sidebar Menu:
  1. 食事計画 (Meal Plan)
  2. 料理 (Meals)
  3. 雑貨 (Products)
  4. 買い物リスト (Shopping List)
  5. 履歴 (History) - Nice to Have

---

## 📝 重要な設計決定

### DEC-001: Tech Stack
- Next.js + FastAPI + Supabase

### DEC-002: 材料管理
- JSONB保持（Backend で TEXT ↔ JSONB 変換）

### DEC-003: Soft Delete
- 全テーブルに `deleted_at` 追加

### DEC-004: 週単位制約
- 月曜日開始、1週間1計画

### DEC-010: 既存テーブル名保持
- `meals`, `products` 保持
- `image_url` 保持
- `weekly_plans`, `weekly_checklist_items` 削除

---

## 📅 開発スケジュール

### Week 1: MVP開発（2026-05-09 〜 2026-05-16）
| 日 | タスク | ステータス |
|----|--------|-----------|
| Day 1-2 | 要件定義・設計 | ✅ 完了 |
| Day 3-4 | Backend API開発 | 🟡 予定 |
| Day 5-6 | Frontend開発 | 🟡 予定 |
| Day 7 | 統合テスト | 🟡 予定 |

### Week 2: リリース準備（2026-05-17 〜 2026-05-20）
| 日 | タスク | ステータス |
|----|--------|-----------|
| Day 1-2 | バグ修正 | 🟡 予定 |
| Day 3 | デプロイ | 🟡 予定 |
| Day 4 | 本番確認 | 🟡 予定 |

---

## 🚀 Next Steps

### 1. Database Migration（優先度: 高）
- [ ] デフォルトユーザー作成（Supabase Auth）
- [ ] Migration Script作成
  - [ ] `001_add_user_columns.sql`
  - [ ] `002_drop_old_tables.sql`
  - [ ] `003_create_new_tables.sql`
  - [ ] `004_setup_rls.sql`
- [ ] Migration実行
- [ ] データ検証

### 2. Backend Setup（優先度: 高）
- [ ] FastAPI project structure作成
- [ ] Supabase接続設定
- [ ] 環境変数設定（`.env`）
- [ ] SQLAlchemy models作成
- [ ] Pydantic schemas作成

### 3. Backend API実装（優先度: 高）
- [ ] 認証API（Supabase Auth統合）
- [ ] Meals API（JSONB ↔ TEXT 変換）
- [ ] Products API（image_url対応）
- [ ] Meal Plans API
- [ ] Shopping Lists API

### 4. Frontend Setup（優先度: 中）
- [ ] Next.js project作成
- [ ] TailwindCSS setup
- [ ] Supabase Client setup
- [ ] Layout作成（Sidebar + Header）

### 5. Frontend実装（優先度: 中）
- [ ] 認証画面（Login, Register）
- [ ] Meal Plan画面
- [ ] Meals管理画面
- [ ] Products管理画面
- [ ] Shopping List画面

### 6. テスト（優先度: 低）
- [ ] Backend Unit Test
- [ ] Frontend Component Test
- [ ] E2E Test

---

## 📚 ドキュメント完成度

| ドキュメント | 完成度 | 備考 |
|-------------|--------|------|
| Inception Deck | 100% | ✅ 完了 |
| User Stories | 100% | ✅ 完了 |
| Screen List | 100% | ✅ 完了 |
| Database Schema | 100% | ✅ 完了 |
| API Spec | 100% | ✅ 完了 |
| Decision Log | 100% | ✅ 完了 |
| Migration Plan | 100% | ✅ 完了 |
| CLAUDE.md | 100% | ✅ 完了 |
| CHANGELOG.md | 100% | ✅ 完了 |

**全体**: 100% 完了

---

## 🎓 AI開発者へのメッセージ

このプロジェクトで開発を始める場合：

1. **必ず `CLAUDE.md` を読んでください**
   - プロジェクト概要
   - 開発ルール
   - Changelog記録方法

2. **Spec を確認してください**
   - User Stories: 何を作るか
   - API Spec: どう実装するか
   - Database Schema: データ構造

3. **Changelog に必ず記録してください**
   - コード実装 → 記録
   - バグ修正 → 記録
   - リファクタリング → 記録

4. **質問があれば**
   - PM (Claude) または BrSE (Tai) に相談

---

## 🎉 成果

### 定量的成果
- ✅ 12ファイル作成
- ✅ 7 Epics定義
- ✅ 15 User Stories作成
- ✅ 12画面設計
- ✅ 7テーブル設計
- ✅ 30+エンドポイント定義
- ✅ 10設計決定記録

### 定性的成果
- ✅ プロジェクトスコープ明確化
- ✅ Tech Stack確定
- ✅ 既存データ保持方針決定
- ✅ AI開発者向けガイドライン整備
- ✅ Changelog管理体制構築

---

## 💬 コメント

### PM (Claude) より
プロジェクト仕様書の作成が完了しました。BrSE面接でのデモに向けて、しっかりとした設計ができたと思います。特に既存データを保持しながら新設計に移行する方針は、実務的で良い判断だと思います。

次のステップは Database Migration と Backend Setup です。頑張りましょう！

### BrSE (Tai) より
（コメント追加可能）

---

**作成日**: 2026-05-09  
**最終更新**: 2026-05-09 17:31  
**ステータス**: ✅ Phase 1 完了
