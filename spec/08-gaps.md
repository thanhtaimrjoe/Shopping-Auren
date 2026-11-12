---
id: spec-gaps
status: approved
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
---

# 08 — Lệch giữa as-built và as-specified

Mỗi dòng = một chỗ code/dữ liệu **khác** với `02-behavior` (hoặc khác với tài liệu cũ trước khi hợp nhất). Cột **Quyết định** chỉ có 3 giá trị:

- `fix` — code phải sửa theo spec (có issue).
- `accept` — chấp nhận hành vi hiện tại, cập nhật spec (có DEC).
- `defer` — hoãn có chủ đích, ghi rõ mốc (có DEC).

Bằng chứng chi tiết: `_legacy/audit-2026-11-12.md` (audit 2026-11-12, readback Supabase thật).

| ID | Mức | Lệch gì | Spec | Quyết định | Theo dõi |
|---|---|---|---|---|---|
| AUR-01 | P0 | Migration trong repo dùng `meal.id` → RPC `save_shopping_data` lỗi với mọi payload; prod đã được vá bằng migration không có trong repo | không đổi hành vi | fix | #1 |
| AUR-15 | P1 | Repo thiếu 2 migration đang chạy trên prod (`20261031011716`, `20261101082901`), 1 migration lệch version (`20261031121500` vs `20261101040902`) | — | fix | #1 |
| AUR-02 | P1 | 7 danh mục (Thực phẩm, Đồ uống) vs spec cũ 5 danh mục, không có Q/DEC | BR-10, `02` §4 | accept | DEC-040 |
| AUR-03 | P1 | Hoàn tất mua sắm = 2 request rời, không toàn vẹn | FR-08 | fix | #2 |
| AUR-04 | P1 | Kéo–thả món sang ngày đã có nó → phá BR-14 và làm hỏng cả lần lưu | BR-14, FR-05 | fix | #3 |
| AUR-05 | P1 | Không có chế độ xem theo món; TASK-022 vẫn đánh Done | FR-07, BR-05.3 | defer | DEC-041 |
| AUR-06 | P1 | `RELEASE_READINESS_REPORT.md` khai TASK-029 Done/GO-LIVE trong khi backlog Draft 0% | — | accept | đã chuyển vào `_legacy/` |
| AUR-07 | P2 | Bằng chứng "lưu 26 items" đúng trên prod nhưng không tái lập được từ repo | — | fix | #1 |
| AUR-08 | P2 | Seed migration gắn cứng UUID user production + dữ liệu cá nhân trong repo | `07` (P3) | fix | #7 |
| AUR-09 | P2 | Copy rải rác, lệch câu chữ spec cũ; product picker không disable khi chọn 0 | FR-05, FR-06 | fix | #8 |
| AUR-10 | P2 | Chức năng "Xóa Checklist" không có trong spec cũ | BR-18 | accept | DEC-043 |
| AUR-11 | P2 | Validation im lặng (tên toàn khoảng trắng, thiếu ngày) | BR-02 | fix | #9 |
| AUR-12 | P2 | Sửa danh mục occurrence chỉ lưu với Product | BR-16 | fix | #10 |
| AUR-13 | P2 | Lưu lỗi không rollback UI; message che nguyên nhân | BR-09 | fix | #9 |
| AUR-14 | P3 | `tsc --noEmit` fail khi chưa `next build` | `07` (P3) | fix | #11 |

## Ghi chú trạng thái (không phải lỗi code)

Các task dưới đây được Notion đánh `Done` nhưng DoD chưa đạt, hoặc ngược lại. Từ nay trạng thái task chỉ nằm ở GitHub Issues; bảng này giữ lại để truy vết.

| Task cũ | Trạng thái Notion | Thực tế |
|---|---|---|
| TASK-022 | Done 100% | Thiếu chế độ xem theo món (AUR-05) |
| TASK-023 | In Progress 90% | Phần UI library/settings/auth đã chạy trên prod |
| TASK-026, TASK-028 | Draft 0% | Một phần đã hiện thực (auth, plan, checklist) |
| TASK-029 | Draft 0% | `RELEASE_READINESS_REPORT` khai Done — sai |
| TASK-025 | Done (2 task cùng ID) | Trùng ID: 1 là cập nhật spec, 1 là thiết kế schema |

## Đã đóng trong chính đợt refactor này

- **AUR-06**: `docs/*` → `spec/_legacy/repo-docs/`; `docs/RELEASE_READINESS_REPORT.md` và `SOURCE_OF_TRUTH_SYNC.md` không còn ở vị trí quy phạm.
- **Trùng ID TASK-025**: backlog chuyển sang Issues, ID mới do GitHub cấp.
- **3 nguồn sự thật**: Notion đóng băng (DEC-044); DB là nguồn cho `04` (P3).
