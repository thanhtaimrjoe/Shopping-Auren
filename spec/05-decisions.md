---
id: spec-decisions
status: draft
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
note: "DEC-001…DEC-039 chưa được import (P3). File này hiện chỉ chứa các quyết định phát sinh từ đợt refactor spec 2026-11-12."
---

# 05 — Nhật ký quyết định (append-only)

Quy tắc: **không sửa, không xoá** mục cũ. Thay đổi ý → thêm mục mới với `Supersedes: DEC-xxx`.

Phân quyền: `decided_by: PO` cho quyết định kinh doanh; `decided_by: AI-delegated` cho quyết định kỹ thuật / cấu trúc trong quyền được PO giao (2026-11-12). PO override bất cứ lúc nào.

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
