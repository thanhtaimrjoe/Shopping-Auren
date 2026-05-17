# Shopping Memo Project

**プロジェクト概要**: 週の食事計画と買い物リスト管理アプリ

---

## 📋 プロジェクト情報

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | Shopping Memo |
| **目的** | 週の食事計画を立て、買い物リストを自動生成 |
| **ターゲットユーザー** | 2名（本人 + 彼女） |
| **開発期間** | MVP: 2026-05-09 〜 現在進行中 |
| **ステータス** | 🟢 Development Phase (MVP Implementation) |

---

## 🎯 主要機能

### MVP機能 (In Progress)
- ✅ ユーザー認証（登録・ログイン）
- 🔄 料理CRUD（登録・編集・削除・一覧）
- 🔄 雑貨CRUD（登録・編集・削除・一覧）
- ✅ 食事計画作成（週単位・月〜日）
- 🔄 買い物リスト自動生成
- 🔄 買い物チェックリスト

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
- **UI Components**: Custom + shadcn/ui (planned)
- **State Management**: React Context + local state (Zustand planned)

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **API Client**: Axios + interceptors

### Deployment (Planned)
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Supabase (Free Tier)

---

## 📁 プロジェクト構成

```
Shopping-Auren/
├── frontend/               # Next.js frontend (TypeScript + Tailwind)
│   ├── src/app/           # App Router + pages (login, meals, products, shopping, meal-plan)
│   ├── src/components/    # Reusable UI components
│   ├── src/context/       # AuthContext, etc.
│   ├── src/lib/           # api.ts, supabase.ts
│   └── public/
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/v1/       # meals, products, meal_plans, shopping_lists
│   │   ├── core/         # auth, config
│   │   ├── models/       # (To be strengthened)
│   │   ├── schemas/      # (To be strengthened)
│   │   └── services/     # Business logic
│   ├── migrations/
│   └── tests/
└── docs/                   # Documentation
    ├── spec/               # Full professional specs
    └── changelog/          # Development history
```

---

## 📚 ドキュメント

### 設計ドキュメント (Repo内)
プロジェクト仕様は `docs/spec/` に置いてあります。

| ドキュメント | パス | 説明 |
|-------------|------|------|
| Inception Deck | `01_inception/inception_deck.md` | プロジェクト概要・目的 |
| User Stories | `02_requirements/user_stories.md` | ユーザーストーリー・受け入れ基準 |
| Screen List | `03_design/screen_list.md` | 画面一覧・URL・機能 |
| Database Schema + Migration | `03_design/` | DB設計 + 既存データ移行計画 |
| API Specification | `04_api/api_spec.md` | REST API仕様 (30+ endpoints) |
| Decision Log | `05_tracking/decisions.md` | 設計・実装の意思決定記録 |
### 開発ガイド
- `CLAUDE.md` / `AGENTS.md` — AI開発者向けルール
- `docs/changelog/CHANGELOG.md` — 変更履歴詳細

---

## 🚀 How to Run (Cách chạy dự án)

Để ứng dụng hoạt động đầy đủ, bạn cần chạy song song cả **Frontend** và **Backend**.

### 1. Khởi động Backend (FastAPI)
Mở một terminal mới và chạy các lệnh sau:
```bash
cd backend
# Cài đặt thư viện (chỉ cần chạy lần đầu)
python3 -m pip install -r requirements.txt

# Khởi động server
export PYTHONPATH=$PYTHONPATH:.
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend sẽ chạy tại: http://localhost:8000*

### 2. Khởi động Frontend (Next.js)
Mở một terminal khác và chạy:
```bash
cd frontend
# Cài đặt thư viện (chỉ cần chạy lần đầu)
npm install

# Khởi động chế độ phát triển
npm run dev
```
*Frontend sẽ chạy tại: http://localhost:3000*

---

## 🛠 Tech Stack🚀 セットアップ

### 前提条件
- Node.js 20+
- Python 3.13+
- Supabase PostgreSQL

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 📅 開発進捗

### 現在の状況 (2026-05-16)
- ✅ **Specs**: 全て完了 (Inception Deck, User Stories, DB Schema, API Spec, Decision Log)
- ✅ **Auth**: Supabase Auth 完了
- ✅ **Meal Plan (Weekly Alignment)**: メインページ実装完了 + API連携
- ✅ **Backend APIs**: meals, products, meal_plans, shopping_lists ルーター実装
- 🔄 Backend models/schemas layer 強化中
- 🔄 Frontend CRUDページ完成中

### 今後の優先事項
1. Backend models + services layer 正規化
2. Database migration scripts
3. Frontend ミール・プロダクツ CRUD 完成
4. Integration test & deploy

---

## 🔗 関連リンク

- GitHub: https://github.com/thanhtaimrjoe/Shopping-Auren
- Specs: `docs/spec/`

---

## 📝 開発メモ

### 2026-05-16
- ✅ Weekly Alignment ページのバグフィックス (404 handling, API loop, modal data loading)
- ✅ Auth・API client 改善

### 2026-05-09
- ✅ Inception Deck・User Stories・Screen List・Database Schema・API Spec・Decision Log 完了
- ✅ プロジェクト構造・開発ルール構築

---

## 🤝 コントリビューター

- **Tai (Yano)** — Project Owner & Developer
- **Claude / Grok** — AI Assistant (Spec + Implementation support)

---

## 📄 ライセンス

Private Project

---

**最終更新**: 2026-05-16  
**バージョン**: 0.2.0 (Development Phase)
