# Báo cáo Đồng bộ Source-of-Truth & Dọn dẹp Baseline (TASK-016)

**Mã task:** TASK-016  
**Loại:** Quy trình & Tài liệu kiến trúc (Process)  
**Mức độ ưu tiên:** P1  
**Trạng thái:** Hoàn tất (Ready for PO Review / Done)  

---

## 1. Bối cảnh & Vấn đề tồn đọng trước đây

Trước giai đoạn triển khai MVP, hệ thống tài liệu và mã nguồn gặp 3 điểm lệch:
1. **Đường dẫn repo trong tài liệu Mock Data:** Trang *Frontend Mock Data* trên Notion trước đây ghi nguồn seed là `/Users/yano9920/Documents/Shopping-Auren/src/lib/mock-data.ts` (đường dẫn macOS cục bộ của tác giả cũ).
2. **Cơ chế lưu trữ dữ liệu:** Dự án ban đầu dự kiến dùng file mock in-memory hoặc backend Render, nhưng theo quyết định **DEC-035 (Q-035)** của PO, MVP chuyển sang kiến trúc kết nối trực tiếp Supabase Auth và Data API (PostgREST). File `src/lib/mock-data.ts` đã được dỡ bỏ hoàn toàn ở commit `c23b81a`.
3. **Nhật ký phiên bản giao diện (UI Revision Log):** Chưa ghi nhận các mốc bàn giao thực tế của giao diện đang chạy trên production.

---

## 2. Các nội dung đã đồng bộ và chuẩn hóa

### 2.1. Chuẩn hóa nguồn dữ liệu chính thức
* **Đường dẫn chuẩn:** Repository chính thức tại `https://github.com/thanhtaimrjoe/Shopping-Auren.git` (nhánh `main`).
* **Dữ liệu mẫu (Seed Data):** Toàn bộ 37 nguyên liệu, 28 món ăn, 91 sản phẩm từ Notion đã được chuyển đổi thành migration SQL quan hệ chính thức tại `supabase/migrations/20261030170159_import_notion_seed_user.sql`.
* Không còn phụ thuộc vào bất kỳ file mock in-memory nào trong runtime của ứng dụng.

### 2.2. Đồng bộ Nhật ký phiên bản giao diện (UI Revision Log)
Ghi nhận 3 đợt cập nhật lớn của giao diện MVP:
* **UI-01 (Foundation & Design System):** Thiết lập palette Warm Natural (`--ivory #F7F5EF`, `--moss #2E4036`, `--terracotta #C35A38`), font Manrope + Lora, layout 4 tab chính (Weekly Plan, Checklist, Library, Settings).
* **UI-02 (Xác thực & Bản địa hóa):** Thiết kế lại màn hình đăng nhập theo luồng 2 bước kiểu iCloud (Email $\rightarrow$ Password), bổ sung tìm kiếm nguyên liệu, chuẩn hóa 100% nhãn giao diện sang tiếng Việt.
* **UI-03 (Khả năng tiếp cận & Tinh chỉnh kích thước):** Nâng cấp typography trên mobile (384px - 390px), đảm bảo độ tương phản WCAG AA cho secondary copy, hỗ trợ phím tắt `Escape` và nút bỏ qua tới nội dung chính (`skip to main content`).

### 2.3. Trạng thái tuân thủ quy ước
* **Tài liệu song ngữ:** Đã bổ sung `docs/GLOSSARY_BILINGUAL.md` làm từ điển đối chiếu chuẩn hóa.
* **Tương thích:** 100% tuân thủ BRD chính thức, Screen Specification và Component Specification.
