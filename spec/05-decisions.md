---
id: spec-decisions
status: approved
owner: Yano
decided_by: PO
updated: 2026-11-12
supersedes: []
note: "DEC-001…039 nhập từ Decision Log trên Notion ngày 2026-11-12 (bản rút gọn, giữ nguyên quyết định). DEC-040…046 phát sinh trong đợt refactor spec."
---

# 05 — Nhật ký quyết định (append-only)

Quy tắc: **không sửa, không xoá** mục cũ. Thay đổi ý → thêm mục mới với `Supersedes: DEC-xxx`.

Phân quyền: `decided_by: PO` cho quyết định kinh doanh; `decided_by: AI-delegated` cho quyết định kỹ thuật / cấu trúc trong quyền được PO giao (2026-11-12). PO override bất cứ lúc nào.

---

## DEC-001 — Đặt lại kế hoạch tuần
**Quyết định:** "Đặt lại mẫu" hiển thị xác nhận Có/Không. Có → xoá trắng 7 ngày và mọi sản phẩm đã chọn; Không → giữ nguyên. Đây là "xoá trắng", không phải khôi phục kế hoạch mẫu. (Q-007 bổ sung: giữ nguyên Checklist đang hoạt động.)

## DEC-002 — Xem trước Checklist
**Quyết định:** bấm tạo → mở cửa sổ xem trước, người dùng rà soát rồi xác nhận ở cuối.
**decided_by:** PO

## DEC-003 — Gỡ món khỏi kế hoạch tuần
**Quyết định:** nút "×" chỉ gỡ món khỏi ngày đó, không xoá khỏi thư viện.

## DEC-004 — Gỡ sản phẩm khỏi kế hoạch tuần
**Quyết định:** chỉ gỡ khỏi kế hoạch hiện tại, không xoá khỏi thư viện.

## DEC-005 — Snapshot khi hoàn tất
**Quyết định:** lưu bất biến **tất cả** mục (đã tick và chưa tick). Trong Lịch sử: đã tick hiện biểu tượng chọn, chưa tick hiện dấu X.

## DEC-006 — Tổng số mục và tiến độ (lịch sử)
**Quyết định ban đầu:** chỉ tính nguyên liệu phát sinh từ kế hoạch + sản phẩm được chọn.
**Trạng thái:** superseded bởi DEC-013.

## DEC-007 — Bỏ nút "Quản lý sản phẩm" khỏi Checklist
**Quyết định:** gỡ nút khỏi thẻ Checklist; quản lý sản phẩm nằm ở thư viện.

## DEC-008 — Khoảng ngày của snapshot
**Quyết định (Q-008):** khi hoàn tất hiển thị pop-up với 2 trường bắt buộc Date From / Date To; From ≤ To; lưu kèm snapshot và timestamp riêng. Khoảng ngày thuộc lần mua, không gắn ngày thực tế vào Weekly Plan.

## DEC-009 — Không thêm cảnh báo khi lưu Weekly Plan
**Quyết định (Q-009):** không cảnh báo khi lưu/sửa Weekly Plan; chỉ "Đặt lại mẫu" có xác nhận Có/Không.

## DEC-010 — Xây UI mới từ đặc tả, không từ prototype cũ
**Quyết định:** UI cũ/prototype chỉ là tài liệu tham khảo, không phải nền tảng kiến trúc. Thứ tự: ổn định yêu cầu → screen/component spec → design system → build → verify.

## DEC-011 — Checklist mới ghi đè Checklist đang hoạt động (lịch sử)
**Quyết định ban đầu (Q-010):** tạo Checklist mới thì ghi đè, **không** cần pop-up xác nhận.
**Trạng thái:** superseded bởi DEC-024 — nay phải xác nhận ghi đè.

## DEC-012 — Checklist theo Meal + chặn Meal rỗng
**Quyết định (Q-011):** MVP có chế độ xem Checklist theo Meal; nguyên liệu trùng tên ở các Meal khác có checkbox riêng (duplicate được phép); checkbox chỉ chia sẻ giữa Meal view và dòng tương ứng trong Checklist tổng; Meal tự hoàn tất khi mọi nguyên liệu của nó được tick, bỏ tick → chưa hoàn tất. Meal rỗng không thêm được vào Weekly Plan, phải hiện thông báo đã chốt.
**Ghi chú:** phần "chế độ xem theo Meal" bị hoãn ở MVP — xem DEC-041.

## DEC-013 — Tổng item và tiến độ (hiện hành)
**Quyết định (Q-012):** đếm mọi item tick được trong Checklist hiện tại, không tính Meal header; gồm occurrence theo Meal, Product, item thêm từ thư viện và mục phát sinh. **Supersedes DEC-006.**

## DEC-014 — Điều kiện hoàn tất và vòng đời Checklist
**Quyết định (Q-013):** được hoàn tất dù còn item chưa tick; snapshot bất biến; sau khi lưu thành công Checklist kết thúc; không tạo snapshot lặp từ Checklist đã kết thúc.

## DEC-015 — Checklist tổng hiển thị theo occurrence
**Quyết định (Q-014):** một dòng cho mỗi Meal–Ingredient occurrence; checkbox chỉ chia sẻ giữa Meal view và dòng tương ứng.

## DEC-016 — Duplicate item và nhóm "Other"
**Quyết định (Q-015):** thêm duplicate thành occurrence riêng; item phát sinh trực tiếp thuộc nhóm "Other", không phải entity thư viện, được tính vào tiến độ và lưu vào snapshot.

## DEC-017 — Thành phần Ingredient trong một Meal
**Quyết định (Q-016, A):** cùng một Ingredient tối đa một lần trong một Meal; occurrence giữa các Meal vẫn độc lập.

## DEC-018 — Đặt cùng Meal trong Weekly Plan
**Quyết định (Q-017, B):** mỗi Meal tối đa một lần trong một ngày, được đặt ở nhiều ngày; giới hạn 3 Meal/ngày vẫn áp dụng.

## DEC-019 — Xoá occurrence khỏi Checklist
**Quyết định (Q-018, A):** được xoá một occurrence khỏi Checklist đang hoạt động; không xoá bản ghi nguồn.

## DEC-020 — Sửa thông tin hiển thị của occurrence
**Quyết định (Q-019, B):** được sửa tên hiển thị/danh mục của occurrence; chỉ occurrence đó đổi, không cập nhật thư viện; snapshot sau đó lưu giá trị tại thời điểm hoàn tất.
**Ghi chú:** danh mục chỉ áp dụng cho occurrence sản phẩm (BR-16, PR #16).

## DEC-021 — Xoá snapshot History
**Quyết định (Q-020, B):** xoá được từng snapshot; snapshot còn lưu vẫn bất biến; chưa có retention, chưa có xoá hàng loạt.

## DEC-022 — Tách occurrence theo Meal placement
**Quyết định (Q-021):** không gộp placement; cùng Meal ở nhiều ngày → mỗi lượt đặt một nhóm và bộ occurrence riêng, tiến độ riêng.

## DEC-023 — Giữ occurrence khi xoá nguồn
**Quyết định (Q-022, B):** Ingredient/Product đã gỡ khỏi tham chiếu chặn xoá thì được xoá khỏi thư viện dù Checklist còn item; occurrence giữ dữ liệu hiển thị, không còn phụ thuộc bản ghi nguồn.

## DEC-024 — Xác nhận trước khi ghi đè Active Checklist
**Quyết định (Q-023):** có Active Checklist thì phải hiện xác nhận ghi đè; chỉ thay sau khi xác nhận; ghi đè thì bỏ trạng thái tick và mục phát sinh chưa lưu; snapshot đã hoàn tất không ảnh hưởng. **Supersedes DEC-011.**

## DEC-025 — Không tự đồng bộ Checklist khi lưu Weekly Plan
**Quyết định (Q-024, A):** sửa và lưu Weekly Plan không tự đồng bộ Active Checklist; chỉ khi người dùng chủ động tạo Checklist mới.

## DEC-026 — Nhãn xác nhận tiếng Việt
**Quyết định (Q-025):** giao diện chỉ tiếng Việt; nhãn xác nhận dùng "Có/Không".

## DEC-027 — Giữ placement khi xoá Meal nguồn
**Quyết định (Q-026, B):** xoá Meal sau khi đã gỡ khỏi plan, dù Checklist còn placement; Checklist giữ tên Meal đã chụp và mọi occurrence/checkbox, không mất tiến độ.

## DEC-028 — Nhãn tiếng Việt cho ngày, lịch sử, mục phát sinh
**Quyết định (Q-027, A):** "Từ ngày", "Đến ngày", "Lịch sử", nhóm "Khác (phát sinh)" — phân biệt với Category "Khác".

## DEC-029 — Primary navigation ba tab (lịch sử)
**Quyết định (Q-028, D):** ba tab: Home, Thư viện, Setting (kèm Profile/History/Sign Out).
**Trạng thái:** superseded bởi DEC-030.

## DEC-030 — Primary navigation bốn tab
**Quyết định (Q-029):** bốn tab theo thứ tự Trang chủ (Weekly Plan), **Checklist**, Thư viện, Cài đặt. History và Sign Out nằm trong Cài đặt. **Supersedes DEC-029.**

## DEC-031 — Không có Profile trong MVP
**Quyết định (Q-030, B):** Profile chỉ là nhãn/placeholder; không có màn hình hay chức năng.

## DEC-032 — Frontend technical baseline
**Quyết định (Q-032):** Next.js 16.4.3 App Router, React 19.3.1, TypeScript 5.9.3, pnpm, CSS global + next/font (Manrope/Lora) + lucide-react, ESLint 9; repo `thanhtaimrjoe/Shopping-Auren` nhánh main; FE deploy Vercel; công cụ test **chưa chọn**.

## DEC-033 — Bằng chứng tối thiểu trước review frontend
**Quyết định (Q-033, B):** phải có build + lint + smoke (chạy app, screenshot) trước khi chuyển Ready for Review; đọc tĩnh là chưa đủ.

## DEC-034 — Viewport cho responsive QA
**Quyết định (Q-034, A):** QA trên 390×844 và 384×854 CSS px + desktop; chưa làm tablet.

## DEC-035 — Data access cho MVP
**Quyết định (Q-035):** frontend gọi trực tiếp Supabase Auth + Data API/PostgREST; **không** có Render Backend trong MVP; publishable key ở client, không service-role key.

## DEC-036 — Guard cho RPC `save_shopping_data`
**Quyết định:** áp bản vá guard lên DB dev (payload thiếu key từng xoá sạch dữ liệu); giữ file migration trong repo; push commit UI-03 lên main.

## DEC-037 — Mục tiêu và người dùng hiện tại
**Quyết định (Q-036):** app phục vụ cá nhân PO, không phát hành app store/thị trường; không KPI thương mại; là case học tập BrSE. Không đổi hành vi đã chốt.

## DEC-038 — Hoàn tất mua sắm phải toàn vẹn
**Quyết định (Q-037):** chỉ coi là hoàn tất khi cả lưu History **và** đóng Checklist cùng thành công; một bước lỗi → không snapshot mới, giữ Checklist để thử lại; không snapshot trùng.
**Triển khai:** RPC `complete_shopping` (PR #15).

## DEC-039 — Deployment URL có thể công khai
**Quyết định (Q-038):** chấp nhận URL deploy công khai; vẫn phải đăng nhập và dữ liệu tách theo tài khoản; không thêm lớp giới hạn truy cập ở tầng deploy.

> Tất cả DEC-001…039 ở trên: **decided_by: PO** (ghi nhận từ Decision Log, 2026-10-28 → 2026-11-07).

---

## DEC-040 — Chấp nhận 7 danh mục sản phẩm (as-built)

- **Bối cảnh:** BRD BR-10, SRS §4 và CMP-06 chốt **5** danh mục. Ngày 2026-11-07, commit `b05f16d` + hai migration (`add_food_and_drink_categories`, `classify_existing_products_as_food_and_drink`) thêm **Thực phẩm**, **Đồ uống** và phân loại lại 59 sản phẩm. Không có Q&A hay DEC nào cho thay đổi này (quét 38 Q&A, 39 DEC).
- **Quyết định:** Chấp nhận 7 danh mục làm chuẩn. `02` §4 và `03` CMP-06 cập nhật theo. Không revert dữ liệu.
- **Lý do:** PO đã dùng thực tế 7 danh mục (88 sản phẩm, 2 snapshot sau thay đổi); "5 danh mục" chỉ đúng trước 2026-11-07. Giữ 5 sẽ buộc phải phân loại lại dữ liệu thật mà không mang lại lợi ích.
- **Hệ quả:** Danh mục vẫn là danh sách cố định (không CRUD). "Khác" ≠ "Khác (phát sinh)".
- **decided_by:** AI-delegated (PO override bằng DEC mới nếu muốn quay lại 5).
- **Kiểm chứng:** `pg_enum` = 7 giá trị; `02` §4 khớp DB.

## DEC-041 — Hoãn "chế độ xem theo món" trong Checklist

- **Bối cảnh:** FR-07/BR-05.3 yêu cầu tick được ở cả Checklist tổng và chế độ xem theo Meal, checkbox chia sẻ giữa hai view. Code hiện chỉ có Checklist tổng (`src/app/page.tsx:451`), TASK-022 vẫn được đánh Done.
- **Quyết định:** MVP chỉ có Checklist tổng. Chế độ xem theo món chuyển sang sau MVP (issue riêng). Quy tắc checkbox "chỉ chia sẻ trong cùng placement" vẫn giữ nguyên trong `02` để không mất ràng buộc khi thêm view sau.
- **Lý do:** nhu cầu thực tế (đi chợ theo danh sách tổng) đã được đáp ứng; thêm view là chi phí UI không tạo giá trị mới ở thời điểm này.
- **Hệ quả:** `02` FR-07 ghi rõ defer; TASK-022 phải bị hạ khỏi Done (đã ghi ở `08` AUR-05).
- **decided_by:** AI-delegated.

## DEC-042 — Copy chuẩn là tiếng Việt đang chạy, không phải câu lẫn Anh-Việt trong spec cũ

- **Bối cảnh:** BRD F-05/CMP-09 chốt nguyên văn "Meal chưa có Ingredient. Vui lòng thêm ít nhất một Ingredient trước khi đưa Meal vào Weekly Plan."; code hiện dùng câu tiếng Việt hoàn chỉnh. Nhiều copy khác trong app (toast, empty state) chưa có trong SRS §11.
- **Quyết định:** Toàn bộ chuỗi hiển thị được chuẩn hoá thành tiếng Việt và trích thành `COPY-xx` trong `03`, sinh ra `src/lib/copy.ts`. Không giữ câu lẫn thuật ngữ tiếng Anh trong UI.
- **Hệ quả:** `03` là nơi duy nhất chứa chuỗi; code import, không gõ lại. `02` chỉ tham chiếu `COPY-xx`.
- **decided_by:** AI-delegated.

## DEC-043 — Chấp nhận chức năng "Xoá Checklist" (kết thúc phiên không lưu lịch sử)

- **Bối cảnh:** App có nút "Xóa Checklist" + hộp thoại xác nhận (`page.tsx:459,480`), không có trong BRD/SRS/Screen/Component spec nào; CMP-20 cấm tự thêm confirm dialog.
- **Quyết định:** Giữ chức năng này và đưa vào spec: người dùng được kết thúc phiên đang hoạt động **mà không** tạo snapshot; phải xác nhận "Có/Không"; không ảnh hưởng Lịch sử đã lưu.
- **Lý do:** có ích khi tạo nhầm Checklist; đang chạy ổn; bỏ đi sẽ làm mất đường thoát khi phiên sai.
- **Hệ quả:** thêm BR-18; `03` CMP-11 cập nhật; `06` thêm kịch bản.
- **decided_by:** AI-delegated (nếu PO không muốn, xoá nút là thay đổi 1 dòng).

## DEC-044 — Spec canonical = repo, backlog = GitHub Issues, Notion đóng băng

- **Bối cảnh:** Spec tồn tại ở 3 nơi (Notion 17 trang + 3 DB, `docs/` trong repo, DB thật). Audit 2026-11-12: 5 tài liệu quy phạm chồng lấn ~85–90 KB cho 1.948 dòng code; 30 task/29 ID; 38 Q&A không câu nào đóng; 3 migration apply ngoài repo; `RELEASE_READINESS_REPORT` khai GO-LIVE khi TASK-029 còn Draft.
- **Quyết định của PO (2026-11-12):** Bỏ Notion làm nơi lưu spec. Toàn bộ spec trong repo (`spec/`). Backlog trên GitHub Issues. Không mirror Notion.
- **Quyết định kèm theo (AI-delegated):** bộ 8 file + backlog; ID giữ nguyên, không đánh số lại; decision append-only; trạng thái cần evidence; Notion để read-only làm archive, không xoá.
- **Phân quyền:** PO chỉ can thiệp ở tầng business (phạm vi, hành vi người dùng thấy, dữ liệu nghiệp vụ). Quyết định kỹ thuật/cấu trúc do AI quyết và ghi `decided_by: AI-delegated`, PO override bất cứ lúc nào.
- **Hệ quả:** `docs/*` chuyển vào `spec/_legacy/repo-docs/`; `docs/` không còn tồn tại; mọi tham chiếu Notion trong repo coi là lịch sử.
- **Kiểm chứng:** PR này (spec/repo-canonical) + issue backlog tương ứng.

## DEC-045 — Nhãn tab "Checklist" và chính sách thuật ngữ trong copy

- **Bối cảnh:** `spec/03-ui-contract.md` (PR #18) phát hiện: tab thứ hai đang render "Danh sách" trong khi `DEC-030` gọi là "Checklist"; ngoài ra copy còn lẫn thuật ngữ tiếng Anh (`Ingredient`, `Checklist`) trong câu tiếng Việt; và 14 chuỗi lỗi kỹ thuật (`COPY-137…150`) chưa từng được duyệt.
- **Quyết định của PO (2026-11-12):**
  1. Tab thứ hai mang nhãn **"Checklist"** — code đổi từ "Danh sách" sang "Checklist" để khớp `DEC-030`.
  2. **"Checklist" là thuật ngữ tiếng Anh duy nhất được giữ**; mọi thuật ngữ khác Việt hoá (`Ingredient` → "Nguyên liệu", `Meal` → "Món ăn", `Product` → "Sản phẩm").
  3. **Duyệt toàn bộ `COPY-137…150`** (thông báo kỹ thuật từ `messages.ts`) làm chuẩn.
- **Hệ quả:** mọi câu có "danh sách" chỉ phiên mua sắm đổi thành "Checklist" (nút "Tạo Checklist", "Checklist đã được lưu.", "Xóa Checklist?"…); `BR-02` vẫn yêu cầu thông báo rõ khi tên rỗng.
- **supersedes:** một phần `DEC-042` (DEC-042 nói "copy chuẩn là tiếng Việt"; nay tiếng Việt **trừ** thuật ngữ "Checklist").
- **decided_by:** PO.
- **Kiểm chứng:** PR sửa nhãn + 16 chuỗi trong `page.tsx`, 3 chuỗi trong `messages.ts`; `npm run build` + `npm run lint` xanh; bảng COPY trong `03` cập nhật cùng chữ.

## DEC-046 — CI chạy build/lint/spec-lint; harness PGlite giữ ngoài lockfile

- **Bối cảnh:** harness 35 check hiện là node script cần `@electric-sql/pglite`; repo dùng `pnpm-lock.yaml` nhưng máy build không có pnpm để cập nhật lockfile đúng cách.
- **Quyết định:** CI chạy `npm install` + `next build` (sinh `LayoutProps`) + `lint` + `spec-lint`; **không** commit `package-lock.json`. Harness PGlite chạy ở job riêng khi pnpm có sẵn, hoặc chạy tay và ghi kết quả vào `06`.
- **Lý do:** một lockfile duy nhất; tránh npm/pnpm đánh nhau; CI vẫn bắt được lỗi type-order (#11) và link/ID chết.
- **decided_by:** AI-delegated.
