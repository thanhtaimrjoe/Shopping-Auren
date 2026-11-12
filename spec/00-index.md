---
id: spec-index
status: approved
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
---

# 00 — Spec index & quy ước

Nguồn sự thật duy nhất của dự án là **thư mục `spec/` này**. Notion, `docs/`, README và backlog cũ đã đóng băng — xem `_legacy/`.

## Đọc theo thứ tự này

| # | File | Trả lời câu hỏi | Trạng thái |
|---|---|---|---|
| 00 | `00-index.md` | Quy ước, nơi tìm thứ gì | approved |
| 01 | `01-product.md` | Vì sao có app, cho ai, phạm vi | approved |
| 02 | `02-behavior.md` | **App phải hành xử thế nào** (FR/BR/NFR/UC) | approved |
| 03 | `03-ui-contract.md` | Màn hình, thành phần, câu chữ hiển thị | draft |
| 04 | `04-data-contract.md` | Bảng, cột, RLS, RPC, ràng buộc | *P3 — chưa tạo* |
| 05 | `05-decisions.md` | Quyết định & lịch sử thay thế | *P3 — chưa tạo* |
| 06 | `06-verification.md` | Mỗi yêu cầu được kiểm chứng bằng gì | *P3 — chưa tạo* |
| 07 | `07-operations.md` | Chạy, deploy, migration, sự cố | *P3 — chưa tạo* |
| 08 | `08-gaps.md` | Code lệch spec ở đâu, xử lý thế nào | approved |
| — | `../AGENTS.md` | Hợp đồng làm việc cho AI agent | approved |

## Trước khi sửa code

1. `01` để biết việc đó có thuộc phạm vi không.
2. `02` để biết hành vi đúng; `03` nếu đụng giao diện; `04` nếu đụng DB.
3. Không tìm thấy ID nào cho việc mình sắp làm → dừng, mở issue `question`.

## ID — bất biến, không đánh số lại

| Prefix | Nghĩa | Nhà | Ghi chú |
|---|---|---|---|
| `FR-xx` | Yêu cầu chức năng | `02` | FR-01…FR-09 |
| `BR-xx.y` | Quy tắc nghiệp vụ | `02` | quy tắc chi tiết; FR chỉ tham chiếu |
| `NFR-xx` | Yêu cầu phi chức năng | `02` | NFR-01…NFR-05 |
| `UC-xx` | Luồng sử dụng | `02` | tóm tắt, không lặp quy tắc |
| `SC-xx` | Màn hình | `03` | SC-01…SC-08 |
| `CMP-xx` | Thành phần | `03` | CMP-01…CMP-20 |
| `COPY-xx` | Chuỗi hiển thị chốt | `03` | sinh ra `src/lib/copy.ts` |
| `DEC-xxx` | Quyết định | `05` | append-only, có `supersedes` |
| `AUR-xx` | Finding audit | `08` | gap as-built; đóng bằng fix/accept/defer |
| `ISSUE-#` | Việc cần làm | GitHub Issues | không nằm trong repo |

Quy tắc: **không tái sử dụng số, không đổi số** khi gộp tài liệu. Bảng "ID cũ ở đâu" nằm ở cuối mỗi file.

## Trạng thái

`draft` → `approved` → (`superseded` | `withdrawn`).

Vì PO chỉ can thiệp ở tầng business, mỗi mục có thêm:

- `decided_by: PO` — PO quyết (business: phạm vi, hành vi người dùng thấy, dữ liệu nghiệp vụ).
- `decided_by: AI-delegated` — AI quyết trong quyền được giao (kỹ thuật, cấu trúc tài liệu, cách hiện thực hành vi đã chốt). **PO có quyền override bất cứ lúc nào** bằng một DEC mới.

AI **không** được tự đánh `decided_by: PO`.

## Ba luật không được vi phạm

1. **Một quy tắc, một nhà.** Chỗ khác chỉ viết `Xem BR-05.3`.
2. **Quyết định là append-only.** Sửa lịch sử = DEC mới + `supersedes`.
3. **Trạng thái cần bằng chứng.** `approved` = đã merge PR đụng file đó. Task `done` = có link commit/CI/log.

## Bản đồ di trú (tài liệu cũ → file mới)

| Tài liệu cũ | Nay ở |
|---|---|
| Project Brief, BRD §1–2, §6 | `01-product.md` |
| BRD §3–5, BRD Phụ lục, SRS §1–6, §9 | `02-behavior.md` |
| SRS §4 (danh mục) | `02-behavior.md` §4 + `DEC-040` |
| Screen Specification, Component Specification, SRS §11 (copy) | `03-ui-contract.md` (P3) |
| Conceptual Data Model, `SUPABASE_PHYSICAL_SCHEMA_CONTRACT.md` | `04-data-contract.md` (P3) |
| Decision Log DEC-001…039 | `05-decisions.md` (P3) |
| SRS §10, kịch bản kiểm thử | `06-verification.md` (P3) |
| Working Agreement, AI Working Guideline, UI Revision Log | `AGENTS.md` + `07-operations.md` (P3) |
| `RELEASE_READINESS_REPORT.md`, `SOURCE_OF_TRUTH_SYNC.md` | archive — không còn hiệu lực |
| Notion (17 trang + 3 DB) | archive read-only; không dùng làm nguồn |
| Task Backlog (Notion) | GitHub Issues |

## Định nghĩa "xong" cho một thay đổi spec

- Đúng 1 file quy phạm bị sửa (trừ khi thay đổi xuyên FR/BR → thêm DEC).
- PR body có `Spec-Impact: none | <ID…>`.
- Nếu là thay đổi hành vi: có DEC + dòng `Kiểm chứng:` trong `02`.
- Nếu là thay đổi kỹ thuật: chỉ cần `Spec-Impact: none` + test.
