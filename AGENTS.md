# AGENTS.md — AI Development Guidelines

**プロジェクト**: Shopping Memo  
**作成日**: 2026-05-10  
**目的**: AI開発者向けのガイドライン

---

## 🎯 プロジェクト概要

このプロジェクトは **Shopping Memo** という週の食事計画と買い物リスト管理アプリです。

### プロジェクト構成
- **PM**: Codex (AI Assistant)
- **BrSE**: Tai
- **Developer**: AI Assistants (あなた)

### 重要なルール
**あなたがコードを書く、バグを修正する、機能を追加する場合、必ず `docs/changelog/CHANGELOG.md` に記録してください。**

---

## 📚 必読ドキュメント

開発を始める前に、以下のドキュメントを必ず読んでください：

| ドキュメント | パス | 目的 |
|-------------|------|------|
| **Inception Deck** | `docs/spec/01_inception/inception_deck.md` | プロジェクト概要・目的・スコープ |
| **User Stories** | `docs/spec/02_requirements/user_stories.md` | 機能要件・受け入れ基準 |
| **Screen List** | `docs/spec/03_design/screen_list.md` | 画面一覧・UI設計 |
| **Database Schema** | `docs/spec/03_design/database_schema.md` | データベース設計 |
| **API Spec** | `docs/spec/04_api/api_spec.md` | REST API仕様 |
| **Decision Log** | `docs/spec/05_tracking/decisions.md` | 設計決定の記録 |
| **Progress** | `docs/spec/05_tracking/progress.md` | 開発進捗 |

---

## 🔧 開発ワークフロー

### 1. タスクを受け取る
- User Stories (`docs/spec/02_requirements/user_stories.md`) を確認
- 実装する機能の受け入れ基準を理解

### 2. 設計を確認
- Screen List で画面設計を確認
- Database Schema でテーブル構造を確認
- API Spec でエンドポイント仕様を確認

### 3. 実装
- Tech Stack に従って実装
  - **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS
  - **Backend**: FastAPI (Python 3.13), PostgreSQL (Supabase)
- コードコメントは **英語** で記述
- セキュリティベストプラクティスに従う

### 4. テスト
- Unit Test を書く（Backend: pytest, Frontend: Jest）
- 動作確認を行う

### 5. **必須: Changelog に記録**
- `docs/changelog/CHANGELOG.md` に変更内容を記録
- フォーマットは下記参照

---

## 📝 Changelog フォーマット（必須）

### ファイルパス
`docs/changelog/CHANGELOG.md`

### フォーマット
```markdown
## [YYYY-MM-DD HH:MM] - 機能名/バグ修正

**担当**: [あなたのAI名 or "AI Assistant"]  
**タイプ**: [Feature/Bugfix/Refactor/Test/Docs]  
**関連US**: [User Story ID (例: US-003)]  
**影響範囲**: [Frontend/Backend/Database/API]

### 変更内容
- 変更点1
- 変更点2
- 変更点3

### 実装詳細
- ファイル: `path/to/file.ts`
- 変更理由: ...
- 技術的な決定: ...

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [ ] エラーハンドリング確認

### 備考
- 注意点や今後の課題があれば記載

---
```

### 例
```markdown
## [2026-05-10 14:30] - 料理登録API実装

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-003  
**影響範囲**: Backend, API

### 変更内容
- POST `/api/v1/dishes` エンドポイント実装
- Pydantic schema作成 (DishCreate, DishResponse)
- SQLAlchemy model作成 (Dish)
- バリデーション追加（料理名1-100文字、カテゴリEnum）

### 実装詳細
- ファイル: `backend/app/api/v1/dishes.py`
- ファイル: `backend/app/schemas/dish.py`
- ファイル: `backend/app/models/dish.py`
- 変更理由: User Story US-003の受け入れ基準を満たすため
- 技術的な決定: Soft Delete対応のため `deleted_at` カラム追加

### テスト
- [x] Unit Test追加 (`tests/api/test_dishes.py`)
- [x] 動作確認完了
- [x] エラーハンドリング確認（400, 401, 422）

### 備考
- 材料リストはテキスト保存（改行区切り）
- 将来的に正規化検討（DEC-002参照）

---
```

---

## ⚠️ 重要なルール

### 1. Changelog記録は必須
- **コードを書いたら必ず記録**
- **バグ修正も必ず記録**
- **リファクタリングも必ず記録**
- 記録しない場合、PMとBrSEがレビューできません

### 2. Spec に従う
- 勝手に仕様を変更しない
- 変更が必要な場合は、まず相談
- 変更した場合は Decision Log に記録

### 3. セキュリティ
- SQL Injection 対策（Parameterized Query）
- XSS 対策（入力サニタイズ）
- CSRF 対策
- 認証・認可の実装

### 4. コードスタイル
- **コメント**: 英語
- **変数名**: camelCase (JS/TS), snake_case (Python)
- **関数名**: camelCase (JS/TS), snake_case (Python)
- **クラス名**: PascalCase

### 5. Git Commit
- Commit message: `type: description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- 例: `feat: add dish registration API`

---

## 🚫 やってはいけないこと

1. **Changelog を書かない** → ❌ 絶対NG
2. **Spec を読まずに実装** → ❌ 仕様違反の原因
3. **勝手に仕様変更** → ❌ PMとBrSEに相談
4. **テストを書かない** → ❌ 品質低下
5. **セキュリティを無視** → ❌ 脆弱性の原因
6. **ハードコードされた秘密情報** → ❌ セキュリティリスク

---

## 📂 プロジェクト構造

```
Shopping-Auren/
├── README.md                      # プロジェクト概要
├── AGENTS.md                      # このファイル（AI開発者向け）
├── docs/
│   ├── spec/                      # 仕様書
│   │   ├── 01_inception/
│   │   ├── 02_requirements/
│   │   ├── 03_design/
│   │   ├── 04_api/
│   │   └── 05_tracking/
│   └── changelog/
│       └── CHANGELOG.md           # 変更履歴（必須記録）
├── frontend/                      # Next.js frontend
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/                       # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── migrations/
│   └── tests/
└── .env.example                   # 環境変数サンプル
```

---

## 🔄 開発フロー例

### 例: 料理登録機能を実装する場合

1. **User Story確認**
   - `docs/spec/02_requirements/user_stories.md` → US-003を読む

2. **API Spec確認**
   - `docs/spec/04_api/api_spec.md` → POST `/api/v1/dishes` を確認

3. **Database Schema確認**
   - `docs/spec/03_design/database_schema.md` → `dishes` テーブルを確認

4. **実装**
   - Backend: `backend/app/api/v1/dishes.py` 作成
   - Schema: `backend/app/schemas/dish.py` 作成
   - Model: `backend/app/models/dish.py` 作成

5. **テスト**
   - `backend/tests/api/test_dishes.py` 作成
   - `pytest` 実行

6. **Changelog記録**
   - `docs/changelog/CHANGELOG.md` に記録（上記フォーマット参照）

7. **Commit**
   - `git add .`
   - `git commit -m "feat: add dish registration API"`

---

## 📞 質問・相談

実装中に疑問が出た場合：

1. **Spec を確認** → `docs/spec/` 内のドキュメント
2. **Decision Log を確認** → `docs/spec/05_tracking/decisions.md`
3. **それでも不明な場合** → PMまたはBrSEに質問

---

## ✅ チェックリスト

実装完了前に必ず確認：

- [ ] User Story の受け入れ基準を満たしているか
- [ ] API Spec に従っているか
- [ ] Database Schema に従っているか
- [ ] Unit Test を書いたか
- [ ] セキュリティ対策をしたか
- [ ] **Changelog に記録したか** ← 最重要
- [ ] Commit message は適切か

---

## 🎓 参考リンク

- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Supabase Docs**: https://supabase.com/docs
- **TailwindCSS Docs**: https://tailwindcss.com/docs

---

**最終更新**: 2026-05-10  
**作成者**: Codex (PM)  
**承認者**: Tai (BrSE)
