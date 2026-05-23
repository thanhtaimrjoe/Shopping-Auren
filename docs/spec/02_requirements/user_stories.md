# User Stories — Shopping Memo

**作成日**: 2026-05-09  
**プロジェクト**: Shopping Memo  
**目的**: ユーザーストーリーと受け入れ基準の定義

---

## ユーザーペルソナ

### ペルソナ1: Tai（メインユーザー）
- **役割**: 買い物計画者
- **目的**: 週の食事を計画し、効率的に買い物をする
- **技術レベル**: 中級（開発者）
- **利用頻度**: 週1回（週末に計画、週中に買い物）

### ペルソナ2: 彼女（サブユーザー）
- **役割**: 買い物実行者
- **目的**: 計画されたリストを見ながら買い物をする
- **技術レベル**: 初級（一般ユーザー）
- **利用頻度**: 週1〜2回（買い物時）

---

## Epic 1: 認証・ユーザー管理

### US-001: ユーザー登録
**As a** 新規ユーザー  
**I want to** アカウントを作成する  
**So that** アプリを使い始められる

#### 受け入れ基準
- [ ] メールアドレスとパスワードで登録できる
- [ ] Tên hiển thị (display_name) có thể nhập vào
- [ ] パスワードは8文字以上必須
- [ ] 登録後、確認メールが送信される
- [ ] 確認後、ログインできる

#### 技術要件
- Supabase Auth使用
- Email confirmation必須

---

### US-002: ログイン
**As a** 登録済みユーザー  
**I want to** ログインする  
**So that** 自分のデータにアクセスできる

#### 受け入れ基準
- [ ] メールアドレスとパスワードでログインできる
- [ ] Hiển thị display_name sau khi đăng nhập
- [ ] ログイン状態が保持される（7日間）
- [ ] ログイン失敗時、エラーメッセージが表示される
- [ ] パスワードリセット機能がある

---

## Epic 2: 料理管理 (Meals)

### US-003: 料理を登録する
**As a** ユーザー  
**I want to** 新しい料理 (Meal) を登録する  
**So that** 食事計画で使える

#### 受け入れ基準
- [ ] 料理名を入力できる（必須、最大100文字）
- [ ] 材料リストを入力できる（複数行, JSONB mảng chuỗi）
- [ ] カテゴリを選択できる（和食/洋食/中華/その他）
- [ ] 登録後、料理リストに表示される

#### 技術要件
- POST `/api/v1/meals`

---

### US-004: 料理を編集する
**As a** ユーザー  
**I want to** 登録済みの料理を編集する  
**So that** 情報を最新に保てる

#### 受け入れ基準
- [ ] 料理名を変更できる
- [ ] 材料リストを変更できる
- [ ] カテゴリを変更できる
- [ ] 保存後、変更が反映される

#### 技術要件
- PUT `/api/v1/meals/{meal_id}`

---

### US-005: 料理を削除する
**As a** ユーザー  
**I want to** 不要な料理を削除する  
**So that** リストを整理できる

#### 受け入れ基準
- [ ] 削除確認ダイアログが表示される
- [ ] 確認後、料理が hoàn toàn bị xóa khỏi DB (Hard Delete)
- [ ] 削除後、リストから消える

#### 技術要件
- DELETE `/api/v1/meals/{meal_id}`

---

### US-006: 料理リストを表示する
**As a** ユーザー  
**I want to** 登録済みの料理リストを見る  
**So that** どんな料理があるか確認できる

#### 受け入れ基準
- [ ] 料理リストが一覧表示される
- [ ] カテゴリでフィルタできる
- [ ] 料理名で検索できる
- [ ] 登録日順・名前順でソートできる

#### 技術要件
- GET `/api/v1/meals`

---

## Epic 3: 雑貨管理 (Products)

### US-007: 雑貨を登録する
**As a** ユーザー  
**I want to** 日用品 (Product) を登録する  
**So that** 買い物リストに追加できる

#### 受け入れ基準
- [ ] 雑貨名を入力できる（必須、最大100文字）
- [ ] Có thể lưu image_url cho sản phẩm
- [ ] カテゴリを選択できる（日用品/消耗品/その他）
- [ ] 登録後、雑貨リストに表示される

#### 技術要件
- POST `/api/v1/products`

---

### US-008: 雑貨を編集・削除する
**As a** ユーザー  
**I want to** 雑貨を編集・削除する  
**So that** リストを管理できる

#### 受け入れ基準
- [ ] 雑貨名を変更できる
- [ ] image_url を変更できる
- [ ] カテゴリを変更できる
- [ ] 削除確認後、hoàn toàn bị xóa khỏi DB (Hard Delete)

#### 技術要件
- PUT `/api/v1/products/{product_id}`
- DELETE `/api/v1/products/{product_id}`

---

## Epic 4: 食事計画

### US-009: 来週の食事を計画する
**As a** ユーザー  
**I want to** 来週（月〜日）の食事を計画する  
**So that** 買い物リストを作れる

#### 受け入れ基準
- [ ] 月〜日の7日分スロットが表示される（カレンダー日付・週切り替えは不要）
- [ ] 各日に料理を最大3件まで割り当てられる
- [ ] 登録済み料理から選択できる
- [ ] 保存後、計画が確定する

#### 技術要件
- GET `/api/v1/meal-plans/current`（ユーザーの最新計画1件）
- POST `/api/v1/meal-plans` — Request body: `{ meals: [{ day_of_week, meal_id }] }`

---

### US-010: 食事計画を編集する
**As a** ユーザー  
**I want to** 計画した食事を変更する  
**So that** 柔軟に対応できる

#### 受け入れ基準
- [ ] 計画済みの食事を変更できる
- [ ] 料理を削除できる
- [ ] 料理を追加できる
- [ ] 保存後、買い物リストが更新される

#### 技術要件
- PUT `/api/v1/meal-plans/{plan_id}`

---

## Epic 5: 買い物リスト

### US-011: Tạo danh sách mua sắm thủ công (Generate)
**As a** ユーザー  
**I want to** Nhấn nút để tạo danh sách mua sắm từ Meal Plan  
**So that** Kiểm soát được thời điểm tạo danh sách và biết rõ nguyên liệu dùng cho món nào

#### 受け入れ基準
- [ ] Có nút "Generate Shopping List" trên trang Meal Plan.
- [ ] Khi nhấn nút, hệ thống xóa danh sách cũ (nếu có) và tạo danh sách mới hoàn toàn.
- [ ] Mỗi nguyên liệu từ các món ăn trong kế hoạch sẽ trở thành một dòng riêng biệt trong danh sách.
- [ ] Mỗi dòng nguyên liệu có ghi chú "Dùng cho món [Tên món]".
- [ ] Danh sách bao gồm cả các sản phẩm mua thêm (Products) đã chọn.
- [ ] Hiển thị thông báo sau khi tạo thành công.

#### 技術要件
- POST `/api/v1/shopping-lists/generate`
- Logic: Delete existing list for the week -> Create new list -> Map each ingredient to a separate shopping item with notes.

---

### US-012: 買い物リストにチェックを入れる
**As a** ユーザー  
**I want to** 買い物中にアイテムをチェックする  
**So that** 買い忘れを防げる

#### 受け入れ基準
- [ ] アイテムをタップしてチェックできる
- [ ] チェック済みアイテムは視覚的に区別される
- [ ] チェック状態がリアルタイムで保存される
- [ ] 全てチェックしたら完了通知が出る
- [ ] 食材行の下に `note`（`Dùng cho món …`）が表示される（meal 由来アイテム）

#### 技術要件
- PATCH `/api/v1/shopping-lists/{list_id}/items/{item_id}`
- Request body: `{ checked: true }`

---

### US-013: 買い物リストに手動でアイテムを追加する
**As a** ユーザー  
**I want to** リストに追加のアイテムを入れる  
**So that** 計画外のものも買える

#### 受け入れ基準
- [ ] アイテム名を入力して追加できる
- [ ] カテゴリを選択できる
- [ ] 追加後、リストに表示される

#### 技術要件
- POST `/api/v1/shopping-lists/{list_id}/items`

---

## Epic 6: 履歴確認（Nice to Have）

### US-014: 過去の買い物履歴を見る
**As a** ユーザー  
**I want to** 過去2週間の買い物履歴を見る  
**So that** 何を買ったか確認できる

#### 受け入れ基準
- [ ] 完了した買い物リストが履歴に表示される
- [ ] 各履歴には「買い物完了」時に入力した週の開始日〜終了日（from-to）が表示される
- [ ] 各リストの詳細を見られる
- [ ] チェック済み/未チェックが分かる

#### 技術要件
- `POST /api/v1/shopping-lists/{list_id}/complete` — body: `{ week_from_date, week_to_date }`
- GET `/api/v1/shopping-lists/history?weeks=2`

---

## Epic 7: 料理提案（廃止）

> **2026-05-24**: US-015（料理提案 / meal suggestions）はスコープ外となり実装・APIともに削除。食事計画は手動で料理を選ぶ。

### US-015: 料理を提案してもらう — **Obsolete / 不実装**
**ステータス**: 廃止（要件から除外）

---

## 優先順位マトリクス

| Epic | Priority | MVP | Effort |
|------|----------|-----|--------|
| Epic 1: 認証 | 🔴 High | ✅ Yes | Medium |
| Epic 2: 料理管理 | 🔴 High | ✅ Yes | Medium |
| Epic 3: 雑貨管理 | 🔴 High | ✅ Yes | Low |
| Epic 4: 食事計画 | 🔴 High | ✅ Yes | High |
| Epic 5: 買い物リスト | 🔴 High | ✅ Yes | High |
| Epic 6: 履歴確認 | 🟡 Medium | ❌ No | Medium |
| Epic 7: 料理提案 | — | ❌ 廃止 | — |

---

## 次のステップ

1. **Screen List作成** → `03_design/screen_list.md`
2. **Database Schema設計** → `03_design/database_schema.md`
3. **API Spec作成** → `04_api/api_spec.md`

---

**作成者**: Claude + Tai  
**レビュー日**: 2026-05-09  
**ステータス**: ✅ Draft
