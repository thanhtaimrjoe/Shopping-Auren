# Progress Tracking — Shopping Memo

**作成日**: 2026-05-09  
**最終更新**: 2026-05-24 (category削除; 商品画像アップロード; shopping group表示)  
**プロジェクト**: Shopping Memo  

---

## 全体進捗

| フェーズ | 進捗 | ステータス |
|---------|------|-----------|
| 要件定義・設計 | 100% | 完了 |
| Backend開発 | 100% | 完了 |
| Frontend開発 | 100% | 完了 |
| 統合テスト (手動 + pytest) | 90% | 進行中 |
| 本番マイグレーション (Supabase Production) | 60% | 進行中 |
| デプロイ (Vercel / Railway) | 0% | 予定 |

**全体進捗**: ~95% (MVP 機能実装済み; 料理提案 US-015 は廃止; production migration 未適用分は残存)

---

## 完了した User Stories

| ID | 内容 | ステータス |
|----|------|-----------|
| US-001 | 登録 + display_name | 完了 |
| US-002 | ログイン + パスワードリセット | 完了 |
| US-003～008 | Meals / Products CRUD | 完了 |
| US-009～011 | 食事計画 + 買い物リスト生成 | 完了 |
| US-012 | チェックリスト + 全件チェック通知 | 完了 |
| US-013 | 買い物リスト手動追加 (shopping UI) | 完了 |
| US-014 | 買い物履歴 (2週間) | 完了 |

---

## 最新実装済み機能 (2026-05-24)

| 機能 | ステータス | Migration |
|------|--------|-----------|
| Shoppingリスト week from-to 日付入力 | ✅ 実装済 | `20260523120000_shopping_list_week_range.sql` |
| Shopping履歴 snapshot_json | ✅ 実装済 | `20260524120000_add_shopping_list_snapshot.sql` |
| 商品画像アップロード (Supabase Storage) | ✅ 実装済 | `20260524140000_product_images_storage.sql` |
| meals/products category削除 | ✅ 実装済 | `20260524180000_drop_meals_products_category.sql` |
| Shoppingリストグループ表示 (料理名別) | ✅ 実装済 | コードのみ |
| 料理提案 US-015 廃止 | ✅ 廃止 | コード・仕様のみ |

---

## Local dev (Supabase Docker)

1. `supabase start` → `supabase db reset`
2. `backend/.env.local` + `frontend/.env.local` from examples
3. `uvicorn` on :8000, `npm run dev` on :3000

詳細: [MIGRATION-PLAN.md](../../../MIGRATION-PLAN.md), [README.md](../../../README.md)

---

## 残タスク

- [ ] Production deploy (Vercel / Railway / Supabase Cloud)
- [ ] **Production Supabase migration適用** (migrations `20260523120000` 〜 `20260524180000` の 4 ファイル)
- [ ] E2E tests (Playwright 等)
- [ ] `/dashboard/summary` API (optional)

---

## ブロッカー

なし

---

**更新者**: AI Assistant + Tai
