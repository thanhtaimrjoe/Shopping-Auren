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

### MVP機能
- ✅ ユーザー認証（登録・ログイン・パスワードリセット・表示名）
- ✅ 料理CRUD（登録・編集・削除・一覧）
- ✅ 雑貨CRUD（登録・編集・削除・一覧）
- ✅ 食事計画作成（週単位・月〜日）
- ✅ 買い物リスト自動生成・手動追加・チェックリスト

### Nice to Have
- ✅ 買い物履歴（過去2週間）
- ✅ 料理提案（履歴ベース）
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

### Local + production Supabase/API (no Docker)

Xem **[docs/LOCAL-PRODUCTION.md](./docs/LOCAL-PRODUCTION.md)** — chạy `npm run dev` trên máy, dùng Supabase + API hosted (không cần `supabase start`).

```powershell
.\scripts\run-local-production.ps1
```

### Local Supabase (Docker) — recommended for dev

See **[MIGRATION-PLAN.md](./MIGRATION-PLAN.md)** for the full workflow.

```bash
# 1. Start Supabase (requires Docker Desktop)
supabase start

# 2. Local env files
cp backend/.env.local.example backend/.env.local
cp frontend/.env.local.example frontend/.env.local

# 3. Apply schema + production seed
supabase db reset
```

Studio: http://127.0.0.1:54323 · API: http://127.0.0.1:54321

**Verify local stack**

```bash
curl http://localhost:8000/health   # {"status":"ok",...}
# Sign in at http://localhost:3000 with a user from supabase/seed.sql
```

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

### 3. Android app (Capacitor)

Xem **[docs/MOBILE-ANDROID.md](./docs/MOBILE-ANDROID.md)** — build APK từ cùng frontend Next.js.

```bash
cd frontend
cp .env.mobile.example .env.local   # chỉnh URL production hoặc 10.0.2.2 cho emulator
npm run cap:sync:android
npm run cap:open:android            # Run trong Android Studio
```

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

### 現在の状況 (2026-05-23)
- ✅ **Specs** + **Local Supabase Docker** (`MIGRATION-PLAN.md`)
- ✅ **MVP + Nice-to-have**: history, manual shopping items, auth polish (meal suggestions removed per DEC-014)
- ✅ **Backend tests**: meals, products, auth, shopping_lists, meal_plans
- 🟡 **Deploy**: Vercel + Railway + hosted Supabase (planned)

### 今後の優先事項
1. Production deploy + smoke test
2. E2E tests (optional)
3. Dashboard summary API (optional)

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

**最終更新**: 2026-05-23  
**バージョン**: 0.3.0 (Development Phase)
