# Inception Deck — Shopping Memo

**作成日**: 2026-05-09  
**プロジェクト**: Shopping Memo  
**目的**: 買い物計画アプリの要件定義

---

## 1. なぜこのプロジェクトを作るのか？

### 解決したい課題
- スーパーで計画なく買い物をしてしまう問題
- 必要なものを忘れて、不要なものを買ってしまう
- 週の食事計画が立てられていない

### プロジェクトの目的
1. **食事計画**: 来週（月曜日〜日曜日）の食事を事前に計画する
2. **買い物リスト自動生成**: 計画した食事から必要な材料を自動でリスト化
3. **雑貨管理**: 食材以外の日用品も一緒に管理
4. **履歴確認**: 過去2週間の買い物履歴を確認（優先度低）

### ビジネス価値
- 無駄な買い物を減らす
- 食事計画を立てやすくする
- 買い物時間を短縮する

---

## 2. 誰がこのアプリを使うのか？

### ターゲットユーザー
- **メインユーザー**: 本人と彼女（2名のみ）
- **ユーザー規模**: 小規模（2〜5名程度を想定）

### ユーザー特性
- **技術背景**: なし（一般ユーザー）
- **UI要件**: シンプルで使いやすいインターフェース
- **利用シーン**: 
  - 週末に来週の食事を計画
  - スーパーで買い物リストを確認
  - 買い物後にチェックリストを完了

---

## 3. コアな機能は何か？

### MVP機能（必須）
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 食事計画 | 来週（月〜日）の食事を登録 | 🔴 High |
| 買い物リスト生成 | 計画した食事から材料リストを自動生成 | 🔴 High |
| 料理CRUD | 料理の登録・編集・削除 | 🔴 High |
| 雑貨CRUD | 日用品の登録・編集・削除 | 🔴 High |
| チェックリスト | 買い物時にチェックを入れる | 🔴 High |

### Nice to Have機能（後回し）
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 履歴確認 | 過去2週間の買い物履歴を表示 | 🟡 Medium |
| 料理提案 | 履歴から料理を提案 | 🟢 Low |
| リスト共有 | 他のユーザーとリストを共有 | 🟢 Low |

---

## 4. 技術スタックはどうするか？

### Frontend
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context / Zustand
- **UI Components**: shadcn/ui

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: PostgreSQL (Supabase Free Tier)
- **Authentication**: Supabase Auth
- **ORM**: SQLAlchemy / Prisma

### Deployment
- **Frontend**: Vercel
- **Backend**: Vercel Serverless Functions / Railway
- **Database**: Supabase (Free Tier)
- **Migration**: Docker Local (旧データ移行用)

### Development Tools
- **Version Control**: Git + GitHub
- **API Documentation**: OpenAPI (FastAPI auto-generated)
- **Testing**: pytest (Backend), Jest (Frontend)

---

## 5. いつまでに完成させるか？

### タイムライン
| フェーズ | 期間 | 完了予定 |
|---------|------|----------|
| MVP開発 | 1週間 | 2026-05-16 |
| テスト・修正 | 3日 | 2026-05-19 |
| デプロイ | 1日 | 2026-05-20 |
| Full Version | 自由 | TBD |

### マイルストーン
- **Week 1 (2026-05-09 〜 2026-05-16)**: MVP完成
  - Day 1-2: 要件定義・設計
  - Day 3-4: Backend API開発
  - Day 5-6: Frontend開発
  - Day 7: 統合テスト

- **Week 2 (2026-05-17 〜 2026-05-20)**: リリース準備
  - Day 1-2: バグ修正
  - Day 3: デプロイ
  - Day 4: 本番確認

---

## 6. スコープ外（やらないこと）

| 項目 | 理由 |
|------|------|
| モバイルアプリ（ネイティブ） | Responsive Webで十分 |
| 栄養計算 | MVP範囲外 |
| レシピ詳細管理 | 料理名のみで十分 |
| 複数ユーザー間の共有 | 2名のみの利用 |
| 外部API連携（スーパー在庫など） | MVP範囲外 |
| 多言語対応 | 日本語のみ |

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| Supabase Free Tierの制限 | データ量・リクエスト数制限 | 使用量モニタリング、必要に応じて有料プラン |
| 1週間でMVP完成できない | スケジュール遅延 | 機能を最小限に絞る（履歴機能は後回し） |
| 旧データ移行の複雑さ | 移行失敗 | Docker Localで段階的に移行 |

---

## 8. 成功の定義

### MVP成功基準
- ✅ 来週の食事計画を登録できる
- ✅ 買い物リストが自動生成される
- ✅ スーパーでチェックリストを使える
- ✅ 料理・雑貨のCRUDができる
- ✅ 2名のユーザーがログインして使える

### Full Version成功基準
- ✅ 過去2週間の履歴が見られる
- ✅ 料理提案機能が動く
- ✅ リスト共有ができる

---

## 9. 次のステップ

1. **User Stories作成** → `02_requirements/user_stories.md`
2. **Screen List作成** → `03_design/screen_list.md`
3. **API Spec作成** → `04_api/api_spec.md`
4. **Database Schema設計** → `03_design/database_schema.md`
5. **開発開始** → Backend → Frontend → Integration

---

**承認者**: Tai  
**承認日**: 2026-05-09  
**ステータス**: ✅ Approved
