# Progress Tracking — Shopping Memo

**作成日**: 2026-05-09  
**最終更新**: 2026-05-23  
**プロジェクト**: Shopping Memo  

---

## 全体進捗

| フェーズ | 進捗 | ステータス |
|---------|------|-----------|
| 要件定義・設計 | 100% | 完了 |
| Backend開発 | 100% | 完了 |
| Frontend開発 | 100% | 完了 |
| 統合テスト (手動 + pytest) | 90% | 進行中 |
| デプロイ | 0% | 予定 |

**全体進捗**: ~95% (MVP + Nice-to-have 機能実装済み)

---

## 完了した User Stories

| ID | 内容 | ステータス |
|----|------|-----------|
| US-001 | 登録 + display_name | 完了 |
| US-002 | ログイン + パスワードリセット | 完了 |
| US-003〜008 | Meals / Products CRUD | 完了 |
| US-009〜011 | 食事計画 + 買い物リスト生成 | 完了 |
| US-012 | チェックリスト + 全件チェック通知 | 完了 |
| US-013 | 買い物リスト手動追加 (shopping UI) | 完了 |
| US-014 | 買い物履歴 (2週間) | 完了 |
| US-015 | 料理提案 | 完了 |

---

## Local dev (Supabase Docker)

1. `supabase start` → `supabase db reset`
2. `backend/.env.local` + `frontend/.env.local` from examples
3. `uvicorn` on :8000, `npm run dev` on :3000

詳細: [MIGRATION-PLAN.md](../../../MIGRATION-PLAN.md), [README.md](../../../README.md)

---

## 残タスク

- [ ] Production deploy (Vercel / Railway / Supabase Cloud)
- [ ] E2E tests (Playwright 等)
- [ ] `/dashboard/summary` API (optional)
- [ ] DEC-011 hard delete vs soft delete — **実装は soft delete** (Decision Log 参照)

---

## ブロッカー

なし

---

**更新者**: AI Assistant + Tai
