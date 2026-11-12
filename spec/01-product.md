---
id: spec-product
status: approved
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
sources: [Project Brief (archive), BRD §1–2 §6, SRS §1, DEC-035, DEC-037, DEC-039]
---

# 01 — Sản phẩm

## 1. Vì sao có app này

Yano ghi chú thủ công việc đi chợ và lên thực đơn tuần; việc nối "kế hoạch tuần" với "danh sách cần mua" không thuận tiện. Shopping-Auren là **công cụ cá nhân** để: quản lý thư viện món ăn / nguyên liệu / đồ dùng, lập kế hoạch tuần, tạo danh sách đi chợ và xem lại lịch sử mua sắm.

Đây **không** phải sản phẩm thương mại:

- Không có KPI doanh thu, không nghiên cứu thị trường, không phát hành app store (DEC-037).
- URL deploy có thể công khai, nhưng phải đăng nhập và dữ liệu tách theo tài khoản (DEC-039).
- Đồng thời là case học tập BrSE của PO: mục tiêu học tập **không** đổi hành vi sản phẩm.

## 2. Người dùng

- **Một người dùng chính: PO.** Không có mô hình hộ gia đình, không chia sẻ nhiều tài khoản.
- Một tài khoản dùng chung trên điện thoại và máy tính.
- Web responsive, ưu tiên thao tác trên điện thoại; desktop dùng được; tablet chưa làm (DEC-034: QA trên 390×844 và 384×854 CSS px).

## 3. Phạm vi MVP — trong

| Nhóm | Nội dung | ID |
|---|---|---|
| Tài khoản | Đăng ký / đăng nhập / đăng xuất bằng email + mật khẩu (Supabase Auth) | FR-01 |
| Thư viện | CRUD Nguyên liệu, Món ăn, Sản phẩm | FR-02, FR-03, FR-04 |
| Kế hoạch tuần | Sa bàn 7 ngày (thứ Hai → Chủ nhật), tối đa 3 món/ngày, danh sách sản phẩm chung | FR-05 |
| Checklist | Xem trước, tạo phiên mua sắm, tick/bỏ tick, thêm/xoá/sửa mục, tiến độ | FR-06, FR-07 |
| Hoàn tất | Nhập "Từ ngày"–"Đến ngày", lưu snapshot bất biến | FR-08 |
| Lịch sử | Danh sách snapshot, xem read-only, xoá từng snapshot | FR-09 |

## 4. Phạm vi MVP — ngoài (không làm, không suy diễn)

- Offline, tự đồng bộ khi có mạng, real-time sync, xử lý xung đột nhiều thiết bị.
- Ảnh sản phẩm, giá tiền, số lượng, quy đổi đơn vị, ngân sách.
- Thông báo / nhắc nhở.
- Chia sẻ danh sách cho tài khoản khác; hộ gia đình nhiều người.
- Đăng nhập mạng xã hội, app native, phát hành app store.
- Hơn 3 món/ngày.
- Xác minh email, quên/đặt lại mật khẩu (cân nhắc sau MVP).
- Profile: chỉ là nhãn/placeholder, **không** có màn hình hay chức năng (DEC-031).
- Quản lý danh mục sản phẩm như một đối tượng CRUD.

## 5. Ràng buộc kỹ thuật đã chốt (không phải yêu cầu kinh doanh)

- Next.js 16 App Router + TypeScript + React 19, deploy Vercel (DEC-032).
- Supabase Auth + Postgres + RLS; **frontend gọi trực tiếp Supabase Data API**, không có backend Render trong MVP (DEC-035).
- Publishable key ở client; không bao giờ dùng service-role key ở frontend.
- Một môi trường dev/prod duy nhất trên Supabase; schema quản lý bằng migration trong repo.
- Không có công cụ test chuyên dụng (DEC-032) → kiểm chứng thủ công + script trong repo; xem `06` (P3).

## 6. Tiêu chí thành công (đúng nghĩa "dùng được")

1. PO mở app trên điện thoại, lên thực đơn tuần, tạo danh sách và đi chợ **không cần ghi chú giấy**.
2. Dữ liệu còn nguyên sau khi tải lại trang và sau khi đổi thiết bị (cùng tài khoản).
3. Không mất dữ liệu, không tạo bản ghi trùng khi thao tác sai hoặc mạng chập chờn.
4. Lịch sử mua sắm đọc lại được đúng trạng thái tại thời điểm hoàn tất.

## 7. Giả định

- PO chấp nhận nhập liệu thủ công; không cần import/export.
- Dữ liệu là của cá nhân PO; không có yêu cầu lưu trữ/pháp lý.
- Không có nhu cầu đa ngôn ngữ: giao diện tiếng Việt.
