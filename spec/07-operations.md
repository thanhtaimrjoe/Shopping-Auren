---
id: spec-ops
status: approved
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
---

# 07 — Vận hành

## 1. Môi trường

| Biến | Nguồn | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | inlined vào bundle lúc build |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable/anon key | **không** dùng service-role key ở frontend |

Local: copy `.env.example` → `.env.local`. Vercel: set cả hai cho Production + Preview. Vì là `NEXT_PUBLIC_`, build chạy trước khi có biến sẽ ship bundle lỗi.

Project: `mpuxleglzmoaexdjgerp` (PostgreSQL 17.11). Hosting: Vercel (`shopping-auren.vercel.app`).

## 2. Vòng đời migration (bắt buộc theo thứ tự này)

1. Viết file mới `supabase/migrations/<timestamp>_<name>.sql`. **Không sửa file đã apply** — thay đổi = file mới.
2. Test bằng harness PGlite trên schema dựng từ repo (apply đủ migration theo tên file, gọi RPC bằng role `authenticated`).
3. Apply lên Supabase **trước khi merge** nếu frontend mới phụ thuộc nó (thứ tự ngược lại = production gọi function chưa tồn tại).
4. Ghi version vào lịch sử, nếu không repo và DB lại lệch:
   ```sql
   insert into supabase_migrations.schema_migrations (version, name, statements)
   values ('20261112090000', 'complete_shopping_atomic', array['<ghi chú>'])
   on conflict (version) do nothing;
   ```
5. Kiểm chứng: `select version, name from supabase_migrations.schema_migrations order by version` phải khớp danh sách file trong repo.
6. Nếu đụng schema/RLS: cập nhật `spec/04-data-contract.md` trong cùng PR.

## 3. Seed

Seed dữ liệu mẫu **không** nằm trong migration path. Chạy tay khi cần một account có dữ liệu:

```sh
psql "$DATABASE_URL" -f supabase/seed/notion_mock_2026-10-30.sql
```

File seed gắn cứng UUID user → chỉ chạy trên project đã có user đó, hoặc sửa UUID trước khi chạy.

## 4. Deploy

Merge vào `main` → Vercel tự build + deploy production. Không deploy thủ công. Kiểm tra sau deploy: đăng nhập, tải trang chủ (phải thấy dữ liệu đã có, không toast lỗi), mở Checklist.

## 5. Rollback

- **Code:** `git revert <sha>` trên `main` → Vercel deploy lại bản trước.
- **Migration:** không rollback bằng cách sửa file. Viết migration bù (`..._revert_<việc>.sql`) và apply; giữ nguyên lịch sử version.
- **Dữ liệu người dùng:** Supabase Dashboard → Database → Backups (project có backup hằng ngày). Khôi phục là thao tác của PO, không phải của agent.

## 6. Runbook sự cố

| Triệu chứng | Kiểm tra đầu tiên | Xử lý |
|---|---|---|
| Toast "Không lưu được dữ liệu lên Supabase." | Console có `[supabase] save failed`? Message gốc là gì? | Message thật thường là lỗi constraint hoặc RPC → đọc `04` §2.3, kiểm tra payload có đủ 5 key (`ingredients`, `meals`, `products`, `plan`, `planProductIds`) |
| "Hoàn tất mua sắm" báo lỗi, Checklist vẫn mở | `select proname from pg_proc where proname='complete_shopping'` | Nếu thiếu → migration `20261112090000` chưa apply. Nếu có → đọc message: `No active checklist` (phiên đã đóng) / `date_from must be <= date_to` |
| Dữ liệu "biến mất" sau khi tick | Có 2 tab cùng mở? | RLS vẫn đúng nhưng ghi sau thắng ghi trước (không có real-time sync — ngoài MVP). Tải lại trang |
| Một bảng trả 0 row dù đã đăng nhập | `select * from pg_policies where tablename='<bảng>'` | Thiếu policy hoặc policy sai `auth.uid()`; bật RLS mà không có policy = khoá toàn bộ |
| Trang trắng, lỗi `Thiếu NEXT_PUBLIC_SUPABASE_*` | Env trên Vercel | Thêm biến rồi **redeploy** (biến `NEXT_PUBLIC_` chỉ đọc lúc build) |

## 7. Những điều không được làm

- Apply migration bằng tay rồi không ghi version (đúng lỗi đã xảy ra 3 lần trong tháng 10–11/2026).
- Sửa file migration đã chạy.
- Dùng service-role key ở bất kỳ đâu trong `src/`.
- `revoke`/`grant` trên bảng mà không cập nhật `04` §2.4.
- Chạy seed trên project production khi chưa xác định đúng user id.
