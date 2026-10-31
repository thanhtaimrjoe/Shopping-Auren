# Bảng thuật ngữ song ngữ ứng dụng Shopping-Auren (Bilingual App Terms & Glossary)

Tài liệu chuẩn hóa các thuật ngữ, nhãn giao diện (UI labels), danh mục và thông báo lỗi song ngữ **Tiếng Anh (English) — Tiếng Việt (Vietnamese)** của ứng dụng Shopping-Auren. Tài liệu này dùng làm căn cứ đồng bộ cho Notion (Glossary / Screen Spec), thiết kế giao diện và kiểm thử.

---

## 1. Khái niệm cốt lõi (Core Concepts & Entities)

| Thuật ngữ Tiếng Anh | Bản dịch / Nhãn Tiếng Việt | Mô tả / Ngữ cảnh sử dụng |
| :--- | :--- | :--- |
| **Weekly Plan** | Kế hoạch tuần | Kế hoạch bữa ăn và sản phẩm dự kiến trong 7 ngày (từ Thứ Hai đến Chủ Nhật). |
| **Active Checklist** | Danh sách mua sắm đang hoạt động | Danh sách hàng hóa cần mua trong phiên đi chợ/mua sắm hiện tại, được tạo từ Weekly Plan hoặc thêm thủ công. |
| **Library** | Thư viện | Kho dữ liệu mẫu gồm nguyên liệu, món ăn và sản phẩm tiêu dùng định kỳ của người dùng. |
| **History** | Lịch sử | Lưu trữ các bản ghi (snapshots) của những lần mua sắm đã hoàn tất. |
| **Snapshot** | Bản ghi mua sắm / Ảnh chụp lịch sử | Bản ghi chỉ đọc của một phiên mua sắm đã kết thúc tại một thời điểm nhất định. |
| **Meal** | Món ăn | Một món ăn được người dùng đặt tên, bao gồm tập hợp các nguyên liệu liên kết. |
| **Ingredient** | Nguyên liệu | Thành phần thực phẩm dùng để nấu các món ăn (ví dụ: thịt bò, sườn heo, cà chua, v.v.). |
| **Product** | Sản phẩm | Mặt hàng tiêu dùng gia đình hoặc đồ dùng cá nhân được phân theo danh mục. |
| **Category** | Danh mục | Nhóm phân loại dành cho các sản phẩm tiêu dùng định kỳ. |
| **Weekday** | Ngày trong tuần | Các ngày từ Thứ Hai đến Chủ Nhật (Monday – Sunday). |

---

## 2. Danh mục sản phẩm (Product Categories)

| English Term | Tiếng Việt chuẩn hóa | Ghi chú & Ví dụ |
| :--- | :--- | :--- |
| **Home Care / Cleaning** | Vệ sinh nhà cửa | Nước lau sàn, nước rửa chén, bột giặt, viên tẩy bồn cầu... |
| **Paper & Disposables** | Giấy và đồ dùng một lần | Giấy vệ sinh, khăn giấy ướt, màng bọc thực phẩm, túi rác... |
| **Personal Care** | Chăm sóc cá nhân | Dầu gội, sữa tắm, kem đánh răng, dao cạo râu... |
| **Household Supplies** | Đồ dùng gia đình | Pin tiểu, bóng đèn, băng keo, dụng cụ lau bếp... |
| **Other / Miscellaneous** | Khác | Các vật dụng hoặc sản phẩm không thuộc 4 danh mục trên. |

---

## 3. Điều hướng & Thanh tác vụ chính (Navigation & Shell)

| English | Tiếng Việt | Vị trí / Ý nghĩa |
| :--- | :--- | :--- |
| **Weekly Plan** | Kế hoạch tuần | Tab số 1 trên thanh điều hướng chính. |
| **Shopping Checklist** | Danh sách mua sắm | Tab số 2 trên thanh điều hướng chính. |
| **Library** | Thư viện | Tab số 3 trên thanh điều hướng chính. |
| **Settings** | Cài đặt | Tab số 4 trên thanh điều hướng chính (quản lý tài khoản & lịch sử). |
| **Skip to main content** | Bỏ qua tới nội dung chính | Nút trợ năng (a11y) ẩn cho người dùng bàn phím. |
| **Your Space** | Không gian của bạn | Khẩu hiệu/tiêu đề phân vùng ứng dụng cá nhân. |
| **Sign Out** | Đăng xuất | Thao tác kết thúc phiên làm việc tài khoản Supabase. |

---

## 4. Màn hình Kế hoạch tuần (Weekly Plan Screen)

| English | Tiếng Việt | Mô tả |
| :--- | :--- | :--- |
| **Current Week** | Tuần hiện tại | Tiêu đề khối lập kế hoạch 7 ngày. |
| **Reset template** | Đặt lại mẫu | Xóa các lựa chọn món ăn & sản phẩm trong tuần để lên lại từ đầu. |
| **Generate checklist** | Tạo danh sách | Tạo phiên mua sắm mới từ kế hoạch tuần đã chọn. |
| **No meals planned** | Chưa có món ăn | Trạng thái rỗng khi ngày đó chưa có món nào. |
| **Add meal** | Thêm món ăn | Mở hộp thoại chọn món từ thư viện vào ngày trong tuần. |
| **Select products** | Chọn sản phẩm | Mở hộp thoại chọn sản phẩm định kỳ cần mua trong tuần. |
| **Selected for this week** | Được chọn cho tuần này | Nhãn hiển thị số lượng sản phẩm tuần đã tích lũy. |
| **No products selected** | Chưa có sản phẩm nào được chọn | Trạng thái rỗng của khối sản phẩm tuần. |

---

## 5. Màn hình Danh sách mua sắm (Checklist Screen)

| English | Tiếng Việt | Mô tả |
| :--- | :--- | :--- |
| **Active shopping list** | Danh sách đang hoạt động | Phiên đi chợ đang diễn ra. |
| **Complete shopping** | Hoàn tất mua sắm | Nút chốt phiên mua sắm và lưu bản ghi vào Lịch sử. |
| **In progress** | Đang tiến hành | Trạng thái tiến độ mua sắm (số mục đã tích / tổng số mục). |
| **All items** | Tất cả mục | Tab hoặc bộ lọc hiển thị toàn bộ danh sách cần mua. |
| **Add item** | Thêm | Thêm nhanh nguyên liệu, sản phẩm hoặc mục tự do vào checklist. |
| **No active checklist** | Chưa có danh sách đang hoạt động | Màn hình rỗng hướng dẫn tạo checklist từ Kế hoạch tuần. |

---

## 6. Màn hình Thư viện (Library Screen)

| English | Tiếng Việt | Mô tả |
| :--- | :--- | :--- |
| **Ingredients tab** | Nguyên liệu | Quản lý danh mục các nguyên liệu nấu ăn. |
| **Meals tab** | Món ăn | Quản lý món ăn và công thức nguyên liệu kèm theo. |
| **Products tab** | Sản phẩm | Quản lý sản phẩm tiêu dùng định kỳ kèm phân loại danh mục. |
| **Add new...** | Thêm mới... | Nút mở modal thêm nguyên liệu, món ăn hoặc sản phẩm mới. |
| **Search library** | Tìm kiếm trong thư viện | Ô tìm kiếm lọc theo tên nguyên liệu/món/sản phẩm. |
| **No matching results** | Không có kết quả phù hợp | Khi từ khóa tìm kiếm không trả về bản ghi nào. |

---

## 7. Màn hình Cài đặt & Lịch sử (Settings & History Screen)

| English | Tiếng Việt | Mô tả |
| :--- | :--- | :--- |
| **Supabase Account** | Tài khoản Supabase | Khu vực hiển thị thông tin tài khoản đang đăng nhập. |
| **Synced data** | Dữ liệu đồng bộ | Lưu trữ an toàn trên Supabase, riêng tư theo từng tài khoản (RLS). |
| **Shopping history** | Lịch sử | Danh sách các lần mua sắm đã hoàn tất trước đây. |
| **Completed records** | Bản ghi mua sắm đã hoàn tất | Các snapshot chỉ đọc lưu thời gian và danh sách hàng đã mua. |
| **View record** | Xem | Mở modal xem lại chi tiết một bản ghi mua sắm trong quá khứ. |
| **Delete record** | Xóa bản ghi | Xóa vĩnh viễn một bản ghi khỏi Lịch sử sau khi xác nhận. |
| **No history yet** | Chưa có lịch sử | Trạng thái rỗng khi người dùng chưa từng hoàn tất phiên mua sắm nào. |

---

## 8. Màn hình Đăng nhập / Xác thực (Authentication Modal)

| English | Tiếng Việt | Mô tả |
| :--- | :--- | :--- |
| **Welcome** | CHÀO MỪNG BẠN | Tiêu đề chào mừng trên giao diện 2 bước iCloud style. |
| **Email address** | Email | Trường nhập địa chỉ email tài khoản. |
| **Continue** | Tiếp tục | Chuyển từ bước nhập email sang bước nhập mật khẩu. |
| **Change email** | Đổi | Quay lại sửa email mà không làm mất thông tin đã điền. |
| **Password** | Mật khẩu | Trường nhập mật khẩu an toàn. |
| **Sign In** | Đăng nhập | Nút thực hiện xác thực phiên làm việc. |
| **Sign Up** | Đăng ký | Nút tạo tài khoản mới nếu chưa đăng ký. |

---

## 9. Bảng mã thông báo lỗi hệ thống (System & Supabase Error Messages)

| Mã lỗi / Mẫu gốc (English) | Thông báo Tiếng Việt chuẩn hóa | Ngữ cảnh |
| :--- | :--- | :--- |
| **Invalid login credentials / wrong password** | Email hoặc mật khẩu không đúng. | Đăng nhập thất bại. |
| **User already registered** | Email này đã được đăng ký. Hãy đăng nhập. | Đăng ký tài khoản đã tồn tại. |
| **Email not confirmed** | Email chưa được xác nhận. Kiểm tra hộp thư để xác nhận rồi đăng nhập. | Tài khoản chưa xác minh email. |
| **Password is too weak / under 6 chars** | Mật khẩu cần có ít nhất 6 ký tự. | Đăng ký hoặc đổi mật khẩu ngắn. |
| **Rate limit / too many requests** | Bạn đã thử quá nhiều lần. Vui lòng thử lại sau. | Chặn brute-force / DDoS. |
| **Failed to fetch / network error** | Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại. | Mất mạng hoặc máy chủ không phản hồi. |
| **Authentication required / JWT expired** | Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại. | Token xác thực Supabase hết hạn. |
| **Not-null constraint violation** | Dữ liệu gửi lên không đủ thông tin bắt buộc. | Thiếu trường dữ liệu khi lưu. |
| **Unique constraint / duplicate key** | Dữ liệu bị trùng với dữ liệu đã có. | Trùng tên món, nguyên liệu, sản phẩm. |
| **Row-level security policy violation** | Tài khoản này không được phép thực hiện thao tác đó. | Vi phạm bảo mật phân quyền RLS. |
| **Invalid shopping data payload** | Dữ liệu kế hoạch không hợp lệ. | Payload lưu RPC bị lỗi định dạng. |
