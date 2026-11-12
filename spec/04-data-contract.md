---
id: spec-data
status: approved
owner: Yano
decided_by: AI-delegated
updated: 2026-11-12
supersedes: []
sources: [Conceptual Data Model (Notion, archive), pg_catalog của project mpuxleglzmoaexdjgerp ngày 2026-11-12]
generated: physical section generated from the live database
---

# 04 — Hợp đồng dữ liệu

Hai phần: **khái niệm** (viết tay, ổn định) và **vật lý** (sinh từ DB thật — nếu hai phần lệch nhau thì code đã lệch spec, không phải ngược lại).

---

## 1. Mô hình khái niệm

| Thực thể | Ý nghĩa & sở hữu | Vòng đời / quy tắc |
|---|---|---|
| **Account** | Ranh giới tenant cho một tài khoản đăng nhập. Mọi dữ liệu thư viện, kế hoạch, checklist, lịch sử thuộc đúng một account. | Cách ly bằng RLS (BR-01). Không có tenant hộ gia đình, không chia sẻ. |
| **Ingredient** | Khái niệm thư viện tái sử dụng. | Tồn tại độc lập với Meal, được phép không dùng. Tên duy nhất theo account sau chuẩn hoá BR-03. |
| **Meal** | Khái niệm thư viện kiểu công thức. | Có 0..n Ingredient occurrence; mỗi Ingredient tối đa 1 lần trong một Meal (BR-13). Meal rỗng tồn tại được nhưng không đặt được vào Weekly Plan (FR-05). Xoá được sau khi gỡ khỏi plan dù Checklist còn placement (BR-04.4). |
| **Meal–Ingredient occurrence** | Một cặp (Meal, Ingredient) cụ thể. | Đại diện Ingredient *trong* Meal đó, không phải bản ghi thư viện. Trùng nguyên liệu ở hai Meal khác nhau là hai occurrence khác nhau. |
| **Product** | Khái niệm thư viện đồ dùng, có đúng một Category cố định. | Tồn tại độc lập với plan; nằm trong thư viện không tự vào Checklist. |
| **Weekly Plan** | Sa bàn 7 ngày hiện tại của một account. | Không có ngày thực tế. Tối đa 3 placement/ngày, mỗi Meal tối đa 1 lần/ngày (BR-14). Đặt lại chỉ xoá plan, không xoá Checklist (BR-12). Lưu plan không đồng bộ Checklist (BR-05.6). |
| **Weekly Plan Meal placement** | Một lượt đặt Meal vào một ngày quy ước. | Mỗi placement là một "thực thể" riêng khi sinh Checklist (BR-05.1/.2). Meal bị xoá sau đó thì Checklist giữ tên đã chụp. |
| **Weekly Plan Product selection** | Quan hệ Product được chọn cho plan hiện tại. | Chỉ sản phẩm được chọn mới sinh item ban đầu. Product thư viện không tự vào Checklist. Không chọn trùng. |
| **Active Checklist** | Phiên mua sắm đang chạy (0..1 mỗi account). | Sinh từ plan; nhận thêm occurrence từ thư viện và mục phát sinh; ghi đè cần xác nhận (BR-05.7/.8); kết thúc khi hoàn tất (FR-08) hoặc khi người dùng xoá (BR-18). |
| **Checklist item occurrence** | Một dòng tick được trong Checklist. | Có 1 trạng thái tick + dữ liệu hiển thị riêng. Nguồn: Meal–Ingredient occurrence của một placement, Product của plan, lần thêm từ thư viện, hoặc mục phát sinh. Xoá/sửa chỉ ảnh hưởng occurrence (BR-15/.16). Nguồn bị xoá → occurrence giữ dữ liệu, `source_*` thành NULL (BR-04.3). |
| **Ad-hoc item ("Khác (phát sinh)")** | Mục nhập trực tiếp, không thuộc thư viện. | Được trùng; tính vào tiến độ; lưu vào snapshot. Không tạo/mutate Ingredient hay Product. |
| **History snapshot** | Bản ghi mua sắm đã hoàn tất, bất biến. | Lưu mọi occurrence (tick và chưa tick) + dữ liệu hiển thị + khoảng ngày + timestamp. Hoàn tất = 1 transaction (FR-08). Xoá từng cái (BR-17). |

**Quan hệ chính**

- Account 1—n Ingredient / Meal / Product / snapshot; 1—0..1 Weekly Plan; 1—0..1 Active Checklist.
- Meal n—n Ingredient qua occurrence (duy nhất theo cặp).
- Weekly Plan 1—n placement (≤3/ngày, ≤1 Meal/ngày); 1—n product selection.
- Active Checklist 1—n item occurrence; header Meal không phải item.
- Active Checklist 1—1 snapshot khi hoàn tất (snapshot không tham chiếu ngược).

---

## 2. Mô hình vật lý — **sinh từ DB ngày 2026-11-12** (project `mpuxleglzmoaexdjgerp`, PostgreSQL 17.11)

Quy ước chung cho mọi bảng: `id uuid default gen_random_uuid()`, `user_id uuid not null default auth.uid()` → `auth.users(id) on delete cascade`, RLS bật, policy `auth.uid() = user_id` (USING + WITH CHECK).

### 2.1 Bảng

| Bảng | Cột chính | Ràng buộc đáng chú ý |
|---|---|---|
| `ingredients` | `id`, `user_id`, `name text not null`, `created_at` | `check length(btrim(name))>0`; unique `(user_id, lower(regexp_replace(btrim(name),'\s+',' ','g')))`; unique `(user_id,id)` |
| `meals` | `id`, `user_id`, `name`, `created_at` | như trên |
| `products` | `id`, `user_id`, `name`, `category shopping_category not null default 'Khác'`, `created_at` | như trên; category là enum cố định (§2.4) |
| `meal_ingredients` | `user_id`, `meal_id`, `ingredient_id`, `position smallint default 0` | PK `(meal_id, ingredient_id)` → chặn trùng nguyên liệu trong món (BR-13); FK meal `ON DELETE CASCADE`; FK ingredient **`ON DELETE RESTRICT`** (BR-04.2); `check position>=0` |
| `weekly_plans` | `id`, `user_id unique`, `updated_at` | unique `user_id` → mỗi account 1 plan |
| `weekly_plan_meals` | `id`, `user_id`, `plan_id`, `meal_id`, `weekday smallint`, `position smallint` | `check weekday 1..7`; `check position 1..3`; unique `(plan_id, weekday, meal_id)` và `(plan_id, weekday, position)` → BR-14; FK meal `ON DELETE RESTRICT` |
| `weekly_plan_products` | `user_id`, `plan_id`, `product_id` | PK `(plan_id, product_id)`; FK product `ON DELETE RESTRICT` |
| `active_checklists` | `id`, `user_id unique`, `created_at` | unique `user_id` → tối đa 1 phiên |
| `active_checklist_items` | `id`, `user_id`, `checklist_id`, `source_ingredient_id`, `source_product_id`, `kind checklist_item_kind`, `name_snapshot`, `category_snapshot`, `meal_name_snapshot`, `placement_id text`, `checked bool default false`, `position int` | `check (kind='ingredient'→source_product null) or (kind='product'→source_ingredient null) or kind='other'`; FK checklist `CASCADE`; FK source `ON DELETE SET NULL (cột)` → BR-04.3; `check position>=0` |
| `shopping_history` | `id`, `user_id`, `date_from date`, `date_to date`, `created_at`, `items_snapshot jsonb` | `check date_from <= date_to` (BR-08); `check jsonb_typeof(items_snapshot)='array'`; **không có policy UPDATE** → bất biến (BR-07) |

### 2.2 Enum

- `shopping_category`: `Vệ sinh nhà cửa`, `Giấy và đồ dùng một lần`, `Chăm sóc cá nhân`, `Đồ dùng gia đình`, `Khác`, `Thực phẩm`, `Đồ uống` — 7 giá trị, xem `02` §4 + DEC-040.
- `checklist_item_kind`: `ingredient`, `product`, `other`.

### 2.3 RPC (tất cả `security invoker`, `set search_path = ''`)

| Function | Chữ ký | Việc | Quyền EXECUTE |
|---|---|---|---|
| `save_shopping_data` | `(p_data jsonb) → void` | Ghi toàn bộ thư viện + plan trong 1 transaction; chặn payload thiếu key bằng `is distinct from` | `authenticated` |
| `save_active_checklist` | `(p_items jsonb) → void` | Ghi đè toàn bộ checklist; `null` = đóng phiên | `authenticated` |
| `complete_shopping` | `(p_date_from date, p_date_to date, p_items jsonb) → table(id uuid, created_at timestamptz)` | Lưu snapshot + đóng Checklist trong 1 transaction, yêu cầu đang có active checklist (FR-08) | `authenticated` |
| `rls_auto_enable` | `() → event_trigger` | Platform (Supabase) dùng để tự bật RLS cho bảng mới; không thuộc schema ứng dụng | `postgres`, `service_role` |

### 2.4 RLS & quyền

- 10/10 bảng `relrowsecurity = true`; 12 policy: 9 bảng `FOR ALL` + `shopping_history` tách `SELECT` / `INSERT` / `DELETE`. Không có policy nào cho `anon`.
- Grants: `authenticated` có SELECT/INSERT/UPDATE/DELETE; `postgres`/`service_role` full.
- **Đã sửa 2026-11-12:** `anon` trước đó có đủ DML grant trên cả 10 bảng (thừa hưởng default privileges của Supabase). RLS vẫn chặn vì không có policy cho `anon`, nhưng đã thu hồi để giảm bề mặt tấn công — migration `20261112100000_revoke_anon_table_grants.sql` (AUR-16).

### 2.5 Migration đang apply (10) — khớp đúng file trong `supabase/migrations/`

| Version | Name |
|---|---|
| 20261030162749 | shopping_data_schema |
| 20261030163455 | atomic_shopping_writes (chứa lỗi `meal.id` lịch sử) |
| 20261030170159 | import_notion_seed_user (nay là stub, seed ở `supabase/seed/`) |
| 20261031011716 | fix_save_shopping_data_meal_id_reference |
| 20261101040902 | harden_save_shopping_data_guard |
| 20261101082901 | restrict_rls_auto_enable_execution |
| 20261107091250 | add_food_and_drink_categories |
| 20261107091305 | classify_existing_products_as_food_and_drink |
| 20261112090000 | complete_shopping_atomic |
| 20261112100000 | revoke_anon_table_grants |

**Quy tắc:** không sửa file đã apply. Thay đổi schema = file mới + ghi version vào `supabase_migrations.schema_migrations` (xem `07`).

### 2.6 Bất biến dữ liệu cần giữ (đừng "tối ưu" mất)

1. Unique index tên theo `lower(regexp_replace(...))` — nếu bỏ, BR-03 mất hiệu lực.
2. `ON DELETE RESTRICT` ở `meal_ingredients.ingredient_id`, `weekly_plan_meals.meal_id`, `weekly_plan_products.product_id` — nếu đổi thành CASCADE, BR-04.1/.2 mất.
3. `ON DELETE SET NULL (cột)` ở `active_checklist_items.source_*` — nếu CASCADE, BR-04.3 mất.
4. Không có policy UPDATE trên `shopping_history` — thêm vào là phá BR-07.
5. Unique `(plan_id, weekday, meal_id)` + `check position 1..3` — BR-14 ở tầng DB, không phải chỉ UI.
6. **Collation của database phải là UTF-8** (`datcollate = en_US.UTF-8` trên prod). Index unique tên dùng `lower()`; dưới collation `C`, `lower('SƯỜN')` không fold thành `sườn` và BR-03 âm thầm mất tác dụng với tên tiếng Việt — đã gặp đúng lỗi này khi chạy harness trên PGlite (collation C), nên đừng dựng lại DB bằng collation C.
