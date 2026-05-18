# Decision Log — Shopping Memo

**作成日**: 2026-05-09  
**プロジェクト**: Shopping Memo  
**目的**: 設計・実装における意思決定の記録

---

### DEC-011: Thống nhất thuật ngữ và Logic xóa
**日付**: 2026-05-14  
**決定者**: Tai + AI Assistant  
**ステータス**: ✅ Approved

#### 決定内容
1. **Thuật ngữ**: Thống nhất sử dụng `meals` (thay cho dishes) và `products` (thay cho miscellaneous) trên toàn bộ hệ thống (DB, API, Code, Docs).
2. **Logic xóa**: Sử dụng **Hard Delete** cho meals và products.
3. **Hình ảnh**: Giữ lại trường `image_url` cho bảng `products`.
4. **Lịch sử**: Phần History sẽ lưu dưới dạng **Report Text** (Snapshot), không liên kết trực tiếp với các bảng meals/products để tránh lỗi khi dữ liệu gốc bị xóa.
5. **Người dùng**: Thêm trường `display_name` vào thông tin người dùng.
6. **Nguyên liệu**: Sử dụng **JSONB** để lưu danh sách nguyên liệu của `meals`.

#### 理由
1. Đồng bộ hóa với dữ liệu hiện có và thói quen sử dụng của người dùng.
2. Hard Delete giúp dọn dẹp DB sạch sẽ, phù hợp với quy mô nhỏ của dự án.
3. JSONB giúp dữ liệu có cấu trúc, dễ dàng mở rộng tính năng tính toán định lượng sau này.
4. History dạng Snapshot đảm bảo tính toàn vẹn của dữ liệu lịch sử ngay cả khi món ăn hoặc sản phẩm đó đã bị xóa khỏi hệ thống.

#### 影響範囲
- Database: `meals`, `products`, `users`, `shopping_lists` (history part)
- API: Endpoints, Request/Response bodies
- Frontend: UI components, State management

---

## 決定事項一覧

### DEC-001: Tech Stack選定
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- 小規模プロジェクト（2ユーザー）
- 1週間でMVP完成が目標
- BrSE面接でのデモ用途

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **Next.js + FastAPI + Supabase** | - Next.js App Routerで最新技術<br>- FastAPI高速開発<br>- Supabase無料枠で十分 | - FastAPIとNext.jsの統合が必要 |
| Next.js + Supabase Functions | - フルスタックNext.js<br>- シンプル構成 | - FastAPI経験が積めない |
| Django + React | - 枯れた技術<br>- 安定性高い | - 開発速度遅い |

#### 決定内容
**Next.js + FastAPI + Supabase**を採用

#### 理由
1. Next.js App Routerで最新のReact開発経験
2. FastAPIでPython API開発スキル向上
3. Supabase無料枠で十分な機能（Auth, DB, Storage）
4. BrSE面接でフルスタック経験をアピール可能

#### 影響範囲
- Frontend: Next.js 14+ (App Router)
- Backend: FastAPI (Python 3.13)
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth
- Deployment: Vercel (Frontend), Railway/Vercel (Backend)

---

### DEC-002: 材料管理の正規化レベル
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- 料理の材料をどう管理するか
- 正規化すべきか、テキストで保存すべきか

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **テキスト（改行区切り）** | - シンプル実装<br>- 開発速度速い<br>- MVP向き | - 材料の重複排除が難しい<br>- 検索・集計が困難 |
| 正規化（ingredientsテーブル） | - 材料マスター管理<br>- 重複排除容易<br>- 検索・集計可能 | - 実装複雑<br>- 開発時間増加 |

#### 決定内容
**テキスト（改行区切り）**で保存

#### 理由
1. MVP範囲では材料マスター不要
2. 開発速度優先（1週間制約）
3. 将来的に正規化可能（マイグレーション可能）
4. 2ユーザーのみなので重複問題は小さい

#### 影響範囲
- `dishes.ingredients`: TEXT型（改行区切り）
- 買い物リスト生成時に材料を抽出・重複排除
- 将来的に`ingredients`テーブルへ正規化検討

#### 将来の改善案
- Phase 2で材料マスターテーブル追加
- 材料の単位管理（個、g、mlなど）
- 材料の在庫管理

---

### DEC-003: Soft Delete vs Hard Delete
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- 料理・雑貨削除時の挙動
- 履歴機能（Nice to Have）との関連

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **Soft Delete** | - データ復元可能<br>- 履歴機能で使用<br>- 誤削除対策 | - クエリが複雑化<br>- ストレージ増加 |
| Hard Delete | - シンプル実装<br>- ストレージ節約 | - データ復元不可<br>- 履歴機能困難 |

#### 決定内容
**Soft Delete**を採用

#### 理由
1. 履歴機能（Nice to Have）で過去の料理を表示
2. 誤削除時のデータ復元が可能
3. 2ユーザーのみなのでストレージ問題なし
4. `deleted_at IS NULL`でアクティブデータのみ取得

#### 影響範囲
- `dishes.deleted_at`: TIMESTAMP NULL
- `miscellaneous.deleted_at`: TIMESTAMP NULL
- 全クエリに`WHERE deleted_at IS NULL`追加
- インデックス: `(user_id, deleted_at)`

---

### DEC-004: 食事計画の週単位制約
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- 食事計画を週単位で管理するか、日単位で管理するか

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **週単位（月〜日）** | - 買い物リストが週単位<br>- 計画しやすい<br>- UI設計シンプル | - 柔軟性低い |
| 日単位（自由期間） | - 柔軟性高い<br>- 任意期間対応 | - UI複雑<br>- 買い物リスト生成複雑 |

#### 決定内容
**週単位（月〜日）**で管理

#### 理由
1. 買い物は週1回が一般的
2. 週の開始日を月曜日に固定（`week_start_date`）
3. UI設計がシンプル（7日分のカレンダー）
4. Unique制約で1週間1計画のみ

#### 影響範囲
- `meal_plans.week_start_date`: DATE型（月曜日のみ）
- Unique制約: `(user_id, week_start_date)`
- CHECK制約: `week_start_date`は月曜日のみ

---

### DEC-005: 買い物リストの材料重複排除ロジック
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- 複数の料理で同じ材料が使われる場合の処理

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **完全一致で重複排除** | - シンプル実装<br>- 誤判定少ない | - 「玉ねぎ」と「玉ねぎ（大）」が別扱い |
| 部分一致で重複排除 | - 柔軟な重複排除 | - 誤判定リスク高い |
| 重複排除しない | - 実装不要 | - リストが冗長 |

#### 決定内容
**完全一致で重複排除**

#### 理由
1. MVP範囲ではシンプル実装優先
2. ユーザーが材料名を統一すれば問題なし
3. 誤判定リスクを避ける
4. 将来的に材料マスターで解決

#### 影響範囲
- 買い物リスト生成時に`name`で完全一致チェック
- 重複する材料は1つにまとめる
- `source_id`は最初の料理IDを保持

#### 実装例
```python
def deduplicate_items(items):
    seen = {}
    result = []
    for item in items:
        if item['name'] not in seen:
            seen[item['name']] = True
            result.append(item)
    return result
```

---

### DEC-006: 認証方式（Supabase Auth）
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- 認証機能の実装方法

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **Supabase Auth** | - 実装不要<br>- JWT自動管理<br>- Email確認機能付き | - Supabase依存 |
| 自前実装（JWT） | - 完全制御可能<br>- 学習になる | - 開発時間増加<br>- セキュリティリスク |

#### 決定内容
**Supabase Auth**を採用

#### 理由
1. 開発時間短縮（1週間制約）
2. セキュリティベストプラクティス適用済み
3. Email確認、パスワードリセット機能付き
4. JWT自動管理

#### 影響範囲
- Frontend: Supabase JS Client使用
- Backend: Supabase JWT検証
- RLS（Row Level Security）でデータアクセス制御

---

### DEC-007: API設計（RESTful）
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- API設計方針（REST vs GraphQL）

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **RESTful API** | - シンプル<br>- 標準的<br>- キャッシュ容易 | - Over-fetching/Under-fetching |
| GraphQL | - 柔軟なクエリ<br>- 1エンドポイント | - 学習コスト高い<br>- 開発時間増加 |

#### 決定内容
**RESTful API**を採用

#### 理由
1. シンプルで標準的
2. FastAPIのRESTサポートが充実
3. 小規模プロジェクトではRESTで十分
4. BrSE面接でREST設計経験をアピール

#### 影響範囲
- エンドポイント設計: `/api/v1/{resource}`
- HTTPメソッド: GET/POST/PUT/PATCH/DELETE
- レスポンス形式: JSON

---

### DEC-008: フロントエンドState管理
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: 🟡 Pending

#### 背景
- グローバルState管理の方法

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| React Context | - 標準機能<br>- 追加ライブラリ不要 | - パフォーマンス問題（大規模時） |
| Zustand | - 軽量<br>- シンプルAPI<br>- パフォーマンス良好 | - 追加ライブラリ |
| Redux Toolkit | - 強力<br>- DevTools充実 | - 学習コスト高い<br>- Boilerplate多い |

#### 決定内容
**未決定（実装時に判断）**

#### 理由
1. MVP範囲ではStateが少ない
2. まずReact Contextで実装
3. パフォーマンス問題が出たらZustand検討

#### 次のアクション
- 実装開始後、State管理の複雑さを評価
- 必要に応じてZustand導入

---

### DEC-009: デプロイ戦略
**日付**: 2026-05-09  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- Frontend/Backendのデプロイ先

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **Vercel (Frontend) + Railway (Backend)** | - 無料枠十分<br>- CI/CD自動<br>- 簡単デプロイ | - 2つのサービス管理 |
| Vercel (Frontend + Backend) | - 1つのサービス<br>- Serverless Functions | - FastAPI制約あり |
| AWS (EC2) | - 完全制御可能 | - 管理コスト高い<br>- 無料枠制限 |

#### 決定内容
**Vercel (Frontend) + Railway (Backend)**

#### 理由
1. Vercel: Next.js最適化、無料枠十分
2. Railway: FastAPI対応、無料枠あり、簡単デプロイ
3. CI/CD自動化（GitHub連携）
4. 小規模プロジェクトに最適

#### 影響範囲
- Frontend: Vercel自動デプロイ（main branch）
- Backend: Railway自動デプロイ（main branch）
- Database: Supabase（無料枠）

---

### DEC-010: 既存Supabaseテーブル名の保持
**日付**: 2026-05-10  
**決定者**: Tai + Claude  
**ステータス**: ✅ Approved

#### 背景
- 既存Supabaseに `meals`, `products`, `weekly_plans`, `weekly_checklist_items` が存在
- 新設計では `dishes`, `miscellaneous` という名前を使用予定
- 既存データ（特に画像）を保持したい

#### 選択肢
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **既存テーブル名保持（meals, products）** | - データ移行不要<br>- 画像URL保持<br>- カラム追加のみ | - 新設計と名前が異なる |
| 新テーブル名採用（dishes, miscellaneous） | - 新設計に統一<br>- クリーンスタート | - データ移行必要<br>- 画像URL再アップロード |

#### 決定内容
**既存テーブル名（meals, products）を保持**

#### 理由
1. 既存データ（特に画像）を保持
2. データ移行の手間を削減
3. カラム追加のみで対応可能
4. API名を既存テーブル名に合わせる

#### 影響範囲
- **テーブル名**: `dishes` → `meals`, `miscellaneous` → `products`
- **API**: `/api/v1/dishes` → `/api/v1/meals`, `/api/v1/miscellaneous` → `/api/v1/products`
- **Schema変更**:
  - `meals`: `user_id`, `category`, `deleted_at` 追加
  - `products`: `user_id`, `category`, `deleted_at` 追加、`image_url` 保持
  - `meals.ingredients`: JSONB保持（Backend で TEXT ↔ JSONB 変換）
- **削除**: `weekly_plans`, `weekly_checklist_items` → 新設計で再構築

#### 技術的決定
- `meals.ingredients` は JSONB のまま保持
- Backend (FastAPI) で JSONB ↔ TEXT 変換を実装
- Frontend は改行区切りテキストで扱う

#### Migration Steps
1. `weekly_plans`, `weekly_checklist_items` 削除
2. `meals`, `products` にカラム追加（`user_id`, `category`, `deleted_at`）
3. 新規テーブル作成（`meal_plans`, `meal_plan_items`, `shopping_lists`, `shopping_items`）
4. RLS (Row Level Security) 設定

---

### DEC-012: Bỏ hoàn toàn meal_type và giới hạn 3 món/ngày
**日付**: 2026-05-17  
**決定者**: Tai + AI Assistant  
**ステータス**: ✅ Approved

#### 決定内容
1. Xóa cột `meal_type` khỏi bảng `meal_plan_items`.
2. Không phân biệt loại bữa ăn (Sáng/Trưa/Tối).
3. Áp dụng quy tắc tối đa 3 món mỗi ngày trong tuần.

#### 理由
1. Đơn giản hóa quá trình lập kế hoạch.
2. Người dùng chỉ quan tâm đến việc ăn gì trong ngày, không nhất thiết phải phân loại bữa ăn cụ thể.
3. Giới hạn 3 món giúp bố cục UI gọn gàng và phù hợp với thực tế sử dụng.

#### 影響範囲
- Database: `meal_plan_items`
- Frontend: `MealPlanPage` logic và UI card ngày.
- API: Payload lưu meal plan.

---

### DEC-013: Thay đổi cơ chế Generate Shopping List
**日付**: 2026-05-17  
**決定者**: Tai + AI Assistant  
**ステータス**: ✅ Approved

#### 決定内容
1. **Chỉ generate khi nhấn nút**: Không tự động tạo danh sách mua sắm khi lưu Meal Plan.
2. **Cơ chế Replace**: Khi nhấn nút "Generate Shopping List", hệ thống sẽ xóa danh sách mua sắm cũ của tuần đó và tạo mới hoàn toàn.
3. **Chi tiết nguyên liệu**: Mỗi nguyên liệu từ `meals.ingredients` sẽ tạo thành 1 bản ghi riêng trong `shopping_items`.
4. **Thêm cột note**: Lưu trữ thông tin `"Dùng cho món [Tên món]"` để người dùng dễ theo dõi nguồn gốc nguyên liệu.

#### 理由
1. Tránh việc danh sách mua sắm bị cập nhật liên tục ngoài ý muốn khi người dùng đang điều chỉnh Meal Plan.
2. Việc tạo bản ghi riêng cho từng nguyên liệu giúp người dùng biết chính xác nguyên liệu đó dùng cho món nào, thay vì gộp chung (Deduplication) như trước.

#### 影響範囲
- Database: Thêm cột `note` vào `shopping_items`.
- API: Endpoint `/shopping-lists/generate`.
- Frontend: Nút "Generate Shopping List" trên trang Meal Plan.

---

### DEC-014: Hiển thị Ingredients Realtime trên Meal Plan
**日付**: 2026-05-17  
**決定者**: Tai + AI Assistant  
**ステータス**: ✅ Approved

#### 決定内容
1. Hiển thị danh sách nguyên liệu ngay bên dưới tên món ăn trên các card ngày trong tuần.
2. Cập nhật realtime ngay khi người dùng chọn món trong modal, không cần đợi nhấn Save.

#### 理由
1. Giúp người dùng có cái nhìn tổng quan về các nguyên liệu cần thiết ngay khi đang lập kế hoạch.
2. Tăng trải nghiệm người dùng, làm giao diện sống động và trực quan hơn.

#### 影響範囲
- Frontend: `MealPlanPage` (Day Card component).

---

## 未決定事項

### PENDING-001: UI Component Library
**日付**: 2026-05-09  
**ステータス**: 🟡 Pending

#### 選択肢
- shadcn/ui（推奨）
- Material-UI
- Chakra UI
- 自前実装

#### 次のアクション
- 実装開始時に決定
- shadcn/uiを優先検討（TailwindCSS統合）

---

### PENDING-002: テスト戦略
**日付**: 2026-05-09  
**ステータス**: 🟡 Pending

#### 選択肢
- Unit Test: pytest (Backend), Jest (Frontend)
- E2E Test: Playwright
- Integration Test: Supertest

#### 次のアクション
- MVP完成後にテスト追加
- 優先度: Backend Unit Test > Frontend Unit Test > E2E Test

---

## 変更履歴

| 日付 | 決定ID | 変更内容 | 理由 |
|------|--------|---------|------|
| 2026-05-09 | DEC-001 | Tech Stack決定 | 初期設計 |
| 2026-05-09 | DEC-002 | 材料管理方針決定 | MVP優先 |
| 2026-05-09 | DEC-003 | Soft Delete採用 | 履歴機能対応 |
| 2026-05-09 | DEC-004 | 週単位制約決定 | UI設計シンプル化 |
| 2026-05-09 | DEC-005 | 重複排除ロジック決定 | シンプル実装優先 |
| 2026-05-09 | DEC-006 | Supabase Auth採用 | 開発時間短縮 |
| 2026-05-09 | DEC-007 | RESTful API採用 | 標準的設計 |
| 2026-05-09 | DEC-009 | デプロイ戦略決定 | 無料枠活用 |
| 2026-05-10 | DEC-010 | 既存テーブル名保持 | データ保持・移行削減 |

---

## 次のステップ

1. **Project Structure作成** → `README.md`, `package.json`, `requirements.txt`
2. **Database Migration作成** → `migrations/`
3. **Backend実装開始** → FastAPI setup
4. **Frontend実装開始** → Next.js setup

---

**作成者**: Claude + Tai  
**最終更新**: 2026-05-09  
**ステータス**: ✅ Active
