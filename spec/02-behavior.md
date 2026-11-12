---
id: spec-behavior
status: approved
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
sources: [BRD §2–5, BRD Phụ lục A/B, SRS §2–6 §9, DEC-001…DEC-043]
---

# 02 — Hành vi hệ thống

Đây là **nơi duy nhất** định nghĩa hành vi. Mọi tài liệu khác tham chiếu ID ở đây, không mô tả lại.

Mỗi yêu cầu có dòng `Kiểm chứng:` — cách chứng minh nó đúng. `manual:` nghĩa là chưa có test tự động (xem `06`).

---

## 1. Nguyên tắc nền

1. **Dữ liệu thuộc về một tài khoản.** Mọi bảng ứng dụng bảo vệ bằng RLS theo `auth.uid()`; người chưa đăng nhập không vào được khu vực nội bộ (BR-01).
2. **Không có backend riêng.** Frontend gọi trực tiếp Supabase Auth + Data API bằng publishable key (DEC-035).
3. **Chỉ một kế hoạch tuần hiện tại** và **tối đa một Checklist đang hoạt động** cho mỗi tài khoản.
4. **Checklist và Kế hoạch tuần là hai phiên độc lập.** Lưu kế hoạch không sửa Checklist; đặt lại kế hoạch không xoá Checklist (BR-05.6, BR-12).
5. **Snapshot là bất biến.** Sửa/xoá dữ liệu gốc không làm đổi lịch sử (BR-07).

---

## 2. Yêu cầu chức năng

### FR-01 — Tài khoản
Đăng ký, đăng nhập, đăng xuất bằng email + mật khẩu qua Supabase Auth. Chưa đăng nhập thì chỉ thấy màn hình xác thực. Đăng xuất kết thúc phiên hiện tại. Thông báo lỗi dùng nguyên văn `COPY-01`…`COPY-03`. Xác minh email và quên mật khẩu nằm ngoài MVP.
**Kiểm chứng:** manual: đăng ký email mới → đăng nhập → tải lại trang vẫn còn phiên; đăng xuất → về màn hình xác thực; nhập sai mật khẩu → đúng `COPY-01`.

### FR-02 — Nguyên liệu (Ingredient)
CRUD nguyên liệu độc lập trong thư viện; được phép tồn tại mà chưa thuộc món nào. Tên bắt buộc, duy nhất theo BR-03. Xoá tuân theo BR-04.
**Kiểm chứng:** manual: tạo 2 nguyên liệu cùng tên khác hoa/thường → bị chặn; xoá nguyên liệu đang thuộc 1 món → bị chặn kèm tên món.

### FR-03 — Món ăn (Meal)
CRUD món ăn: tên + danh sách nguyên liệu chọn từ thư viện bằng multi-select có tìm kiếm. Món **được phép** không có nguyên liệu. Hủy khi đang sửa không lưu thay đổi. Mỗi nguyên liệu xuất hiện tối đa một lần trong một món (BR-13). Thêm món vào kế hoạch tuần là thao tác riêng của FR-05.
**Kiểm chứng:** manual: tạo món 0 nguyên liệu (lưu được); sửa món, tick 2 nguyên liệu, huỷ → không đổi; tick trùng cùng nguyên liệu → không thể.

### FR-04 — Sản phẩm (Product)
CRUD sản phẩm gia dụng: tên + một danh mục bắt buộc từ danh sách cố định §4. Không có ảnh, không có CRUD danh mục. Tên duy nhất theo BR-03. Xoá tuân theo BR-04.
**Kiểm chứng:** manual: lưu sản phẩm thiếu danh mục → không thể; tên trùng → bị chặn.

### FR-05 — Kế hoạch tuần (Weekly Plan)
Sa bàn **7 cột cố định** thứ Hai → Chủ nhật, không gắn ngày thực tế, không chọn tuần. Mỗi ngày **tối đa 3 món**; một món **không được đặt 2 lần trong cùng ngày**, được đặt ở nhiều ngày (BR-14). Dưới sa bàn là danh sách sản phẩm chung đã chọn (dạng dọc, mỗi dòng có tên + danh mục + nút gỡ).

- **Chọn món:** modal liệt kê món trong thư viện, có tìm kiếm. Món không có nguyên liệu **không chọn được** và phải hiện `COPY-06`. Khi một ngày đã đủ 3 món, phải thông báo rõ giới hạn 3 món/ngày (không chỉ disable im lặng). Thư viện chưa có món → empty state hướng dẫn tạo món ở Thư viện. Đóng/huỷ modal không đổi kế hoạch.
- **Chọn sản phẩm:** modal có tìm kiếm theo tên + lọc danh mục (gồm "Tất cả"); lựa chọn tạm **giữ nguyên** khi đổi từ khoá/bộ lọc; sản phẩm đã có trong kế hoạch hiện "Đã thêm" và không chọn lại được; nút xác nhận hiển thị số đã chọn và **chỉ bật khi ≥1**; huỷ không lưu lựa chọn.
- **Gỡ món/sản phẩm:** chỉ gỡ khỏi kế hoạch, không xoá khỏi thư viện.
- **Đặt lại mẫu:** hộp thoại "Có/Không". Có → xoá trắng 7 ngày và toàn bộ sản phẩm đã chọn. Không → giữ nguyên. **Cả hai lựa chọn đều giữ nguyên Checklist đang hoạt động** (BR-12).
- **Lưu:** thay đổi kế hoạch không đồng bộ sang Checklist (BR-05.6).
**Kiểm chứng:** manual: thêm món thứ 4 vào một ngày → bị chặn + thông báo; kéo một món sang ngày đã có món đó → bị chặn (AUR-04); chọn 2 sản phẩm, đổi bộ lọc, xác nhận → đủ 2; bấm "Đặt lại mẫu" → Không → kế hoạch và Checklist không đổi.

### FR-06 — Tạo Checklist
Từ Checklist hiện tại: bấm tạo → **xem trước** nội dung sẽ tạo → xác nhận.

- Nguồn: mỗi **Meal placement** trong kế hoạch sinh một nhóm, mỗi nguyên liệu của món đó sinh **một occurrence riêng** (BR-05.1, BR-05.2); cộng mỗi sản phẩm đã chọn trong kế hoạch thành một occurrence (không lấy toàn bộ thư viện).
- Kế hoạch hoàn toàn rỗng (không món, không sản phẩm) → không tạo Checklist, báo lỗi `COPY-07`. Kế hoạch chỉ có sản phẩm vẫn tạo được.
- Đang có Checklist hoạt động → phải hỏi xác nhận ghi đè "Có/Không"; chỉ thay thế sau khi chọn Có; Không → giữ nguyên Checklist cũ (BR-05.7). Ghi đè thì trạng thái tick và mục phát sinh của phiên cũ **không** được giữ (BR-05.8). Snapshot đã lưu không bị ảnh hưởng.
- Mọi mục mới mặc định chưa mua.
- Mục phát sinh trực tiếp nằm trong nhóm hiển thị "Khác (phát sinh)".
- Sản phẩm trong Checklist được nhóm theo danh mục sản phẩm.
**Kiểm chứng:** manual: kế hoạch trống → báo `COPY-07`; kế hoạch có 2 món × 3 nguyên liệu + 4 sản phẩm → đếm đúng; tạo lần 2 khi đang có Checklist → hộp thoại ghi đè, chọn Không → Checklist giữ nguyên tick cũ.

### FR-07 — Sửa Checklist đang hoạt động
Trong Checklist, người dùng có thể:

- **Tick/bỏ tick** một occurrence. Trạng thái thuộc **đúng occurrence đó**; không chia sẻ giữa hai placement khác nhau, kể cả cùng món và cùng nguyên liệu (BR-05.3).
- **Thêm từ thư viện** (nguyên liệu hoặc sản phẩm): mỗi lần thêm tạo một occurrence riêng, **được phép trùng** (BR-05.4). Không sửa kế hoạch hay thư viện.
- **Thêm mục phát sinh:** item độc lập, nhãn nhóm "Khác (phát sinh)", không tạo entity trong thư viện, được phép trùng.
- **Xoá một occurrence:** chỉ xoá occurrence, không xoá bản ghi nguồn (BR-15).
- **Sửa tên hiển thị / danh mục** của một occurrence: chỉ áp dụng cho occurrence đó, không cập nhật thư viện (BR-16).
- **Tiến độ:** tổng số mục và % hoàn thành đếm **mọi item có thể tick** đang có (occurrence nguyên liệu theo placement, sản phẩm, mục thêm sau, mục phát sinh). **Không** tính Meal header. Mỗi occurrence tính riêng.
- **Hoàn tất món:** một Meal placement tự đánh dấu hoàn tất khi **tất cả** nguyên liệu của placement đó được tick; bỏ tick bất kỳ nguyên liệu nào → trở lại chưa hoàn tất (BR-05.5). Đây là trạng thái suy ra, không phải item tick được.
- Khi nguồn bị xoá hợp lệ, occurrence vẫn giữ tên/danh mục đã chụp và trạng thái tick (BR-04.3, BR-04.4).
**Kiểm chứng:** manual: tick 1 nguyên liệu trong món A và kiểm tra món A không đổi ở placement khác; thêm cùng nguyên liệu 2 lần → 2 dòng độc lập; tiến độ = số dòng tick được, không tính header; xoá nguyên liệu khỏi thư viện sau khi đã gỡ khỏi món → dòng Checklist còn nguyên.

### FR-08 — Hoàn tất mua sắm
Từ Checklist đang hoạt động, bấm "Hoàn tất mua sắm" → hộp thoại có hai trường **bắt buộc** "Từ ngày" và "Đến ngày" (nhãn `COPY-04`, `COPY-05`), ngày bắt đầu ≤ ngày kết thúc (BR-08). Được phép hoàn tất khi còn mục chưa tick.

Khi xác nhận, hệ thống lưu **snapshot bất biến** gồm: mọi item (đã tick và chưa tick), tên hiển thị, thông tin nhóm/món cần để hiển thị, trạng thái tick, khoảng ngày, thời điểm tạo; sau đó **kết thúc** Checklist đang hoạt động.

**Toàn vẹn (DEC-038):** chỉ coi là hoàn tất khi **cả** việc lưu snapshot **và** việc đóng Checklist cùng thành công. Nếu một bước lỗi → không để lại snapshot mới, Checklist giữ nguyên để thử lại. Phiên đã kết thúc không được tạo snapshot lần thứ hai.
**Kiểm chứng:** một lời gọi RPC `complete_shopping(date_from, date_to, items)` (migration `20261112090000`), không còn 2 request rời. *Đã chạy (harness):* thiếu ngày → `Date range is required`; Từ > Đến → `date_from must be <= date_to`; danh sách rỗng → `must not be empty`; lưu thành công → đúng 1 snapshot, Checklist đóng; gọi lại → `No active checklist`, không tạo snapshot trùng; trigger raise giữa transaction → **0 snapshot, Checklist còn nguyên** (rollback toàn bộ).

### FR-09 — Lịch sử
Khu vực "Lịch sử" trong Cài đặt: liệt kê snapshot (mới nhất trước) với "Từ ngày", "Đến ngày", thời điểm tạo và số mục; mở từng snapshot ở chế độ **chỉ đọc** — mục đã tick hiện biểu tượng đã chọn, mục chưa tick hiện dấu X. Xoá được **từng** snapshot sau khi xác nhận "Có/Không" (BR-17); không có retention, không có xoá hàng loạt.
**Kiểm chứng:** manual: mở snapshot cũ, sửa tên nguyên liệu trong thư viện → snapshot không đổi; xoá 1 snapshot → Không → còn nguyên, Có → mất đúng 1.

---

## 3. Quy tắc nghiệp vụ

**BR-01 — Cách ly dữ liệu.** Mỗi tài khoản chỉ đọc/ghi dữ liệu của mình, cưỡng chế bằng RLS ở database (không chỉ ở UI).
`Kiểm chứng:` *đã chạy*: harness Postgres — user B đọc 0 row, insert/delete row của A bị từ chối; `anon` bị chặn hoàn toàn.

**BR-02 — Trường bắt buộc.** Tên của Nguyên liệu / Món ăn / Sản phẩm là bắt buộc; Sản phẩm bắt buộc có danh mục. Tên chỉ toàn khoảng trắng = rỗng.
`Kiểm chứng:` manual: nhập toàn dấu cách → không lưu được **và có thông báo** "Tên không được để trống."; trùng tên → thông báo ngay dưới ô nhập.

**BR-03 — Tên duy nhất & chuẩn hoá.**
- BR-03.1 Trong cùng tài khoản, tên không được trùng khi bỏ qua hoa/thường.
- BR-03.2 Chuẩn hoá trước khi so: bỏ khoảng trắng đầu/cuối, gộp nhiều khoảng trắng thành một.
- BR-03.3 Chuẩn hoá **không** gộp occurrence trong Checklist — mỗi occurrence vẫn riêng.
`Kiểm chứng:` *đã chạy*: unique index `lower(regexp_replace(btrim(name),'\s+',' ','g'))` chặn trùng ở DB; UI chặn trước khi gọi API.

**BR-04 — Bảo vệ dữ liệu đang được tham chiếu.**
- BR-04.1 Không xoá Món / Nguyên liệu / Sản phẩm đang dùng trong kế hoạch tuần hiện tại; phải báo người dùng gỡ trước.
- BR-04.2 Nguyên liệu còn được món tham chiếu: hiện **đầy đủ danh sách món liên quan**, chặn xoá cho đến khi gỡ khỏi tất cả các món đó.
- BR-04.3 Nguyên liệu/sản phẩm đã gỡ khỏi mọi tham chiếu chặn xoá: **được xoá** dù Checklist còn occurrence; occurrence giữ tên/danh mục hiện có và **không còn phụ thuộc** bản ghi nguồn.
- BR-04.4 Món đã gỡ khỏi kế hoạch: **được xoá** dù Checklist còn placement; Checklist giữ **tên món đã chụp** + toàn bộ occurrence/checkbox, không mất tiến độ.
`Kiểm chứng:` *đã chạy một phần*: FK `RESTRICT` chặn xoá nguyên liệu đang thuộc món; occurrence giữ `name_snapshot` + `source_ingredient_id → NULL`.

**BR-05 — Checklist và tạo lại.**
- BR-05.1 Mỗi Meal placement → một nhóm riêng; một dòng cho mỗi nguyên liệu của món đó.
- BR-05.2 Cùng món ở nhiều ngày → nhóm và bộ occurrence riêng, **không gộp**.
- BR-05.3 Trong một nhóm, nguyên liệu trùng tên ở món khác là dòng riêng với checkbox độc lập. Checkbox chỉ chia sẻ giữa occurrence và dòng tương ứng của **cùng** placement; không đồng bộ giữa các placement.
- BR-05.4 Thêm từ thư viện hoặc thêm mục phát sinh → occurrence riêng, **được phép trùng**; mục phát sinh thuộc nhóm "Khác (phát sinh)", không phải entity thư viện; được lưu vào snapshot cùng trạng thái.
- BR-05.5 Món tự hoàn tất khi mọi nguyên liệu của placement được tick; bỏ tick → chưa hoàn tất.
- BR-05.6 Checklist là phiên riêng: thêm/gỡ món, sản phẩm rồi lưu kế hoạch **không** tự đồng bộ Checklist.
- BR-05.7 Tạo Checklist khi đang có Checklist → hỏi xác nhận ghi đè; chỉ thay thế sau khi xác nhận.
- BR-05.8 Ghi đè → trạng thái tick và mục phát sinh chưa lưu của phiên cũ bị bỏ; snapshot đã hoàn tất không bị ảnh hưởng.
`Kiểm chứng:` manual theo FR-06/FR-07; phần chia sẻ checkbox giữa 2 chế độ xem: **chế độ xem theo món đang defer** (DEC-041).

**BR-06 — Kế hoạch rỗng.** Không có món và không có sản phẩm → không tạo Checklist rỗng. Chỉ có sản phẩm → tạo được.
`Kiểm chứng:` manual: xoá hết món + sản phẩm → bấm tạo → báo `COPY-07`.

**BR-07 — Snapshot bất biến.** Snapshot giữ tên, danh mục/thông tin nhóm cần hiển thị và trạng thái checkbox tại thời điểm hoàn tất. Sửa/xoá dữ liệu gốc không đổi snapshot. Snapshot chỉ đọc khi còn lưu; xoá được từng cái.
`Kiểm chứng:` *đã chạy*: bảng `shopping_history` không có policy UPDATE → update 0 row, nội dung không đổi.

**BR-08 — Kiểm tra ngày.** "Từ ngày" và "Đến ngày" bắt buộc; Từ ngày ≤ Đến ngày.
`Kiểm chứng:` *đã chạy*: check constraint `date_from <= date_to`.

**BR-09 — Trực tuyến.** Chức năng thường yêu cầu Internet; không có offline.
`Kiểm chứng:` manual: ngắt mạng → thao tác lưu báo lỗi, không giả vờ thành công (AUR-13).

**BR-10 — Danh mục sản phẩm cố định.** Xem §4. Không tạo/sửa/xoá danh mục trong app.

**BR-11 — Khoảng ngày là metadata.** Khoảng ngày do người dùng nhập khi hoàn tất, lưu cùng snapshot và hiển thị trong Lịch sử; **không** phải ngày thực tế đi chợ, không gắn ngày vào kế hoạch tuần.
`Kiểm chứng:` manual: nhập khoảng 09→13/11 cho lần mua hôm nay → Lịch sử hiện đúng khoảng đã nhập, kế hoạch không đổi.

**BR-12 — Đặt lại kế hoạch khi Checklist chưa hoàn tất.** Đặt lại chỉ xoá 7 ngày + sản phẩm đã chọn; Checklist đang hoạt động được giữ nguyên như một phiên riêng.
`Kiểm chứng:` manual: có Checklist đang tick dở → Đặt lại → Có → kế hoạch trống, Checklist vẫn còn nguyên trạng thái.

**BR-13 — Thành phần món.** Trong một món, cùng một nguyên liệu xuất hiện tối đa **một lần**; occurrence giữa các món vẫn độc lập.
`Kiểm chứng:` *đã chạy*: PK `(meal_id, ingredient_id)` chặn trùng.

**BR-14 — Lượt đặt món.** Một món đặt tối đa **một lần/ngày**, được đặt nhiều ngày; tối đa **3 món/ngày**.
`Kiểm chứng:` *đã chạy*: `unique(plan_id, weekday, meal_id)` + `check(position between 1 and 3)`; UI còn lỗ hổng kéo–thả (AUR-04).

**BR-15 — Xoá item khỏi Checklist.** Xoá một occurrence khỏi Checklist đang hoạt động; không xoá bản ghi thư viện.
`Kiểm chứng:` manual: xoá dòng trong Checklist → thư viện không đổi.

**BR-16 — Sửa thông tin hiển thị của item.** Sửa tên hiển thị của mọi occurrence; sửa **danh mục** chỉ áp dụng cho occurrence sản phẩm (danh mục là danh mục sản phẩm — item nguyên liệu/mục phát sinh không có danh mục). Chỉ occurrence đó đổi, thư viện không đổi; snapshot tạo sau lưu giá trị tại thời điểm hoàn tất.
`Kiểm chứng:` manual: đổi tên 1 dòng → dòng khác cùng nguyên liệu không đổi; hoàn tất → snapshot mang tên đã sửa.

**BR-17 — Xoá snapshot.** Xoá từng snapshot đã hoàn tất; snapshot còn lưu vẫn chỉ đọc/bất biến; **không** có retention, không xoá hàng loạt.
`Kiểm chứng:` manual: xoá 1 snapshot → các snapshot khác còn nguyên.

**BR-18 — Kết thúc Checklist không lưu lịch sử.** Người dùng được xoá phiên Checklist đang hoạt động mà **không** tạo snapshot. Phải xác nhận "Có/Không"; Có → phiên và toàn bộ trạng thái tick bị xoá; Không → giữ nguyên. Không ảnh hưởng Lịch sử đã lưu (DEC-043).
`Kiểm chứng:` manual: đang có Checklist tick dở → "Xóa Checklist" → Không → còn nguyên; Có → Checklist trống, Lịch sử không đổi.

---

## 4. Danh mục sản phẩm (BR-10)

Danh sách **cố định**, app không cho người dùng thêm/sửa/xoá: 

1. Vệ sinh nhà cửa
2. Giấy và đồ dùng một lần
3. Chăm sóc cá nhân
4. Đồ dùng gia đình
5. Khác
6. **Thực phẩm** — thêm 2026-11-07 (DEC-040)
7. **Đồ uống** — thêm 2026-11-07 (DEC-040)

Lý do: PO đã dùng thực tế 7 danh mục cho 88 sản phẩm; BRD/SRS cũ ghi 5 là trạng thái trước 2026-11-07. "Khác" (danh mục sản phẩm) **khác** "Khác (phát sinh)" (nhóm item Checklist).
`Kiểm chứng:` *đã chạy*: `pg_enum.shopping_category` trả đúng 7 giá trị; DB constraint chặn giá trị khác.

---

## 5. Luồng sử dụng (tóm tắt)

| ID | Luồng | Bước chính |
|---|---|---|
| UC-01 | Tài khoản | Đăng ký → đăng nhập → dùng → đăng xuất (FR-01) |
| UC-02 | Quản lý nguyên liệu | Tạo/sửa/xoá trong Thư viện, xoá theo BR-04.2 (FR-02) |
| UC-03 | Quản lý món | Tạo món + chọn nguyên liệu (multi-select, tìm kiếm) (FR-03) |
| UC-04 | Quản lý sản phẩm | Tạo/sửa/xoá, chọn 1 danh mục cố định (FR-04) |
| UC-05 | Lập kế hoạch | Thêm/gỡ món theo ngày, chọn sản phẩm, đặt lại mẫu (FR-05) |
| UC-06 | Mua sắm | Xem trước → tạo → tick/thêm/sửa/xoá mục → tiến độ (FR-06, FR-07) |
| UC-07 | Hoàn tất & lịch sử | Nhập khoảng ngày → lưu snapshot → xem/xoá trong Lịch sử (FR-08, FR-09) |

---

## 6. Yêu cầu phi chức năng

- **NFR-01 — Responsive:** dùng được trên trình duyệt điện thoại (390×844, 384×854) và desktop; thao tác chính không cần zoom.
- **NFR-02 — Bảo mật:** RLS bật trên mọi bảng ứng dụng; publishable key ở client; không service-role key; cross-account truy cập phải bị từ chối.
- **NFR-03 — Toàn vẹn:** DB chặn tên trùng, quan hệ không hợp lệ và xoá dữ liệu đang được dùng; UI không được tạo ra trạng thái mà DB từ chối.
- **NFR-04 — Lịch sử nhất quán:** snapshot độc lập với thư viện hiện tại.
- **NFR-05 — Vận hành đơn giản:** Supabase + Vercel; không backend riêng, không offline, không real-time.

---

## 7. Ngoài phạm vi ở tầng hành vi

Xem `01` §4. Bất kỳ hành vi nào không có ID trong file này **không** được coi là yêu cầu; nếu cần, mở issue `question` trước khi code.

---

## 8. Truy vết ngược (ID → tài liệu cũ)

| ID | Nơi từng nằm |
|---|---|
| FR-01…FR-09 | SRS §2; BRD §2.1 (F-01…F-09) |
| BR-01…BR-17 | BRD §3; SRS §3 (bản sao) |
| Danh mục §4 | BRD BR-10; SRS §4; CMP-06 |
| UC-01…UC-07 | SRS §5 |
| NFR-01…05 | SRS §6; BRD §4 |
| BR-05.* chi tiết | BRD BR-05, SRS FR-06/07, SC-06, CMP-12…17, CDM — nay chỉ còn ở đây |

Lệch giữa hành vi này và code hiện tại: `08-gaps.md`.
