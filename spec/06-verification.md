---
id: spec-verification
status: approved
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
sources: [spec/02-behavior.md, spec/03-ui-contract.md, harness PGlite 2026-11-12, spec/_legacy/audit-2026-11-12.md]
---

# 06 — Ma trận kiểm chứng

Quy ước trạng thái:

- **`harness`** — có check tự động chạy thật trên schema dựng từ repo (script `auren-migrations-verify.mjs`, Postgres 18/PGlite, role `authenticated` + `auth.uid()` giả lập). **35/35 PASS** ngày 2026-11-12.
- **`manual`** — kịch bản tay đã ghi trong `02` (dòng `Kiểm chứng:`), chưa tự động hoá.
- **`missing`** — chưa có cách kiểm nào.

Không có test framework (DEC-032) — harness là node script, chạy tay/CI.

---

## 1. Yêu cầu chức năng

| ID | Đã kiểm bằng | Trạng thái | Còn thiếu |
|---|---|---|---|
| FR-01 Tài khoản | manual: đăng ký → đăng nhập → reload → đăng xuất; sai mật khẩu → COPY-01 | manual | test auth tự động (cần test user) |
| FR-02 Nguyên liệu | harness: BR-03 (unique sau chuẩn hoá), BR-04.2 (chặn xoá) | harness | CRUD UI là manual |
| FR-03 Món ăn | harness: BR-13 (trùng nguyên liệu trong món) | harness | multi-select UI là manual |
| FR-04 Sản phẩm | harness: BR-10 (enum chặn danh mục lạ) | harness | form UI là manual |
| FR-05 Kế hoạch tuần | harness: BR-14 (unique + position 1..3 ở DB) | harness | kéo–thả, thông báo trần 3 món là manual |
| FR-06 Tạo Checklist | manual: kế hoạch rỗng → COPY-07; xem trước; ghi đè | manual | — |
| FR-07 Sửa Checklist | harness: BR-15/16 gián tiếp qua `save_active_checklist` payload | manual | tiến độ, meal view (**defer — DEC-041**) |
| FR-08 Hoàn tất | harness: 6 check `complete_shopping` (happy, retry bị chặn, thiếu ngày, from>to, rỗng, rollback khi trigger raise) | harness | — |
| FR-09 Lịch sử | harness: BR-07 (không UPDATE được) | manual | xoá 1 snapshot trên UI |

## 2. Quy tắc nghiệp vụ

| ID | Đã kiểm bằng | Trạng thái |
|---|---|---|
| BR-01 Cách ly dữ liệu | harness: B đọc 0 row; B insert row của A → RLS error; B delete → 0 row; `anon` bị chặn | harness |
| BR-02 Trường bắt buộc | manual: tên toàn khoảng trắng → "Tên không được để trống." | manual |
| BR-03 Tên duy nhất | harness: `THỊT   BÒ ` vs `Thịt bò` → unique violation (index trên `lower(regexp_replace(btrim()))`) | harness |
| BR-04.1 Chặn xoá khi đang dùng | harness: FK `RESTRICT` (meal_ingredients, weekly_plan_meals, weekly_plan_products) | harness |
| BR-04.2 Ingredient đang thuộc món | harness: delete → `violates RESTRICT setting` | harness |
| BR-04.3 Giữ occurrence khi xoá nguồn | harness: xoá ingredient qua RPC → occurrence còn, `source_ingredient_id = NULL`, `checked` giữ nguyên | harness |
| BR-04.4 Xoá Meal khi Checklist còn placement | không có FK từ checklist → header là text snapshot | manual |
| BR-05.1–.2 Placement tách nhóm | manual: cùng món 2 ngày → 2 nhóm, đếm đúng | manual |
| BR-05.3 Checkbox độc lập theo placement | manual | manual (meal view defer — DEC-041) |
| BR-05.4 Duplicate occurrence | manual | manual |
| BR-05.5 Món tự hoàn tất | manual | manual |
| BR-05.6 Không auto-sync | manual: tick → lưu plan → checklist không đổi | manual |
| BR-05.7/.8 Ghi đè cần xác nhận | manual: chọn Không → giữ nguyên | manual |
| BR-06 Kế hoạch rỗng | manual | manual |
| BR-07 Snapshot bất biến | harness: UPDATE → 0 row (không policy UPDATE) | harness |
| BR-08 Kiểm tra ngày | harness: check `date_from <= date_to` + RPC raise | harness |
| BR-09 Trực tuyến | manual: ngắt mạng → lỗi, có rollback UI | manual |
| BR-10 Danh mục cố định | harness: `'Rác'` → `invalid input value for enum` | harness |
| BR-11 Khoảng ngày là metadata | manual | manual |
| BR-12 Đặt lại giữ Checklist | manual | manual |
| BR-13 Thành phần món | harness: chèn trùng cặp (meal, ingredient) → duplicate key | harness |
| BR-14 Lượt đặt | harness: trùng ngày → unique; position 4 → check | harness |
| BR-15 Xoá occurrence | manual | manual |
| BR-16 Sửa hiển thị | manual | manual |
| BR-17 Xoá snapshot | manual: xoá 1 → Không/Có | manual |
| BR-18 Kết thúc Checklist | manual | manual |

## 3. Phi chức năng

| ID | Đã kiểm bằng | Trạng thái |
|---|---|---|
| NFR-01 Responsive | QA 390×844, 384×854, desktop (DEC-034) — ghi trong TASK-024 cũ, chưa có script | manual |
| NFR-02 Bảo mật | harness (RLS 10 bảng + anon bị chặn) + `04` §2.4 | **partial** — còn thiếu gọi PostgREST bằng publishable key dưới 2 user thật (issue #6) |
| NFR-03 Toàn vẹn | harness: 8 ràng buộc DB (unique/check/FK/enum) | harness |
| NFR-04 Lịch sử nhất quán | harness: BR-07 | harness |
| NFR-05 Vận hành đơn giản | kiến trúc: 1 frontend + Supabase, không backend (`04` §2.3) | manual |

## 4. Tổng hợp

- **9** yêu cầu chức năng: 4 `harness`, 5 `manual`.
- **18** quy tắc nghiệp vụ (25 dòng chi tiết): **10 `harness`**, 15 `manual`.
- **5** NFR: 1 `harness`, 1 `partial`, 3 `manual`.
- **0 `missing`** ở mức "không có cách kiểm" — điểm còn hở duy nhất là **NFR-02 phần PostgREST** (issue #6) và **meal view** (defer, DEC-041).

## 5. Cách chạy lại

```sh
# cần: npm i @electric-sql/pglite (một lần, ngoài repo)
node auren-migrations-verify.mjs        # 35 check: 10 migration + RPC + ràng buộc + RLS
```

Script hiện nằm ngoài repo (`/opt/data/reports/`). Đưa vào CI là issue #5; khi đó `06` này chuyển hẳn sang trạng thái sinh tự động.
