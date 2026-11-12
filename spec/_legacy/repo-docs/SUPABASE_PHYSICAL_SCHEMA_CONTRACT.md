# Đặc tả Lược đồ Vật lý và Hợp đồng Truy xuất Dữ liệu Supabase (TASK-025)

**Mã task:** TASK-025  
**Loại:** Thiết kế kỹ thuật (Design)  
**Mức độ ưu tiên:** P1  
**Căn cứ quyết định:** PO Decision DEC-035 (Direct Client-to-Supabase Architecture, no Render backend for MVP)  
**Trạng thái:** Hoàn tất (Ready for PO Review / Done)  

---

## 1. Tổng quan Kiến trúc Dữ liệu

Theo quyết định **DEC-035**, Shopping-Auren MVP áp dụng mô hình truy cập trực tiếp từ trình duyệt đến Supabase:
* **Xác thực:** Supabase Auth (Email & Password), cấp phát JWT token có `sub = auth.uid()`.
* **Quyền riêng tư:** Row-Level Security (RLS) bắt buộc trên 100% bảng dữ liệu nghiệp vụ; người dùng chỉ có thể đọc/ghi dữ liệu của chính mình (`user_id = auth.uid()`).
* **Tính toàn vẹn (ACID):** Sử dụng các PostgreSQL RPC function (`security invoker`) để đảm bảo lưu dữ liệu đa bảng trong một giao dịch duy nhất, không bị phân mảnh hay mất dữ liệu khi mất kết nối mạng giữa chừng.

---

## 2. Kiểu dữ liệu đặc biệt (Custom Enums)

### 2.1. `public.shopping_category`
Phân loại dành cho sản phẩm tiêu dùng định kỳ trong gia đình:
* `Vệ sinh nhà cửa`
* `Giấy và đồ dùng một lần`
* `Chăm sóc cá nhân`
* `Đồ dùng gia đình`
* `Khác` (giá trị mặc định)

### 2.2. `public.checklist_item_kind`
Nguồn gốc của từng mục hàng trong danh sách mua sắm:
* `ingredient`: Mục xuất phát từ nguyên liệu của món ăn.
* `product`: Mục xuất phát từ sản phẩm định kỳ trong tuần.
* `other`: Mục do người dùng thêm tự do trực tiếp tại checklist.

---

## 3. Lược đồ Bảng Vật lý (Physical Tables)

### 3.1. Nhóm Thư viện (Library Tables)
* **`public.ingredients`**: Danh mục nguyên liệu.
  * `id` (uuid, PK, default gen_random_uuid())
  * `user_id` (uuid, FK auth.users, cascade delete)
  * `name` (text, check length > 0)
  * Unique index chống trùng lặp theo tên chuẩn hóa: `(user_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')))`

* **`public.meals`**: Danh mục món ăn.
  * `id` (uuid, PK)
  * `user_id` (uuid, FK auth.users, cascade delete)
  * `name` (text, check length > 0)
  * Unique index chống trùng lặp theo tên chuẩn hóa tương tự nguyên liệu.

* **`public.meal_ingredients`**: Bảng liên kết món ăn và nguyên liệu (Many-to-Many).
  * `user_id` (uuid, FK auth.users)
  * `meal_id` (uuid, FK meals, cascade delete)
  * `ingredient_id` (uuid, FK ingredients, restrict delete)
  * `position` (smallint, default 0, thứ tự nguyên liệu trong món)
  * PK `(meal_id, ingredient_id)`

* **`public.products`**: Danh mục sản phẩm tiêu dùng.
  * `id` (uuid, PK)
  * `user_id` (uuid, FK auth.users)
  * `name` (text, check length > 0)
  * `category` (public.shopping_category)
  * Unique index chống trùng lặp tên sản phẩm trong cùng tài khoản.

---

### 3.2. Nhóm Kế hoạch Tuần (Weekly Plan Tables)
* **`public.weekly_plans`**: Kế hoạch tuần của người dùng (tỷ lệ 1-1 với user).
  * `id` (uuid, PK)
  * `user_id` (uuid, unique, FK auth.users)
  * `updated_at` (timestamptz, default now())

* **`public.weekly_plan_meals`**: Các món ăn được xếp vào 7 ngày trong tuần.
  * `id` (uuid, PK)
  * `user_id` (uuid, FK auth.users)
  * `plan_id` (uuid, FK weekly_plans)
  * `meal_id` (uuid, FK meals, restrict delete)
  * `weekday` (smallint, check 1..7 tương ứng Thứ Hai .. Chủ Nhật)
  * `position` (smallint, check 1..3 tương ứng tối đa 3 món/ngày)
  * Unique constraints: `(plan_id, weekday, position)` và `(plan_id, weekday, meal_id)`

* **`public.weekly_plan_products`**: Sản phẩm định kỳ được chọn cho tuần.
  * `user_id` (uuid, FK auth.users)
  * `plan_id` (uuid, FK weekly_plans)
  * `product_id` (uuid, FK products, restrict delete)
  * PK `(plan_id, product_id)`

---

### 3.3. Nhóm Danh sách Mua sắm & Lịch sử (Checklist & History Tables)
* **`public.active_checklists`**: Phiên mua sắm đang hoạt động (1-1 với user).
  * `id` (uuid, PK)
  * `user_id` (uuid, unique, FK auth.users)
  * `created_at` (timestamptz)

* **`public.active_checklist_items`**: Các mặt hàng trong phiên mua sắm.
  * `id` (uuid, PK)
  * `user_id` (uuid, FK auth.users)
  * `checklist_id` (uuid, FK active_checklists, cascade delete)
  * `source_ingredient_id` (uuid, FK ingredients, on delete set null)
  * `source_product_id` (uuid, FK products, on delete set null)
  * `kind` (public.checklist_item_kind)
  * `name_snapshot` (text, lưu tên tại thời điểm tạo checklist)
  * `category_snapshot` (public.shopping_category)
  * `meal_name_snapshot` (text, tên món ăn nguồn)
  * `placement_id` (text, phân biệt món trùng ngày)
  * `checked` (boolean, default false)
  * `position` (integer, vị trí hiển thị)
  * Check constraint tính hợp lệ: đảm bảo source FK khớp với `kind`.

* **`public.shopping_history`**: Lưu trữ các phiên mua sắm đã kết thúc.
  * `id` (uuid, PK)
  * `user_id` (uuid, FK auth.users)
  * `date_from` (date), `date_to` (date, check date_from <= date_to)
  * `items_snapshot` (jsonb array chứa danh sách vật phẩm đóng băng)
  * `created_at` (timestamptz)

---

## 4. Hợp đồng Thủ tục Giao dịch (Atomic RPC Contracts)

### 4.1. `public.save_shopping_data(p_data jsonb)`
* **Mục đích:** Lưu toàn bộ thay đổi của Thư viện (nguyên liệu, món, sản phẩm) và Kế hoạch tuần trong 1 giao dịch.
* **Cơ chế bảo vệ (Hardened Guard):**
  ```sql
  if jsonb_typeof(p_data->'ingredients') is distinct from 'array'
    or jsonb_typeof(p_data->'meals') is distinct from 'array'
    or jsonb_typeof(p_data->'products') is distinct from 'array'
    or jsonb_typeof(p_data->'plan') is distinct from 'object'
    or jsonb_typeof(p_data->'planProductIds') is distinct from 'array'
  then raise exception 'Invalid shopping data'; end if;
  ```
* **Bảo mật:** `security invoker` — tự động nhận diện `auth.uid()` từ phiên JWT của người gọi; từ chối thực thi nếu chưa đăng nhập.

### 4.2. `public.save_active_checklist(p_items jsonb)`
* **Mục đích:** Lưu hoặc làm rỗng phiên mua sắm hiện tại.
* **Cơ chế:** Nhận mảng các item hoặc `null` (nếu hủy checklist); cập nhật bảng `active_checklists` và `active_checklist_items` đồng thời.

---

## 5. Đối ứng TypeScript Contract (`src/lib/shopping-types.ts`)

Mọi thực thể vật lý đều có kiểu TypeScript tương ứng trong mã nguồn:
* `Ingredient` $\leftrightarrow$ `public.ingredients`
* `Meal` $\leftrightarrow$ `public.meals` + `public.meal_ingredients`
* `Product` $\leftrightarrow$ `public.products`
* `Plan` $\leftrightarrow$ `public.weekly_plans` + `public.weekly_plan_meals`
* `ChecklistItem` $\leftrightarrow$ `public.active_checklist_items`
* `Snapshot` $\leftrightarrow$ `public.shopping_history`
