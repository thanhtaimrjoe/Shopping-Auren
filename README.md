# Shopping Memo Project

**プロジェクト概要**: 週の食事計画と買い物リスト管理アプリ

---

## 📋 プロジェクト情報

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | Shopping Memo |
| **目的** | 週の食事計画を立て、買い物リストを自動生成 |
| **ターゲットユーザー** | 2名（本人 + 彼女） |
| **開発期間** | MVP: 1週間（2026-05-09 〜 2026-05-16） |
| **ステータス** | 🟡 設計フェーズ |

---

## 🎯 主要機能

### MVP機能
- ✅ ユーザー認証（登録・ログイン）
- ✅ 料理CRUD（登録・編集・削除・一覧）
- ✅ 雑貨CRUD（登録・編集・削除・一覧）
- ✅ 食事計画作成（来週月〜日）
- ✅ 買い物リスト自動生成
- ✅ 買い物チェックリスト

### Nice to Have
- 🟡 買い物履歴（過去2週間）
- 🟡 料理提案（履歴ベース）
- 🟡 リスト共有

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (検討中)
- **State Management**: React Context / Zustand (検討中)

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

## 📁 プロジェクト構成

```
Shopping-Auren/
├── frontend/               # Next.js frontend
│   ├── app/               # App Router
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   └── public/            # Static files
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── migrations/       # Database migrations
│   └── tests/            # Tests
└── docs/                 # Documentation
    └── spec/             # Specifications
```

---

## 📚 ドキュメント

### 設計ドキュメント（Claude Projects）
プロジェクト仕様は `/Users/taiht/.claude/projects/Shopping-Auren/` に保存されています。

| ドキュメント | パス | 説明 |
|-------------|------|------|
| Inception Deck | `01_inception/inception_deck.md` | プロジェクト概要・目的 |
| User Stories | `02_requirements/user_stories.md` | ユーザーストーリー・受け入れ基準 |
| Screen List | `03_design/screen_list.md` | 画面一覧・URL・機能 |
| Database Schema | `03_design/database_schema.md` | データベース設計 |
| API Spec | `04_api/api_spec.md` | REST API仕様 |
| Decision Log | `05_tracking/decisions.md` | 設計・実装の意思決定記録 |

---

## 🚀 セットアップ

### 前提条件
- Node.js 20+
- Python 3.13+
- PostgreSQL (Supabase)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

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

## 🔗 関連リンク

- **Supabase Project**: [TBD]
- **Vercel Deployment**: [TBD]
- **Railway Deployment**: [TBD]
- **GitHub Repository**: [TBD]

---

## 📝 開発メモ

### 2026-05-09
- ✅ Inception Deck作成完了
- ✅ User Stories作成完了
- ✅ Screen List作成完了
- ✅ Database Schema設計完了
- ✅ API Spec作成完了
- ✅ Decision Log作成完了
- 🟡 次: Project Structure作成、Backend実装開始

---

## 🤝 コントリビューター

- **Tai** - Project Owner, Developer
- **Claude** - AI Assistant, Spec Writer

---

## 📄 ライセンス

Private Project - Not for public distribution

---

**最終更新**: 2026-05-09  
**バージョン**: 0.1.0 (設計フェーズ)
