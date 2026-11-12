---
id: spec-ui
status: draft
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
sources: [Screen Specification (Notion, PO-approved 2026-10-30), Component Specification (Notion, PO-approved 2026-10-30), SRS §11, DEC-030, DEC-044, src/app/page.tsx, src/lib/supabase/messages.ts]
---

# 03 — Hợp đồng giao diện

File này là **nơi duy nhất** định nghĩa: có những màn hình nào, mỗi thành phần nhận gì / làm gì / có trạng thái nào, và **câu chữ hiển thị** (bảng `COPY-xx`).

Hành vi (khi nào chặn, khi nào cho phép, dữ liệu nào sinh ra) **không** nằm ở đây — xem `02-behavior.md`. Không lặp lại quy tắc; chỉ ghi `Xem FR-xx / BR-xx`.

`COPY-xx` là nguồn duy nhất của chuỗi hiển thị; `src/lib/copy.ts` sẽ được sinh từ bảng §5. Không thêm chuỗi UI mới ngoài bảng này (AGENTS.md).

---

## 1. Inventory màn hình

Giữ nguyên ID từ Screen Specification. `SC-01…SC-08` là **surface chức năng**, không mặc định mỗi dòng là một tab.

| ID | Màn hình / surface | Mục đích | Tab | Nguồn |
|---|---|---|---|---|
| SC-01 | Authentication | Đăng ký, đăng nhập, đăng xuất | ngoài 4 tab (chắn toàn app) | FR-01, UC-01 |
| SC-02 | Ingredient library | Xem/quản lý Nguyên liệu | Thư viện → Nguyên liệu | FR-02, BR-02–BR-04, UC-02 |
| SC-03 | Meal library | Xem/quản lý Món ăn + thành phần | Thư viện → Món ăn | FR-03, BR-02–BR-04, UC-03 |
| SC-04 | Product library | Xem/quản lý Sản phẩm + danh mục cố định | Thư viện → Sản phẩm | FR-04, BR-02–BR-04, BR-10, UC-04 |
| SC-05 | Weekly Plan | Sa bàn 7 ngày, chọn sản phẩm, đặt lại | Trang chủ | FR-05, BR-12, UC-05 |
| SC-06 | Checklist preview + Active Checklist | Xem trước và quản lý phiên mua sắm | Checklist | FR-06, FR-07, BR-05/BR-06, UC-06 |
| SC-07 | Complete shopping dialog | Nhập khoảng ngày, lưu snapshot | modal của SC-06 | FR-08, BR-07/BR-08/BR-11, UC-07 |
| SC-08 | History | Xem/xoá snapshot đã hoàn tất | Cài đặt → Lịch sử | FR-09, BR-07, UC-07 |

Ba surface `SC-02…SC-04` dùng chung một khung danh sách + form; chuyển giữa chúng bằng tab nội bộ của Thư viện (`CMP-03`).

---

## 2. Cây điều hướng (DEC-030, DEC-044)

Đúng **bốn tab**, thứ tự cố định:

```
SHOPPING AUREN
├── Trang chủ        → SC-05 Weekly Plan
│                      ├── sa bàn 7 ngày (Thứ Hai … Chủ Nhật), tối đa 3 món/ngày
│                      ├── danh sách sản phẩm đã chọn cho tuần
│                      └── Tạo danh sách · Đặt lại mẫu
├── Checklist        → SC-06 (+ SC-07 là modal của nó)
│                      ├── empty state khi chưa có phiên
│                      ├── Active Checklist (nhóm theo placement, Sản phẩm, Khác (phát sinh))
│                      └── Hoàn tất mua sắm · Xóa Checklist
├── Thư viện         → SC-02 / SC-03 / SC-04 (tab nội bộ: Món ăn · Nguyên liệu · Sản phẩm)
└── Cài đặt          → SC-08 Lịch sử + tài khoản
                       ├── thẻ Tài khoản (email, dòng dữ liệu đồng bộ, Đăng xuất → SC-01)
                       └── thẻ Lịch sử (danh sách snapshot, mở read-only, xoá từng cái)
```

- Không có tab/màn hình Profile trong MVP (`DEC-031`); khối tài khoản ở sidebar chỉ là lối tắt sang Cài đặt.
- Lịch sử và Đăng xuất **nằm trong** Cài đặt, không phải tab cấp cao.
- Điều hướng có hai bản render (sidebar desktop, thanh dưới mobile) cùng một tập 4 tab; cả hai mang `aria-label="Điều hướng chính"`.
- Quyền quyết định cấu trúc tài liệu/UI kỹ thuật: `AI-delegated` (`DEC-044`); thay đổi cấu trúc tab là quyết định business → cần PO.

**Lệch đang mở:** code hiện tại đặt nhãn tab thứ hai là **“Danh sách”** (`page.tsx:27`, `COPY-32`), trong khi `DEC-030` gọi tab này là **“Checklist”**. Xem §7.

---

## 3. Component inventory

Giữ nguyên ID từ Component Specification.

| ID | Component / pattern | Màn hình | Vai trò | Hiện thực trong code |
|---|---|---|---|---|
| CMP-01 | App shell & primary navigation | SC-01–SC-08 | Khung, 4 tab, chắn khu vực nội bộ | `app-shell`, `sidebar`, `mobile-nav`, `topbar` |
| CMP-02 | Authentication form | SC-01 | Đăng ký/đăng nhập/đăng xuất | `auth-screen`, `auth-card` |
| CMP-03 | Library list & entity row | SC-02–SC-04 | Liệt kê theo loại, chọn để sửa/xoá | `library-switch`, `entity-list` |
| CMP-04 | Entity form | SC-02–SC-04 | Tạo/sửa Nguyên liệu, Món ăn, Sản phẩm | dialog `entity` |
| CMP-05 | Ingredient multi-select | SC-03 | Chọn nguyên liệu cho món, có tìm kiếm | `fieldset.ingredient-select` |
| CMP-06 | Product Category selector | SC-04, SC-05, SC-06 | Chọn/lọc một danh mục cố định | `select` trong dialog `entity`, `product-picker`; filter ở Thư viện |
| CMP-07 | Referenced-item delete guard | SC-02–SC-04 | Chặn xoá khi còn tham chiếu, nêu đối tượng chặn | `deleteEntity()`, dialog `delete-entity` |
| CMP-08 | Weekly Plan board | SC-05 | Sa bàn 7 ngày + danh sách sản phẩm | `day-grid`, `products-section` |
| CMP-09 | Meal picker | SC-05 | Chọn món cho một ngày | dialog `meal-picker` |
| CMP-10 | Product picker | SC-05 | Tìm/lọc, chọn nhiều sản phẩm cho tuần | dialog `product-picker` |
| CMP-11 | Confirmation dialog pattern | SC-05–SC-08 | Hộp thoại Có/Không (đặt lại, ghi đè, xoá) | dialog `reset`, `overwrite`, `delete-*` |
| CMP-12 | Checklist preview | SC-06 | Rà soát nội dung dự kiến trước khi tạo | dialog `preview` |
| CMP-13 | Meal placement group header | SC-06 | Nhóm occurrence theo placement, không gộp | `occurrence-group > header` |
| CMP-14 | Checklist item row | SC-06, SC-08 | Một occurrence / một item snapshot | `check-row`, `preview-row`, `snapshot-*` |
| CMP-15 | Add-from-library picker | SC-06 | Thêm nguyên liệu/sản phẩm thành occurrence riêng | dialog `add-library` |
| CMP-16 | Ad-hoc Checklist item editor | SC-06 | Thêm/sửa tên item phát sinh tại chỗ | `other-form`, `inline-edit` |
| CMP-17 | Checklist progress summary | SC-06 | Tổng số mục và % hoàn thành | `progress-card` |
| CMP-18 | Complete-shopping date dialog | SC-07 | Nhập khoảng ngày, tạo snapshot | dialog `complete` |
| CMP-19 | History snapshot list/detail | SC-08 | Danh sách snapshot, xem read-only, xoá từng cái | `history-section`, dialog `view-history` |
| CMP-20 | Validation / empty / blocking feedback | SC-01–SC-08 | Toast, lỗi tại trường, empty state, thông báo chặn | `toast`, `field-error`, `empty-card`, `empty-list` |

---

## 4. Component contract

Chỉ inputs / actions / states. Mọi điều kiện nghiệp vụ ghi bằng tham chiếu.

### CMP-01 — App shell & primary navigation
**Inputs:** trạng thái phiên (đã/chưa đăng nhập), email tài khoản, screen hiện hành, có Active Checklist hay không.
**Actions:** mở 4 tab; mở Cài đặt từ khối tài khoản; skip-link tới `#main-content`.
**States:** chưa đăng nhập → chỉ render SC-01; đang tải phiên → màn hình loading; đã đăng nhập → shell + tab active; tab Checklist có chỉ báo khi có Active Checklist.
**Refs:** FR-01 (`Xem FR-01`), BR-01, DEC-030, DEC-044.

### CMP-02 — Authentication form
**Inputs:** email, mật khẩu, mode (Đăng nhập/Đăng ký), bước (email → mật khẩu).
**Actions:** tiếp tục sang bước mật khẩu; đổi email; đăng ký; đăng nhập; đổi mode.
**States:** bước email; bước mật khẩu; lỗi tại trường (`COPY-01…03`, `COPY-22…26`); đăng ký xong nhưng chưa có phiên → nhắc xác nhận email; đã xác thực.
**Refs:** FR-01, UC-01, BR-01, NFR-02.

### CMP-03 — Library list & entity row
**Inputs:** tập Nguyên liệu / Món ăn / Sản phẩm của tài khoản; tab nội bộ; từ khoá; bộ lọc danh mục (Sản phẩm) hoặc bộ lọc nguyên liệu (Món ăn).
**Actions:** đổi loại; tìm; lọc; mở form sửa; mở xác nhận xoá; mở form tạo.
**Variants:** row Nguyên liệu (kèm “được dùng trong …”); row Món ăn (kèm số nguyên liệu); row Sản phẩm (kèm danh mục).
**States:** có dữ liệu; có filter/từ khoá nhưng 0 kết quả; thư viện rỗng (chỉ nút tạo); row đang chờ xoá.
**Refs:** FR-02–FR-04, BR-02–BR-04, BR-10.

### CMP-04 — Entity form
**Inputs:** tên; với Món ăn: tập nguyên liệu; với Sản phẩm: một danh mục; entity đang sửa (nếu có).
**Actions:** lưu; huỷ (không ghi gì); tìm nguyên liệu; tick/bỏ tick nguyên liệu.
**States:** tạo mới; sửa; lỗi tên rỗng (`COPY-108`); lỗi tên trùng (`COPY-109`); danh sách nguyên liệu 0 kết quả.
**Refs:** FR-02–FR-04, BR-02, BR-03, BR-13.

### CMP-05 — Ingredient multi-select
**Inputs:** thư viện nguyên liệu; tập đã chọn trong món; từ khoá.
**Actions:** tìm, chọn/bỏ chọn; mục đã chọn được đẩy lên đầu danh sách.
**States:** thư viện rỗng; không có kết quả; có lựa chọn; món 0 nguyên liệu (hợp lệ khi lưu).
**Refs:** FR-03, BR-13.

### CMP-06 — Product Category selector
**Inputs:** 7 danh mục cố định (`02` §4) hoặc `Tất cả` khi dùng làm bộ lọc.
**Actions:** chọn một danh mục; dùng làm filter.
**States:** luôn có giá trị (mặc định danh mục đầu tiên) khi tạo sản phẩm; không có trạng thái “chưa chọn”; không có CRUD danh mục.
**Refs:** FR-04, BR-10, DEC-040. Nhãn danh mục là dữ liệu của `02` §4, **không** cấp `COPY` riêng.

### CMP-07 — Referenced-item delete guard
**Inputs:** entity cần xoá; dữ liệu kế hoạch tuần; danh sách món tham chiếu nguyên liệu.
**Actions:** xoá khi hợp lệ; chặn và nêu đối tượng chặn khi không hợp lệ.
**States:** xoá được; bị chặn do còn trong kế hoạch tuần (`COPY-111`, `COPY-112`); bị chặn do còn món tham chiếu (`COPY-110`, nêu đủ tên món); chờ xác nhận; đã huỷ.
**Refs:** BR-04, BR-15. Guard không xoá thay người dùng.

### CMP-08 — Weekly Plan board
**Inputs:** kế hoạch hiện tại (7 ngày + danh sách sản phẩm đã chọn).
**Actions:** mở picker món cho một ngày; gỡ một món; kéo–thả món sang ngày khác; mở picker sản phẩm; gỡ sản phẩm; tạo danh sách; đặt lại mẫu.
**States:** ngày trống (`COPY-37`); ngày đầy 3 món (nút thêm vẫn bấm được → thông báo `COPY-68`); chưa chọn sản phẩm (`COPY-52`); đang kéo; ngày đang là điểm thả.
**Refs:** FR-05, BR-12, BR-14, AUR-04 (lỗ hổng kéo–thả).

### CMP-09 — Meal picker
**Inputs:** danh sách món của thư viện, từ khoá, ngày đích, kế hoạch ngày đó.
**Actions:** tìm; chọn món; đóng.
**States:** thư viện món rỗng; 0 kết quả; món đã có trong ngày → row disabled + `COPY-44`; món 0 nguyên liệu → không chọn được, bấm vào hiện `COPY-06`; ngày đủ 3 món → row disabled.
**Refs:** FR-03, FR-05, BR-14.

### CMP-10 — Product picker
**Inputs:** thư viện sản phẩm, từ khoá, bộ lọc danh mục, lựa chọn tạm, sản phẩm đã có trong kế hoạch.
**Actions:** tìm; lọc; chọn/bỏ chọn (chỉ trên lựa chọn tạm); huỷ; lưu lựa chọn.
**States:** 0 kết quả; có kết quả; sản phẩm đã có → disabled + `COPY-44`; đếm lựa chọn tạm (`COPY-55`). Đổi từ khoá/bộ lọc **không** làm mất lựa chọn tạm.
**Refs:** FR-04, FR-05.

### CMP-11 — Confirmation dialog pattern
**Biến thể:** đặt lại kế hoạch (`COPY-63`, `COPY-64`); ghi đè Checklist (`COPY-92`, `COPY-93`); xoá entity (`COPY-113…115`); xoá Checklist (`COPY-81…83`); xoá snapshot (`COPY-134`, `COPY-135`).
**Actions:** xác nhận (Có / nhãn hành động cụ thể) hoặc huỷ (Không / Hủy / Đóng); Escape và bấm nền đóng dialog = huỷ.
**States:** mở; đã xác nhận; đã huỷ. Không có hành vi nào chạy trước khi xác nhận.
**Refs:** FR-05, FR-06, FR-09, BR-05.7, BR-17, BR-18, DEC-024.

### CMP-12 — Checklist preview
**Inputs:** kết quả dựng từ kế hoạch tuần hiện tại (nhóm theo placement + nhóm sản phẩm).
**Actions:** huỷ; tạo danh sách (nếu đã có Checklist → chuyển sang CMP-11 ghi đè).
**States:** có mục; kế hoạch rỗng → không mở được dialog, hiện `COPY-07`; đang có Checklist → cần xác nhận ghi đè.
**Refs:** FR-06, BR-05.1–05.2, BR-06.

### CMP-13 — Meal placement group header
**Inputs:** tên món đã chụp cho placement, tập occurrence của placement đó.
**Actions:** không có (không tick được).
**States:** đang làm; tất cả nguyên liệu của nhóm đã tick → huy hiệu “Hoàn tất” (`COPY-79`). Header **không** tính vào tiến độ.
**Refs:** FR-07, BR-05.2, BR-05.5, BR-04.4.

### CMP-14 — Checklist item row
**Inputs:** tên hiển thị, loại (nguyên liệu / sản phẩm / phát sinh), trạng thái tick, danh mục (nếu là sản phẩm), vị trí nhóm.
**Actions:** tick/bỏ tick; sửa tên hiển thị; sửa danh mục (chỉ dòng sản phẩm); xoá dòng; lưu sửa tại chỗ.
**States:** đã tick / chưa tick; đang sửa (input + nút lưu); read-only trong snapshot (tick → biểu tượng chọn, chưa tick → dấu X).
**Refs:** FR-07, BR-05.3, BR-15, BR-16, BR-07. Mỗi occurrence là một dòng độc lập.

### CMP-15 — Add-from-library picker
**Inputs:** nguyên liệu + sản phẩm của thư viện, từ khoá.
**Actions:** chọn một mục → tạo occurrence và đóng picker.
**States:** 0 kết quả; danh sách hợp nhất (nguyên liệu trước, sản phẩm sau).
**Refs:** FR-07, BR-05.4. Được phép trùng; không đổi thư viện hay kế hoạch.

### CMP-16 — Ad-hoc item editor
**Inputs:** tên nhập tay; item đang sửa.
**Actions:** thêm vào nhóm “Khác (phát sinh)”; sửa tên tại chỗ; xoá.
**States:** ô rỗng → `COPY-99`; đã thêm (ô nhập được xoá trắng); đang sửa.
**Refs:** FR-07, BR-05.4. Không tạo entity trong thư viện.

### CMP-17 — Checklist progress summary
**Inputs:** toàn bộ item có thể tick của Active Checklist và trạng thái tick.
**Output:** `{đã tick} / {tổng} mục đã hoàn tất` (`COPY-70`) và phần trăm làm tròn.
**States:** không có mục (không render, vì không có Active Checklist); một phần; 100%. Không tính Meal header.
**Refs:** FR-07.

### CMP-18 — Complete-shopping date dialog
**Inputs:** `Từ ngày`, `Đến ngày` (date input), Checklist đang hoạt động.
**Actions:** xác nhận hoàn tất; huỷ.
**States:** form rỗng; thiếu ngày (`COPY-121`); Từ > Đến (`COPY-122`); còn mục chưa tick vẫn cho hoàn tất; lỗi lưu (`COPY-124`); thành công (`COPY-123`).
**Refs:** FR-08, BR-07, BR-08, BR-11, DEC-038. Một lời gọi RPC, không tách 2 request.

### CMP-19 — History snapshot list/detail
**Inputs:** danh sách snapshot (mới nhất trước).
**Actions:** mở snapshot; xoá một snapshot (qua CMP-11); đóng.
**States:** có snapshot; chưa có snapshot (`COPY-131`, `COPY-132`); xem chi tiết read-only; xác nhận xoá; lỗi xoá (`COPY-136`).
**Refs:** FR-09, BR-07, BR-17. Không có retention, không xoá hàng loạt.

### CMP-20 — Validation / empty / blocking feedback
**Inputs:** kết quả kiểm tra ở client, lỗi Supabase đã map sang tiếng Việt (`messages.ts`), trạng thái rỗng của danh sách.
**Actions:** không có (chỉ hiển thị). Toast đóng sau 2,6 s; toast lỗi mang `role="alert"`.
**Known cases:** tên rỗng/trùng; chặn xoá; món chưa có nguyên liệu; ngày đủ 3 món; món trùng trong ngày; kế hoạch rỗng; sai khoảng ngày; 0 kết quả tìm/lọc; thư viện rỗng; lỗi phiên/lưu.
**Refs:** FR-01–FR-09, BR-02–BR-12. Chỉ dùng câu trong §5, không tự sinh câu mới.

---

## 5. Bảng COPY

**Quy ước**
- Chuỗi ghi **nguyên văn** như đang render; `{…}` là phần nội suy, không phải chữ hiển thị.
- **Một chuỗi = một ID.** Chuỗi trùng nhau ở nhiều chỗ dùng chung một ID; cột “Nơi dùng” liệt kê mọi chỗ.
- `COPY-01…07` là ID đã dùng ở tài liệu/PR trước — **giữ nguyên**, không đánh số lại. Từ `COPY-08` trở đi, ID tăng theo thứ tự chuỗi xuất hiện trong luồng màn hình SC-01 → SC-08, dialogs nằm trong mục của màn hình chứa nó.
- Nguồn duy nhất để sinh `src/lib/copy.ts`. Sai một ký tự = sai spec.
- Ngoại lệ có ghi chú: `COPY-151`, `COPY-152` được cấp sau khi rà soát lại toàn bộ `page.tsx` (§5.10).
- Biến nội suy ghi tên đọc được; tên biến trong code: `{ngày}`=`day`, `{tên}`/`{tên món}`/`{tên sản phẩm}`=`name`/`meal.name`/`product.name`, `{n}`=độ dài tập, `{đã tick}`/`{tổng}`=`checkedCount`/`itemCount`, `{lỗi}`=kết quả `saveErrorMessage()`/`authErrorMessage()`, `{danh sách món}`=các tên nối bằng `, `, `{thời điểm tạo}`=timestamp đã format.
- Chuỗi thuần ASCII không cấp `COPY`: tên thương hiệu `SHOPPING AUREN`, tagline `home, in good rhythm`, nhãn `Email`, placeholder `ban@example.com`.
- Nhãn sinh từ dữ liệu (7 ngày `Thứ Hai…Chủ Nhật`, 7 danh mục sản phẩm) thuộc `02` §4 / FR-05, không cấp ID `COPY`.

### 5.1 ID đã chốt trước (giữ nguyên)

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-01 | Email hoặc mật khẩu không đúng. | `src/lib/supabase/messages.ts` → lỗi đăng nhập, hiện ở `auth-card` (`page.tsx:437`) | FR-01 |
| COPY-02 | Email này đã được đăng ký. Hãy đăng nhập. | `messages.ts` → lỗi đăng ký trùng email | FR-01 |
| COPY-03 | Mật khẩu cần có ít nhất 6 ký tự. | `messages.ts` → lỗi mật khẩu yếu khi đăng ký | FR-01 |
| COPY-04 | Bỏ qua tới nội dung chính | skip-link đầu `app-shell` (`page.tsx:452`) | PO duyệt 2026-10-31 (UI-03) |
| COPY-05 | Dữ liệu đồng bộ · Lưu trong Supabase, riêng tư theo tài khoản đăng nhập. | thẻ Tài khoản, Cài đặt (`page.tsx:493`) | PO duyệt 2026-10-31 (UI-03) |
| COPY-06 | Món ăn chưa có nguyên liệu. Vui lòng thêm ít nhất một nguyên liệu trước khi đưa món ăn vào kế hoạch tuần. | toast khi chọn món 0 nguyên liệu trong Meal picker (`page.tsx:248`) | FR-05, BR-06 |
| COPY-07 | Kế hoạch tuần đang trống. | toast khi bấm “Tạo danh sách” mà kế hoạch rỗng (`page.tsx:290`) | FR-06, BR-06 |

### 5.2 SC-01 — Authentication

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-08 | Tài khoản Supabase | tag header màn hình xác thực (`page.tsx:426`); phụ đề khối tài khoản ở sidebar (`:457`) | |
| COPY-09 | CHÀO MỪNG BẠN | eyebrow của hero (`:431`) | giữ nguyên chữ hoa |
| COPY-10 | Đăng nhập vào SHOPPING AUREN | tiêu đề hero khi mode Đăng nhập (`:432`) | |
| COPY-11 | Tạo tài khoản SHOPPING AUREN | tiêu đề hero khi mode Đăng ký (`:432`) | |
| COPY-12 | Tiếp tục | nút submit ở bước email (`:438`) | |
| COPY-13 | Mật khẩu | nhãn trường mật khẩu (`:441`) | |
| COPY-14 | Nhập mật khẩu của bạn | placeholder mật khẩu, mode Đăng nhập (`:441`) | |
| COPY-15 | Tối thiểu 6 ký tự | placeholder mật khẩu, mode Đăng ký (`:441`) | khớp `minLength=6` |
| COPY-16 | Đổi | nút đổi email đã nhập (`:440`) | |
| COPY-17 | Đăng nhập | nút submit mode Đăng nhập (`:443`); nút đổi mode ở chân form (`:445`) | trùng chuỗi → một ID |
| COPY-18 | Đăng ký | nút đổi mode ở chân form (`:445`) | |
| COPY-19 | Chưa có tài khoản? | câu dẫn chân form, mode Đăng nhập (`:445`) | |
| COPY-20 | Đã có tài khoản? | câu dẫn chân form, mode Đăng ký (`:445`) | |
| COPY-21 | MVP · Xác thực và lưu dữ liệu bằng Supabase. | footer màn hình xác thực (`:448`) | |
| COPY-22 | Thiếu cấu hình Supabase. Kiểm tra biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. | lỗi cấu hình, hiện trong `auth-card` (`:102`) | lỗi vận hành, vẫn là copy người dùng thấy |
| COPY-23 | Không thể kiểm tra phiên đăng nhập. | lỗi đọc phiên (`:116`) | |
| COPY-24 | Vui lòng nhập email. | lỗi trường email rỗng (`:391`) | |
| COPY-25 | Vui lòng nhập mật khẩu. | lỗi trường mật khẩu rỗng (`:397`) | |
| COPY-26 | Tài khoản đã tạo. Kiểm tra email để xác nhận, sau đó đăng nhập. | đăng ký xong nhưng chưa có phiên (`:405`) | |

### 5.3 CMP-01 — Khung & điều hướng

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-27 | KHÔNG GIAN CỦA BẠN | caption trên sidebar (`:455`) | giữ nguyên chữ hoa |
| COPY-28 | Điều hướng chính | `aria-label` của sidebar nav (`:456`) và thanh nav mobile (`:497`) | nhãn trợ năng |
| COPY-29 | Tài khoản | tên khối tài khoản ở sidebar khi chưa có email (`:457`); tiêu đề thẻ Tài khoản, Cài đặt (`:493`) | |
| COPY-30 | Không gian của bạn | đoạn đầu breadcrumb ở topbar (`:462`) | |
| COPY-31 | Trang chủ | nhãn tab 1 (`:26`) | DEC-030 |
| COPY-32 | Danh sách | nhãn tab 2 (`:27`) | **lệch DEC-030 (“Checklist”)** — xem §7 |
| COPY-33 | Thư viện | nhãn tab 3 (`:28`) | |
| COPY-34 | Cài đặt | nhãn tab 4 (`:29`) | |

### 5.4 SC-05 — Weekly Plan (Trang chủ)

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-35 | Tuần hiện tại | caption trên sa bàn (`:465`) | |
| COPY-36 | · 7 ngày | phụ chú cạnh “Tuần hiện tại” (`:465`) | dấu “·” là một phần chuỗi |
| COPY-37 | Chưa có món ăn | empty state trong một ngày trống (`:466`) | |
| COPY-38 | Chưa có nguyên liệu | phụ đề món chip khi món 0 nguyên liệu (`:468`); nhãn thay nút chọn trong Meal picker (`:500`) | trùng chuỗi → một ID |
| COPY-39 | Nhấn giữ rồi kéo sang ngày khác | `title` của món chip (`:468`) | |
| COPY-40 | Gỡ {tên món} | `aria-label` nút X trên món chip (`:468`) | |
| COPY-41 | Thêm món ăn | nút thêm món dưới mỗi ngày (`:469`); tiêu đề dialog Meal picker (`:550`, dạng `COPY-45`) | |
| COPY-42 | Chọn món ăn cho {ngày} · tối đa 3 món. | câu dẫn dialog Meal picker (`:500`) | |
| COPY-43 | Tìm món ăn | placeholder ô tìm trong Meal picker (`:500`) | |
| COPY-44 | Đã thêm | nhãn trạng thái món/sản phẩm đã có trong kế hoạch (`:500`, `:501`) | |
| COPY-45 | Thêm món ăn · {ngày} | tiêu đề dialog Meal picker (`:550`) | |
| COPY-46 | Sản phẩm | tiêu đề khối sản phẩm (`:470`); tiêu đề nhóm trong Checklist (`:531`, `:545`) | trùng chuỗi → một ID |
| COPY-47 | Sản phẩm cần mua trong tuần này. | phụ đề khối sản phẩm (`:470`) | |
| COPY-48 | Chọn sản phẩm | nút mở Product picker (`:470`); tiêu đề dialog Product picker (`:551`) | |
| COPY-49 | {n} sản phẩm | đếm ở đầu panel sản phẩm (`:470`) | |
| COPY-50 | · được chọn cho tuần này | phụ chú cạnh số sản phẩm (`:470`) | |
| COPY-51 | Bỏ {tên sản phẩm} | `aria-label` nút X trên chip sản phẩm (`:470`) | |
| COPY-52 | Chưa có sản phẩm nào được chọn. | empty state trong panel sản phẩm (`:470`) | |
| COPY-53 | Tìm và chọn nhiều sản phẩm từ thư viện cho kế hoạch tuần. | câu dẫn dialog Product picker (`:501`) | |
| COPY-54 | Tìm sản phẩm | placeholder ô tìm trong Product picker (`:501`); `Tìm sản phẩm` ở Thư viện dùng `COPY-102` | |
| COPY-55 | {n} đã chọn | đếm lựa chọn tạm ở chân Product picker (`:501`) | |
| COPY-56 | Lưu lựa chọn | nút xác nhận Product picker (`:501`) | |
| COPY-57 | Hủy | nút huỷ trong Product picker (`:501`), dialog xoá entity (`:502`), dialog xoá Checklist (`:503`), preview (`:505`), complete (`:508`), entity form (`:509`) | trùng chuỗi → một ID |
| COPY-58 | Tất cả | option filter mặc định (danh mục sản phẩm, nguyên liệu trong món) (`:487`, `:488`, `:501`) | khác “Khác (phát sinh)” |
| COPY-59 | Danh mục | nhãn select lọc danh mục (`:487`, `:501`); nhãn trường trong form sản phẩm (`:509`) | |
| COPY-60 | Không có kết quả phù hợp. | 0 kết quả tìm/lọc — Product picker (`:501`), căn cứ Thư viện (`:488`), danh sách nguyên liệu trong form món (`:509`) | trùng chuỗi → một ID |
| COPY-61 | Tạo danh sách | nút chính ở Trang chủ (`:471`) và ở empty state Checklist (`:482`); nút xác nhận dialog preview (`:505`) | |
| COPY-62 | Đặt lại mẫu | nút mở xác nhận đặt lại (`:471`) | |
| COPY-63 | Đặt lại kế hoạch tuần? | tiêu đề dialog đặt lại (`:552`) | |
| COPY-64 | Đặt lại mẫu sẽ xóa các món ăn và sản phẩm đã chọn trong kế hoạch tuần. Danh sách đang hoạt động vẫn được giữ nguyên. | nội dung dialog đặt lại (`:504`) | BR-12 |
| COPY-65 | Không | lựa chọn từ chối trong mọi dialog Có/Không (`:504`, `:507`, `:510`) | trùng chuỗi → một ID |
| COPY-66 | Có | lựa chọn xác nhận trong mọi dialog Có/Không (`:504`, `:507`, `:510`) | trùng chuỗi → một ID |
| COPY-67 | {ngày} đã có món này. Mỗi món chỉ được đặt một lần trong một ngày. | toast khi thêm/kéo món trùng ngày (`:199`) | BR-14 |
| COPY-68 | {ngày} đã có tối đa 3 món. Hãy gỡ bớt một món trước khi thêm. | toast khi ngày đủ 3 món (`:202`, `:237`) | BR-14; phải báo rõ, không disable im lặng |

### 5.5 SC-06 — Checklist

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-69 | Đang tiến hành | nhãn trạng thái trên thẻ tiến độ (`:475`) | |
| COPY-70 | {đã tick} / {tổng} mục đã hoàn tất | phụ đề thẻ tiến độ (`:475`) | |
| COPY-71 | Tất cả mục {n} | tiêu đề danh sách mục (`:476`) | |
| COPY-72 | Thêm nguyên liệu hoặc sản phẩm từ thư viện | nút mở Add-from-library picker (`:478`) | |
| COPY-73 | Tên mục phát sinh | `aria-label` ô nhập mục phát sinh (`:479`) | nhãn trợ năng |
| COPY-74 | Thêm mục phát sinh | placeholder ô nhập mục phát sinh (`:479`) | |
| COPY-75 | Thêm | nút submit form mục phát sinh (`:479`) | |
| COPY-76 | Chưa có danh sách đang hoạt động | tiêu đề empty state tab Checklist (`:481`) | |
| COPY-77 | Xem trước nội dung từ kế hoạch tuần rồi xác nhận để tạo phiên mua sắm. | mô tả empty state tab Checklist (`:481`) | |
| COPY-78 | Khác (phát sinh) | tiêu đề nhóm item phát sinh (`:532`) | khác danh mục “Khác” (`COPY-58`, `02` §4) |
| COPY-79 | Hoàn tất | huy hiệu khi mọi mục trong nhóm đã tick (`:535`); nút xác nhận dialog hoàn tất (`:508`) | trùng chuỗi → một ID |
| COPY-80 | Xóa Checklist | nút nguy hiểm ở chân tab Checklist (`:482`); nút xác nhận dialog xoá (`:503`) | BR-18 |
| COPY-81 | Xóa checklist? | tiêu đề dialog xoá Checklist (`:554`) | |
| COPY-82 | Xóa checklist đang hoạt động? | câu hỏi trong dialog xoá Checklist (`:503`) | |
| COPY-83 | Tất cả mục và trạng thái đã đánh dấu sẽ bị xóa. | cảnh báo trong dialog xoá Checklist (`:503`) | |
| COPY-84 | Checklist đã được xóa. | toast sau khi xoá phiên (`:387`) | BR-18 |
| COPY-85 | Bỏ đánh dấu | `aria-label` khi dòng đã tick (`:535`) | nhãn trợ năng |
| COPY-86 | Đánh dấu | `aria-label` khi dòng chưa tick (`:535`) | nhãn trợ năng |
| COPY-87 | Sửa {tên} | `aria-label` nút bút chì trên dòng (`:535`) | |
| COPY-88 | Xóa {tên} | `aria-label` nút thùng rác trên dòng (`:535`) | |
| COPY-89 | Lưu | nút lưu khi sửa tại chỗ (`:535`); nút submit form entity (`:509`) | trùng chuỗi → một ID |
| COPY-90 | Danh sách mua sắm | tiêu đề dialog preview (`:555`) | |
| COPY-91 | Xem trước danh sách được tạo từ kế hoạch tuần hiện tại. | câu dẫn dialog preview (`:505`) | |
| COPY-92 | Tạo danh sách mới? | tiêu đề dialog ghi đè (`:556`) | |
| COPY-93 | Danh sách đang hoạt động sẽ được thay bằng danh sách mới từ kế hoạch tuần. | nội dung dialog ghi đè (`:507`) | BR-05.7 |
| COPY-94 | Mỗi lựa chọn được thêm thành một mục riêng trong danh sách. | câu dẫn dialog Add-from-library (`:506`) | |
| COPY-95 | Tìm nguyên liệu hoặc sản phẩm | placeholder ô tìm trong Add-from-library (`:506`) | |
| COPY-96 | Đóng | nút đóng footer dialog Meal picker (`:500`), Add-from-library (`:506`), nút X / đóng snapshot (`:499`, `:510`); `aria-label` nút X (`:499`) | trùng chuỗi → một ID |
| COPY-97 | Nguyên liệu | nhãn tab Thư viện (`:486`); nhãn nhóm dòng nguyên liệu không thuộc placement (`:534`); phụ đề item trong Add-from-library (`:506`); legend khối chọn nguyên liệu (`:509`); nhãn bộ lọc nguyên liệu (`:487`) | trùng chuỗi → một ID |
| COPY-98 | Danh sách đã được lưu. | toast sau khi tạo Checklist (`:297`) | |
| COPY-99 | Tên mục không được để trống. | lỗi khi thêm mục phát sinh rỗng (`:314`) | |
| COPY-100 | Không lưu được danh sách: {lỗi} | toast khi lưu Active Checklist thất bại (`:230`) | `{lỗi}` đến từ §5.6 |

### 5.6 SC-02 / SC-03 / SC-04 — Thư viện

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-101 | Món ăn | nhãn tab nội bộ Thư viện (`:486`); tiêu đề dialog entity khi tạo món (`:558`); tiêu đề nhóm trong preview (`:541`) | trùng chuỗi → một ID |
| COPY-102 | Tìm {món ăn\|nguyên liệu\|sản phẩm} | placeholder ô tìm của Thư viện, đổi theo tab (`:487`) | một khuôn, 3 biến thể |
| COPY-103 | Thêm {món ăn\|nguyên liệu\|sản phẩm} | nút tạo ở empty state (`:488`); `aria-label` + `title` của FAB (`:489`) | một khuôn, 3 biến thể |
| COPY-104 | {n} nguyên liệu | phụ đề row món (`:488`) | |
| COPY-105 | Được dùng trong {danh sách món} | phụ đề row nguyên liệu đang được món tham chiếu (`:488`) | BR-04.2 |
| COPY-106 | Tên | nhãn trường tên trong form entity (`:509`) | |
| COPY-107 | Tìm nguyên liệu | placeholder ô tìm nguyên liệu trong form món (`:509`) | |
| COPY-108 | Tên không được để trống. | lỗi form khi tên rỗng/toàn khoảng trắng (`:342`) | BR-02 |
| COPY-109 | Tên này đã có trong thư viện. | lỗi form khi tên trùng sau chuẩn hoá (`:345`) | BR-03 |
| COPY-110 | Không thể xóa. Ingredient đang được dùng trong: {danh sách món}. | toast chặn xoá nguyên liệu (`:364`) | BR-04.2; còn lẫn từ tiếng Anh — xem §7 |
| COPY-111 | Không thể xóa món ăn đang có trong kế hoạch tuần. | toast chặn xoá món (`:368`) | BR-04.1 |
| COPY-112 | Không thể xóa sản phẩm đang có trong kế hoạch tuần. | toast chặn xoá sản phẩm (`:373`) | BR-04.1 |
| COPY-113 | Xác nhận xóa | tiêu đề dialog xoá entity (`:553`) | |
| COPY-114 | Bạn có chắc muốn xóa “{tên}” khỏi thư viện? | câu hỏi dialog xoá entity (`:502`) | dùng ngoặc kép cong “ ” |
| COPY-115 | Thao tác này không thể hoàn tác. | cảnh báo dialog xoá entity (`:502`) | |
| COPY-116 | Xóa | nút xác nhận dialog xoá entity (`:502`) | |
| COPY-117 | Không lưu được lên Supabase: {lỗi} | toast khi lưu thư viện/kế hoạch thất bại (`:194`) | `{lỗi}` đến từ §5.7 |

### 5.7 SC-07 — Hoàn tất mua sắm

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-118 | Từ ngày | nhãn trường ngày bắt đầu (`:508`); nhãn trong chi tiết snapshot (`:510`) | DEC-028 |
| COPY-119 | Đến ngày | nhãn trường ngày kết thúc (`:508`); nhãn trong chi tiết snapshot (`:510`) | DEC-028 |
| COPY-120 | Lưu bản ghi chỉ đọc vào Lịch sử. Có thể hoàn tất dù còn mục chưa được đánh dấu. | câu dẫn dialog hoàn tất (`:508`) | FR-08 |
| COPY-121 | Vui lòng nhập Từ ngày và Đến ngày. | lỗi thiếu ngày (`:320`) | trùng `messages.ts` “date range is required” → dùng chung ID |
| COPY-122 | Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc. | lỗi khoảng ngày sai (`:321`, `:508`) | trùng `messages.ts` “date_from must be <= date_to” → dùng chung ID |
| COPY-123 | Bản ghi đã được lưu vào Lịch sử. | toast sau khi hoàn tất (`:326`) | |
| COPY-124 | Không thể hoàn tất mua sắm: {lỗi} | toast khi lưu snapshot thất bại (`:330`) | DEC-038 |

### 5.8 SC-08 — Cài đặt & Lịch sử

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-125 | Đăng nhập Supabase | phụ đề thẻ Tài khoản (`:493`) | |
| COPY-126 | Đăng xuất | nút đăng xuất trong thẻ Tài khoản (`:493`) | FR-01 |
| COPY-127 | Lịch sử | tiêu đề thẻ Lịch sử (`:494`); tiêu đề dialog snapshot (`:559`, `:561`) | DEC-028 |
| COPY-128 | Bản ghi mua sắm đã hoàn tất | phụ đề thẻ Lịch sử (`:494`) | |
| COPY-129 | {n} mục · {thời điểm tạo} | phụ đề row snapshot (`:494`) | |
| COPY-130 | Xem | nút mở snapshot (`:494`) | |
| COPY-131 | Chưa có lịch sử | tiêu đề empty state Lịch sử (`:494`) | |
| COPY-132 | Bản ghi sẽ xuất hiện tại đây sau khi bạn hoàn tất mua sắm. | mô tả empty state Lịch sử (`:494`) | |
| COPY-133 | Thời điểm tạo | nhãn trong chi tiết snapshot (`:510`) | |
| COPY-134 | Xóa bản ghi | nút mở xác nhận xoá snapshot (`:510`) | BR-17 |
| COPY-135 | Xóa bản ghi này khỏi Lịch sử? | câu hỏi khi xác nhận xoá snapshot (`:510`) | BR-17 |
| COPY-136 | Không xóa được bản ghi. | toast khi xoá snapshot thất bại (`:510`) | |

### 5.9 Phụ lục A — thông báo kỹ thuật do `messages.ts` sinh

Hiển thị qua toast/lỗi trường. Chưa được chốt câu chữ ở tài liệu trước — **cần PO duyệt**; nếu PO gộp/bỏ, sửa bảng này chứ không sửa `messages.ts` trước.

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-137 | Email chưa được xác nhận. Kiểm tra hộp thư để xác nhận rồi đăng nhập. | `authRules` — `email not confirmed` | chờ duyệt |
| COPY-138 | Bạn đã thử quá nhiều lần. Vui lòng thử lại sau. | `authRules` — rate limit | chờ duyệt |
| COPY-139 | Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại. | `authRules` — network | BR-09 |
| COPY-140 | Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại. | `authRules` — jwt/token | chờ duyệt |
| COPY-141 | Không thể xác thực tài khoản. Vui lòng thử lại. | `authErrorMessage` fallback | chờ duyệt |
| COPY-142 | Dữ liệu gửi lên không đủ thông tin bắt buộc. | `saveRules` — not-null | chờ duyệt |
| COPY-143 | Dữ liệu bị trùng với dữ liệu đã có. | `saveRules` — unique | chờ duyệt |
| COPY-144 | Dữ liệu liên kết không còn tồn tại. | `saveRules` — foreign key | chờ duyệt |
| COPY-145 | Tài khoản này không được phép thực hiện thao tác đó. | `saveRules` — RLS/permission | BR-01 |
| COPY-146 | Dữ liệu kế hoạch không hợp lệ. | `saveRules` — invalid shopping data | chờ duyệt |
| COPY-147 | Danh sách không hợp lệ. | `saveRules` — checklist items must be an array | chờ duyệt |
| COPY-148 | Danh sách trống, không có gì để lưu. | `saveRules` — checklist items must not be empty | chờ duyệt |
| COPY-149 | Danh sách này đã kết thúc. Hãy tạo danh sách mới từ kế hoạch tuần. | `saveRules` — no active checklist | DEC-038 |
| COPY-150 | Không lưu được dữ liệu lên Supabase. | `saveErrorMessage` fallback | chờ duyệt |

`date range is required` → `COPY-121`; `date_from must be <= date_to` → `COPY-122` (trùng nguyên văn, không cấp ID mới).

### 5.10 Chuỗi bổ sung khi đối chiếu toàn bộ `page.tsx`

| ID | Chuỗi | Nơi dùng | Ghi chú |
|---|---|---|---|
| COPY-151 | Thêm từ thư viện | tiêu đề dialog Add-from-library (`page.tsx:560`) | cấp ID nối tiếp cuối bảng; chuỗi này lọt lưới khi lập bảng theo luồng |
| COPY-152 | Loại thư viện | `aria-label` của tablist nội bộ Thư viện (`page.tsx:486`) | nhãn trợ năng |

---

## 6. Bảng ID cũ ở đâu

| Nguồn cũ | Nay |
|---|---|
| Notion “Screen Specification” §2 — SC-01…SC-08 | §1 (giữ nguyên ID, thêm cột Tab) |
| Notion “Screen Specification” §2.1 — cây điều hướng 3 tab | §2 (đã là 4 tab theo DEC-030) |
| Notion “Screen Specification” §4 — mô tả từng screen | §1 + §3 + `02` (hành vi), không chép lại |
| Notion “Component Specification” §3 — CMP-01…CMP-20 | §3 (giữ nguyên ID, thêm cột hiện thực) |
| Notion “Component Specification” §4 — component contracts | §4 (rút gọn, tham chiếu BR/FR) |
| SRS §11 — chuỗi UI đã chốt | §5.1 (COPY-01…05) + phần còn lại của §5 |
| Chuỗi mới phát sinh từ code | §5.2–§5.9 (COPY-08…150) |

---

## 7. Điểm chưa chốt / lệch với code

Ghi lại để PO hoặc issue sau xử lý; **không** tự đổi hành vi.

1. **Nhãn tab 2.** `DEC-030` gọi là “Checklist”; code render “Danh sách” (`COPY-32`). Doc giữ nguyên văn code. Cần một DEC để chọn: đổi nhãn code, hay sửa DEC-030.
2. **Từ tiếng Anh lẫn trong copy.** `COPY-110` (“Ingredient đang được dùng trong…”), `COPY-84` (“Checklist đã được xóa.”), `COPY-80/81/82` (“Checklist”). Không phải lỗi chính tả — nhưng chưa có quyết định nào về việc có Việt hoá hay không.
3. **Copy chặn món chưa có nguyên liệu.** Screen Specification ghi câu tiếng Việt lẫn thuật ngữ (“Meal chưa có Ingredient…”). Code hiện dùng `COPY-06` thuần Việt. Doc lấy code làm chuẩn; Notion giữ làm lịch sử.
4. **5 hay 7 danh mục.** Screen/Component Specification ghi 5; code và `02` §4 có 7 (`DEC-040`). `02` là nhà của danh mục — doc này chỉ tham chiếu.
5. **`COPY-137…150`** chưa được PO duyệt câu chữ (Phụ lục A).
6. **Toast 2,6 s** là hằng số hiện thực (`page.tsx:122`), chưa phải yêu cầu; nếu PO muốn khác thì thành yêu cầu mới.
