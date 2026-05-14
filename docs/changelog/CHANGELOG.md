# Changelog — Shopping Memo

**プロジェクト**: Shopping Memo  
**目的**: 開発変更履歴 của dự án

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
