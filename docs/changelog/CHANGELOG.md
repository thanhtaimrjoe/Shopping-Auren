# Changelog — Shopping Memo

**プロジェクト**: Shopping Memo  
**目的**: 開発変更履歴の記録

---

## 📝 記録ルール

### フォーマット
```markdown
## [YYYY-MM-DD HH:MM] - 機能名/バグ修正

**担当**: [AI名 or "AI Assistant"]  
**タイプ**: [Feature/Bugfix/Refactor/Test/Docs]  
**関連US**: [User Story ID]  
**影響範囲**: [Frontend/Backend/Database/API]

### 変更内容
- 変更点1
- 変更点2

### 実装詳細
- ファイル: `path/to/file`
- 変更理由: ...
- 技術的な決定: ...

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [ ] エラーハンドリング確認

### 備考
- 注意点や今後の課題

---
```

---

## 変更履歴

### [2026-05-09 17:18] - プロジェクト初期設定

**担当**: Claude (PM)  
**タイプ**: Docs  
**関連US**: -  
**影響範囲**: Project Setup

#### 変更内容
- プロジェクト仕様書作成完了
- Inception Deck作成
- User Stories作成（7 Epics, 15 Stories）
- Screen List作成（12画面定義）
- Database Schema設計（7テーブル）
- API Specification作成（30+ endpoints）
- Decision Log作成（9 decisions）
- Progress Tracking作成
- CLAUDE.md作成（AI開発者向けガイドライン）
- CHANGELOG.md作成（このファイル）

#### 実装詳細
- ファイル: `docs/spec/01_inception/inception_deck.md`
- ファイル: `docs/spec/02_requirements/user_stories.md`
- ファイル: `docs/spec/03_design/screen_list.md`
- ファイル: `docs/spec/03_design/database_schema.md`
- ファイル: `docs/spec/04_api/api_spec.md`
- ファイル: `docs/spec/05_tracking/decisions.md`
- ファイル: `docs/spec/05_tracking/progress.md`
- ファイル: `CLAUDE.md`
- ファイル: `docs/changelog/CHANGELOG.md`

#### Tech Stack決定
- Frontend: Next.js 14+ (App Router), TypeScript, TailwindCSS
- Backend: FastAPI (Python 3.13), PostgreSQL (Supabase)
- Auth: Supabase Auth
- Deployment: Vercel (Frontend), Railway (Backend)

#### 設計決定
- 材料管理: テキスト保存（改行区切り）→ MVP優先
- Soft Delete採用 → 履歴機能対応
- 週単位制約（月曜日開始）
- RESTful API採用
- 完全一致で材料重複排除

#### テスト
- [x] 仕様書レビュー完了
- [x] Tech Stack承認
- [x] Timeline確認（MVP: 1週間）

#### 備考
- 次のステップ: Backend project structure作成
- MVP期間: 2026-05-09 〜 2026-05-16
- デフォルトページ: `/meal-plan` (Dashboard削除)
- Main Layout: Sidebar + Header (Page Title) + Content Area

---

## 次の開発者へ

このファイルに必ず変更内容を記録してください。

- コード実装 → 記録
- バグ修正 → 記録
- リファクタリング → 記録
- テスト追加 → 記録

**記録しないと、PMとBrSEがレビューできません！**

---

**最終更新**: 2026-05-09 17:18  
**更新者**: Claude (PM)
