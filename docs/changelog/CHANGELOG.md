# Changelog — Shopping Memo

**プロジェクト**: Shopping Memo  
**目的**: 開発変更履歴 của dự án

---

## [2026-05-17 00:08] - Meal slot仕様調整

**担当**: AI Assistant  
**タイプ**: Refactor  
**関連US**: US-006  
**影響範囲**: Frontend, Backend, Database, API

### 変更内容
- `breakfast/lunch/dinner` 固定名称は廃止しつつ、1日最大3件の制限は維持
- Frontend で4件目追加を抑止
- Backend で1日3件を超える payload を validation error に変更
- Migration 名と仕様説明を「可変スロットだが最大3件」へ修正

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `backend/app/api/v1/meal_plans.py`
- ファイル: `backend/migrations/005_replace_meal_type_slots.sql`
- ファイル: `docs/spec/03_design/database_schema.md`
- ファイル: `docs/spec/04_api/api_spec.md`
- 変更理由: Meal type の意味づけは不要だが、日次登録数の上限は現行運用に必要なため
- 技術的な決定: `slot_000` / `slot_001` / `slot_002` を使用し、件数上限は backend validator で担保

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- Supabase DB には `backend/migrations/005_replace_meal_type_slots.sql` を適用

---

## [2026-05-16 22:27] - 1日複数Meal登録制限解除

**担当**: AI Assistant  
**タイプ**: Feature  
**関連US**: US-006  
**影響範囲**: Frontend, Backend, Database, API

### 変更内容
- Weekly Alignment で1日3件までしか meal を追加できない制限を解除
- `breakfast/lunch/dinner` 固定スロットを廃止し、`slot_000`, `slot_001` 形式の可変スロットへ変更
- Database migration を追加し、`meal_plan_items_type_check` 制約を削除
- API仕様書とDB設計書を新しい可変スロット仕様へ更新

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `backend/app/api/v1/meal_plans.py`
- ファイル: `backend/migrations/005_allow_unlimited_daily_meals.sql`
- ファイル: `docs/spec/03_design/database_schema.md`
- ファイル: `docs/spec/04_api/api_spec.md`
- 変更理由: 1日に4件以上 meal を登録するユースケースに対応するため
- 技術的な決定: 既存 `meal_type` カラムを表示順スロットとして再利用し、DB構造変更を最小化

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- Supabase DB に `backend/migrations/005_allow_unlimited_daily_meals.sql` の適用が必要

---

## [2026-05-16 22:18] - Weekly Plan保存422修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend, API

### 変更内容
- Weekly Alignment で meal plan 保存時に `422` となる問題を修正
- Frontend 保存 payload を backend spec の `week_start_date` + `meals[]` 形式へ変更
- 既存 plan は `PUT /meal-plans/{id}`、未作成週は `POST /meal-plans` を使用

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `frontend/src/lib/api.ts`
- 変更理由: Frontend が `date` と `meal_names` を送っており、backend の Pydantic schema と不一致だったため
- 技術的な決定: 画面の meal 名一覧を `mealDatabase` から `meal_id` へ変換し、表示順を `breakfast/lunch/dinner` スロットへマッピング

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- 1日3件を超える meal は backend 制約上保存対象外

---

## [2026-05-16 22:11] - Weekly Plan未作成時404ハンドリング修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend, API

### 変更内容
- Weekly Alignment で meal plan 未作成週の `404` を正常な空状態として扱うよう修正
- `Meal plan not found for this week` の console error を抑止
- 未作成週では `selectedMeals` を空に初期化

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- ファイル: `frontend/src/lib/api.ts`
- 変更理由: Backend の `404` は異常系ではなく「まだ meal plan がない」状態を表していたため
- 技術的な決定: `/meal-plans/current` の `404` は interceptor と画面側の両方で期待値として扱う

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- 真の API 異常は引き続き console に表示される

---

## [2026-05-16 22:06] - Meal選択モーダル一覧取得修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend

### 変更内容
- Weekly Alignment の meal 選択モーダルで meal list が空のままになる問題を修正
- 初回取得に失敗または未取得の場合、モーダルを開いたタイミングで再取得
- 読み込み中は既存の spinner 表示を継続

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- 変更理由: 画面初回 effect 時点で meal list が未取得のままでも、モーダル表示時に再取得していなかったため
- 技術的な決定: `openModal` 内で `mealDatabase.length === 0` かつ未読込中の場合のみ `fetchMeals()` を再実行

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- Backend 認証エラー時は一覧ではなく空表示のままになるため、必要なら通知追加を検討

---

## [2026-05-16 22:00] - Weekly Alignment APIループ修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend, API

### 変更内容
- Weekly Alignment画面で meal plan API が連続呼び出しされる問題を修正
- `weekStart` の再生成による effect 再発火を抑止
- Backend仕様に合わせて meal plan 取得クエリを `week_start` に修正

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- 変更理由: `Date` オブジェクトが毎レンダー新規生成され `useCallback` と `useEffect` の依存が毎回変化していたため
- 技術的な決定: `useMemo` で `weekStart` と `weekStartKey` を安定化し、 API クエリを backend endpoint 仕様に合わせた

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- `fetchMeals` は初回表示ごとに1回呼ばれる想定

---

## [2026-05-16 21:52] - 食事計画取得エラー修正

**担当**: AI Assistant  
**タイプ**: Bugfix  
**関連US**: US-006  
**影響範囲**: Frontend

### 変更内容
- Weekly Plan画面で meal plan 取得時に `data.meals.map` が undefined で落ちる問題を修正
- Backendの `meal_plan.meals` 配列レスポンスを日付キーの表示状態へ変換
- 旧形式の日付キー付き meal plan レスポンスにも引き続き対応

### 実装詳細
- ファイル: `frontend/src/app/page.tsx`
- 変更理由: Backend APIの現在レスポンス形式とFrontend変換ロジックが不一致だったため
- 技術的な決定: `day_of_week` から週開始日基準の日付キーを生成し、meal名のみ表示状態へ格納

### テスト
- [ ] Unit Test追加
- [ ] 動作確認完了
- [x] エラーハンドリング確認

### 備考
- 保存処理のAPI形式差分は別途確認が必要

---

## [2026-05-14T14:30:00Z] - Release v0.2.0

### **New Features**
- **Authentication System**: Triển khai hệ thống xác thực người dùng hoàn chỉnh.
  - Tích hợp `Supabase Auth` cho việc đăng ký, đăng nhập và đăng xuất.
  - Thêm trang `login/page.tsx` với giao diện hiện đại.
  - Quản lý trạng thái người dùng toàn cục qua `AuthContext.tsx`.
- **Database Integration**: Chuyển đổi từ dữ liệu mẫu (mockup) sang cơ sở dữ liệu thực tế.
  - Kết nối Frontend với Backend FastAPI và Supabase DB.
  - Cập nhật các trang `meals`, `products` và `page.tsx` (Weekly Plan) để truy xuất dữ liệu thực.
- **API Client Standard**: Xây dựng bộ API client sử dụng `axios` với cơ chế tự động đính kèm JWT token.
  - Tệp ảnh hưởng: `frontend/src/lib/api.ts`, `frontend/src/lib/supabase.ts`.

### **Bug Fixes**
- **API Data Retrieval**: Sửa lỗi API `meals` và `products` trả về mảng rỗng do truy vấn cột `deleted_at` không tồn tại sau khi chuyển sang Hard Delete.
  - Tệp ảnh hưởng: `backend/app/api/v1/meals.py`, `backend/app/api/v1/products.py`.
- **Authentication Logic**: Khắc phục lỗi `401 Unauthorized` bằng cách chuyển cơ chế xác thực JWT từ giải mã cục bộ sang sử dụng Supabase SDK.
  - Tệp ảnh hưởng: `backend/app/core/auth.py`.
- **Rules of Hooks**: Sửa lỗi vi phạm thứ tự gọi Hooks trong `Sidebar.tsx` gây ra bởi việc `return null` sớm trước các `useEffect`.
  - Tệp ảnh hưởng: `frontend/src/components/Sidebar.tsx`.
- **Unnecessary 401 Logs**: Ngăn chặn việc gọi API khi người dùng chưa đăng nhập và ẩn log lỗi 401 không cần thiết trong console.
  - Tệp ảnh hưởng: `frontend/src/lib/api.ts`, `frontend/src/app/page.tsx`.
- **Network Connectivity**: Khắc phục lỗi `ERR_CONNECTION_REFUSED` bằng cách đảm bảo Backend server được khởi chạy và cấu hình CORS chính xác.

### **Improvements**
- **Error Handling**: Thêm cơ chế interceptors cho `axios` để ghi lại nhật ký lỗi chi tiết (API Error Response, Network Error) giúp dễ dàng chẩn đoán sự cố.
  - Tệp ảnh hưởng: `frontend/src/lib/api.ts`.
- **UI/UX Refinement**: 
  - Tăng khoảng cách (padding-top) cho tiêu đề phụ (Editorial Header) trên tất cả các trang chính để giao diện thoáng đãng hơn.
  - Bổ sung các biểu tượng điều hướng bị thiếu (`ChevronLeft`, `ChevronRight`) trong trang Meals.

### **Documentation Updates**
- **Spec Synchronization**: Đồng bộ hóa toàn bộ tài liệu đặc tả kỹ thuật (`docs/spec/`) để khớp với các quyết định thiết kế mới (DEC-011).
  - Thống nhất thuật ngữ: `dishes` -> `meals`, `miscellaneous` -> `products`.
  - Cập nhật logic xóa sang Hard Delete và cấu hình `JSONB` cho nguyên liệu.
- **Decision Log**: Ghi nhận quyết định **DEC-011** về việc thống nhất thuật ngữ và logic xóa dữ liệu.

---

## [2026-05-09T17:18:00Z] - Release v0.1.0

### **Documentation Updates**
- Khởi tạo toàn bộ bộ hồ sơ đặc tả dự án bao gồm: Inception Deck, User Stories, Screen List, Database Schema, API Specification, và Decision Log.
- Thiết lập quy trình phát triển và hướng dẫn cho AI Assistant (`AGENTS.md`).

---

**Người thực hiện**: AI Assistant  
**Ngày cập nhật cuối**: 2026-05-14  
