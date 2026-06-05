# Screen List — Shopping Memo

**作成日**: 2026-05-09  
**プロジェクト**: Shopping Memo  
**目的**: 画面一覧とURL・機能の定義

---

## 画面構成図

```
┌─────────────────────────────────────┐
│         Authentication              │
│  - Login                            │
│  - Register                         │
│  - Password Reset                   │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Main Layout (Default: Meal Plan)        │
│  ┌──────────┬──────────────────────────────┐   │
│  │ Sidebar  │  Header (Page Title)         │   │
│  │  Menu    │  ─────────────────────────   │   │
│  │          │  Content Area                │   │
│  │          │                              │   │
│  └──────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────┘
         │
         ├─ Sidebar Navigation ─┐
         │                      │
    ┌────┴────┬────────┬───────┴──┬────────────┐
    ▼         ▼        ▼          ▼            ▼
┌─────────┐ ┌────┐ ┌──────┐ ┌─────────┐ ┌─────────┐
│Meal Plan│ │Meal│ │Product│ │Shopping │ │ History │
│(Default)│ │List│ │ List │ │  List   │ │         │
└─────────┘ └────┘ └──────┘ └─────────┘ └─────────┘
                │       │
                ▼       ▼
           ┌────────┐ ┌──────┐
           │ Detail │ │Modal │
           │  Form  │ │      │
           └────────┘ └──────┘
```

**レイアウト構成**:
- **Sidebar**: 左側固定、メニューナビゲーション
- **Header**: ページタイトル表示（例: "食事計画", "料理一覧"）
- **Content Area**: メインコンテンツ表示エリア
- **Default Page**: ログイン後は `/meal-plan` が表示される

---

## 画面一覧

### 1. 認証系画面

#### SC-001: ログイン画面
| 項目 | 内容 |
|------|------|
| **URL** | `/login` |
| **目的** | ユーザー認証 |
| **アクセス権限** | 未認証ユーザー |
| **主要機能** | - メールアドレス入力<br>- パスワード入力<br>- ログインボタン<br>- パスワードリセットリンク<br>- 新規登録リンク |
| **遷移先** | - 成功: `/meal-plan` (デフォルトページ)<br>- 失敗: エラー表示 |
| **API** | POST `/api/v1/auth/login` |

#### SC-002: 新規登録画面
| 項目 | 内容 |
|------|------|
| **URL** | `/register` |
| **目的** | 新規アカウント作成 |
| **アクセス権限** | 未認証ユーザー |
| **主要機能** | - Tên hiển thị (display_name)<br>- メールアドレス入力<br>- パスワード入力（確認含む）<br>- 登録ボタン<br>- ログインリンク |
| **遷移先** | - 成功: `/login` (確認メール送信通知)<br>- 失敗: エラー表示 |
| **API** | POST `/api/v1/auth/register` |

#### SC-003: パスワードリセット画面
| 項目 | 内容 |
|------|------|
| **URL** | `/reset-password` |
| **目的** | パスワード再設定 |
| **アクセス権限** | 未認証ユーザー |
| **主要機能** | - メールアドレス入力<br>- リセットメール送信ボタン |
| **遷移先** | - 成功: `/login` (メール送信通知)<br>- 失敗: エラー表示 |
| **API** | POST `/api/v1/auth/reset-password` |

---

### 2. メインレイアウト

#### SC-004: メインレイアウト
| 項目 | 内容 |
|------|------|
| **URL** | `/` (ログイン後のデフォルト) |
| **目的** | アプリケーションのメインレイアウト |
| **アクセス権限** | 認証済みユーザー |
| **構成要素** | - **Sidebar**: 左側固定メニュー（食事計画/料理/雑貨/買い物リスト/履歴）<br>- **Header**: ページタイトル表示<br>- **Content Area**: 各ページのコンテンツ表示 |
| **デフォルト表示** | `/meal-plan` (食事計画画面) |
| **備考** | - Footerなし<br>- Headerはナビゲーションではなくページタイトルのみ<br>- Sidebarで画面切り替え |

---

### 3. 料理管理 (Meals)

#### SC-005: 料理一覧画面
| 項目 | 内容 |
|------|------|
| **URL** | `/meals` |
| **目的** | 登録済み料理の一覧表示 |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - 料理リスト表示（カード形式）<br>- カテゴリフィルタ（和食/洋食/中華/その他）<br>- 検索バー（料理名）<br>- ソート（登録日/名前）<br>- 新規登録ボタン |
| **遷移先** | - 詳細: `/meals/{meal_id}`<br>- 新規: `/meals/new` |
| **API** | GET `/api/v1/meals` |

#### SC-006: 料理詳細画面
| 項目 | 内容 |
|------|------|
| **URL** | `/meals/{meal_id}` |
| **目的** | 料理の詳細表示・編集 |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - 料理名表示<br>- 材料リスト表示<br>- カテゴリ表示<br>- 編集ボタン<br>- 削除ボタン (Hard Delete) |
| **遷移先** | - 編集: `/meals/{meal_id}/edit`<br>- 削除: 確認ダイアログ → `/meals` |
| **API** | GET `/api/v1/meals/{meal_id}` |

#### SC-007: 料理登録・編集画面
| 項目 | 内容 |
|------|------|
| **URL** | `/meals/new` または `/meals/{meal_id}/edit` |
| **目的** | 料理の新規登録・編集 |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - 料理名入力（必須）<br>- 材料リスト入力（複数行テキストエリア, JSONB mảng chuỗi）<br>- カテゴリ選択<br>- 保存ボタン<br>- キャンセルボタン |
| **遷移先** | - 保存成功: `/meals/{meal_id}`<br>- キャンセル: 前の画面 |
| **API** | POST `/api/v1/meals` (新規)<br>PUT `/api/v1/meals/{meal_id}` (編集) |

---

### 4. 雑貨管理 (Products)

#### SC-008: 雑貨一覧画面
| 項目 | 内容 |
|------|------|
| **URL** | `/products` |
| **目的** | 登録済み雑貨の一覧表示 |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - 雑貨リスト表示（リスト形式）<br>- カテゴリフィルタ（日用品/消耗品/その他）<br>- 検索バー<br>- 新規登録ボタン<br>- インライン編集・削除 (Hard Delete) |
| **遷移先** | - 新規: モーダル表示 |
| **API** | GET `/api/v1/products` |

#### SC-009: 雑貨登録・編集モーダル
| 項目 | 内容 |
|------|------|
| **URL** | モーダル（URL変更なし） |
| **目的** | 雑貨の新規登録・編集 |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - 雑貨名入力（必須）<br>- image_url 入力<br>- カテゴリ選択<br>- 保存ボタン<br>- キャンセルボタン |
| **遷移先** | - 保存成功: モーダル閉じる → リスト更新<br>- キャンセル: モーダル閉じる |
| **API** | POST `/api/v1/products` (新規)<br>PUT `/api/v1/products/{product_id}` (編集) |

---

### 5. 食事計画

#### SC-010: 食事計画画面 (Weekly Alignment)
| 項目 | 内容 |
|------|------|
| **URL** | `/` (hoặc `/meal-plan`) |
| **目的** | Lập kế hoạch ăn uống hàng tuần |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - 7日スロット表示（月〜日、日付・週ナビなし）<br>- Hiển thị tối đa 3 món ăn mỗi ngày<br>- Hiển thị nguyên liệu trên card ngày<br>- Nút "Thêm món" / "Generate Shopping List" / "Thêm sản phẩm"<br>- Khi nhấn "Generate Shopping List", mở modal "Tạo shopping list" để review/modify draft item trước khi tạo checklist<br>- Modal có "Thêm món vào list", "Thêm sản phẩm vào list", sửa/xóa/chọn item, và button chính "Tạo checklist"<br>- **料理提案（gợi ý món）UIなし**<br>- **日付・タイムラインUIなし**（週の from-to は買い物完了時のみ） |
| **遷移先** | - Generate Shopping List: mở modal draft<br>- Tạo checklist thành công: Hiển thị thông báo và chuyển hướng (hoặc cập nhật) sang trang Shopping List |
| **API** | GET `/api/v1/meal-plans/current`<br>POST `/api/v1/meal-plans`<br>PUT `/api/v1/meal-plans/{plan_id}`<br>POST `/api/v1/shopping-lists/generate` |

---

### 6. 買い物リスト

#### SC-011: 買い物リスト画面
| 項目 | 内容 |
|------|------|
| **URL** | `/shopping-list` |
| **目的** | 買い物リストの表示・チェック |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - アイテムリスト表示（カテゴリ別）<br>- 各食材行の下に `note`（例: `Dùng cho món …`）を表示<br>- チェックボックス<br>- 手動アイテム追加<br>- **「Finish shopping」押下後**、週の from-to 日付入力ポップアップ → 履歴に保存 |
| **遷移先** | - Meal Plan modal の "Tạo checklist" で作成された active checklist を表示<br>- 完了保存後: リストは非アクティブ化（履歴へ） |
| **API** | GET `/api/v1/shopping-lists/current`<br>PATCH `/api/v1/shopping-lists/{list_id}/items/{item_id}`<br>POST `/api/v1/shopping-lists/{list_id}/items` |

---

### 7. 履歴（Nice to Have）

#### SC-012: 買い物履歴画面
| 項目 | 内容 |
|------|------|
| **URL** | `/history` |
| **目的** | 過去の買い物履歴表示 |
| **アクセス権限** | 認証済みユーザー |
| **主要機能** | - 完了リスト一覧（完了 from-to 日付範囲を表示）<br>- 各リストの詳細表示（モーダル）<br>- チェック済み/未チェック表示 |
| **遷移先** | - 詳細: 展開表示 |
| **API** | GET `/api/v1/shopping-lists/history?weeks=2` |

---

## 画面遷移図

```
[Login] ──登録──> [Register] ──確認メール──> [Login]
   │
   │ログイン成功
   ▼
┌──────────────────────────────────────────────┐
│         Main Layout (Sidebar + Content)      │
│                                              │
│  Sidebar Menu:                               │
│  ├─> [Meal Plan] (デフォルト)               │
│  ├─> [Dishes List] ──> [Dish Detail/Form]   │
│  ├─> [Miscellaneous List] ──> [Misc Modal]  │
│  ├─> [Shopping List]                         │
│  └─> [History]                               │
│                                              │
│  [Meal Plan] ──生成──> [Shopping List]      │
└──────────────────────────────────────────────┘
```

**遷移の特徴**:
- ログイン後は常に Main Layout 内で画面遷移
- Sidebar でページ切り替え（URL変更あり）
- Header はページタイトルのみ表示
- Footer なし

---

## レスポンシブ対応

### デスクトップ（≥1024px）
- サイドバーナビゲーション常時表示
- 2カラムレイアウト（リスト + 詳細）
- テーブル形式のリスト表示

### タブレット（768px - 1023px）
- ハンバーガーメニュー
- 1カラムレイアウト
- カード形式のリスト表示

### モバイル（<768px）
- ボトムナビゲーション
- 1カラムレイアウト
- リスト形式（コンパクト）
- タップ操作最適化

---

## UI/UXガイドライン

### カラースキーム
- **Primary**: Green (#10B981) - 食材・健康的なイメージ
- **Secondary**: Blue (#3B82F6) - 信頼感
- **Accent**: Orange (#F59E0B) - アクション
- **Background**: White (#FFFFFF) / Gray (#F3F4F6)
- **Text**: Gray (#1F2937) / Light Gray (#6B7280)

### タイポグラフィ
- **見出し**: Inter / Noto Sans JP (Bold)
- **本文**: Inter / Noto Sans JP (Regular)
- **サイズ**: 16px (base), 14px (small), 20px (heading)

### コンポーネント
- **ボタン**: Rounded corners (8px), Shadow on hover
- **カード**: Border radius (12px), Subtle shadow
- **入力フィールド**: Border (1px), Focus ring
- **チェックボックス**: Large touch target (44px)

---

## アクセシビリティ

- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダー対応（ARIA labels）
- [ ] コントラスト比 4.5:1 以上
- [ ] タッチターゲット 44px 以上
- [ ] フォーカスインジケーター明確

---

## 次のステップ

1. **Database Schema設計** → `03_design/database_schema.md`
2. **API Spec作成** → `04_api/api_spec.md`
3. **Wireframe作成** → Figma / Excalidraw

---

**作成者**: Claude + Tai  
**レビュー日**: 2026-05-09  
**ステータス**: ✅ Draft
