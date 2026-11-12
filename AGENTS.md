<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Hợp đồng làm việc — Shopping-Auren

## Trước khi sửa bất kỳ dòng code nào

1. `spec/00-index.md` — quy ước, nơi tìm thứ gì.
2. `spec/01-product.md` — việc này có thuộc phạm vi MVP không.
3. `spec/02-behavior.md` — hành vi đúng; `spec/03-ui-contract.md` nếu đụng UI; `spec/04-data-contract.md` nếu đụng DB.
4. Xác định ID (`FR-xx`, `BR-xx.y`, `DEC-xxx`, `COPY-xx`) liên quan. **Không tìm được ID nào → dừng, mở issue `question`.**

## Phân quyền (chốt 2026-11-12, DEC-044)

- **PO quyết ở tầng business:** phạm vi, hành vi người dùng thấy, dữ liệu nghiệp vụ. PO không audit chi tiết kỹ thuật.
- **AI quyết kỹ thuật và cấu trúc**, ghi lại bằng `DEC` với `decided_by: AI-delegated`. PO có quyền override bất cứ lúc nào.
- AI **không** được: ghi `decided_by: PO`, tự đánh dấu task `done`, tuyên bố "đã kiểm chứng" mà không có output thật.

## Khi mở PR

- Tiêu đề: `<ID hoặc AUR-xx>: <mô tả ngắn>`.
- Body bắt buộc có dòng `Spec-Impact: none` hoặc `Spec-Impact: FR-05, BR-14`.
- Đổi hành vi mà không có DEC → PR bị từ chối. Đổi kỹ thuật thuần → `Spec-Impact: none` + test.
- Merge = PO approve. Không tự merge vào `main`.

## Cấm

- Đổi số / tái sử dụng ID; đánh số lại khi gộp tài liệu.
- Sửa câu chữ của `DEC` cũ — thay bằng DEC mới + `Supersedes`.
- Xoá hay sửa nội dung trong `spec/_legacy/` (chỉ đọc).
- Thêm chuỗi UI mới ngoài bảng `COPY-xx` (từ P3).
- Tạo migration trên Supabase mà không có file tương ứng trong `supabase/migrations/`.
- Viết báo cáo tự khai kiểu `RELEASE_READINESS` — dùng GitHub Issue + link evidence.

## Báo cáo tiến độ

- Mỗi tuyên bố "xong" phải kèm lệnh đã chạy + output, hoặc link CI/commit.
- Nêu ID yêu cầu, không mô tả bằng cảm nhận.
- Nếu bị chặn: nói rõ chặn ở đâu, cần gì để mở (key, quyền, quyết định nào).

## Stack

- Next.js 16 App Router, React 19, TypeScript, CSS global + `next/font` (Manrope/Lora), `lucide-react`.
- Supabase Auth + Data API gọi trực tiếp từ browser bằng publishable key (DEC-035); RLS là hàng rào dữ liệu.
- Deploy Vercel; DB Supabase project `mpuxleglzmoaexdjgerp`.

