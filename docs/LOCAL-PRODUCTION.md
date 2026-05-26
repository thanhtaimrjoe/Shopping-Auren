# Chạy local với Supabase / API production (không Docker)

Dùng khi bạn muốn chạy UI trên máy (`localhost:3000`) nhưng dữ liệu và auth vẫn là **môi trường production** (hosted Supabase + API trên Render), **không** cần `supabase start` / Docker.

---

## Cách 1 — Chỉ Frontend (khuyến nghị, đơn giản nhất)

Frontend gọi thẳng API production trên Render. **Không cần** chạy backend local.

### 1. Env

File `frontend/.env.local` (đã gitignore):

```env
NEXT_PUBLIC_SUPABASE_URL=https://akyxznfvwogxhcwocukj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key từ Supabase Dashboard → Settings → API>
NEXT_PUBLIC_API_URL=https://shopping-auren.onrender.com/api/v1
```

Mẫu commit-safe: `frontend/.env.production.local.example`

### 2. Chạy

```powershell
cd frontend
npm install
npm run dev
```

Mở http://localhost:3000 — đăng nhập bằng tài khoản production.

### 3. Kiểm tra nhanh

```powershell
# API production
curl https://shopping-auren.onrender.com/health

# (tuỳ chọn) test script trong frontend — chỉnh API_URL trong file nếu cần
cd frontend
npm run test:conn
```

**Lưu ý:** Lần đầu sau khi Render sleep, request có thể chậm 10–30s (cold start). Đó là hành vi bình thường khi test “production” từ local.

---

## Cách 2 — Frontend local + Backend local (cùng DB production)

Dùng khi bạn sửa code backend và muốn debug trực tiếp, vẫn đọc/ghi **Supabase production**.

### 1. Backend env

Copy mẫu và điền secret từ [Supabase Dashboard](https://supabase.com/dashboard/project/akyxznfvwogxhcwocukj/settings/api):

```powershell
copy backend\.env.production.local.example backend\.env.local
```

Điền ít nhất:

| Biến | Lấy ở đâu |
|------|-----------|
| `SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (secret — không commit) |
| `SUPABASE_JWT_SECRET` | **JWT Secret** (legacy HS256; ES256 vẫn verify qua JWKS) |

### 2. Frontend env (trỏ backend local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://akyxznfvwogxhcwocukj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<cùng anon key>
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Chạy song song

Terminal 1 — backend:

```powershell
cd backend
python -m pip install -r requirements.txt
$env:PYTHONPATH = "."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2 — frontend:

```powershell
cd frontend
npm run dev
```

---

## Script tiện (Windows)

Chỉ frontend + API production:

```powershell
.\scripts\run-local-production.ps1
```

---

## So sánh với Docker local

| | Docker (`supabase start`) | Production env (doc này) |
|--|---------------------------|---------------------------|
| DB | Local Postgres | Supabase cloud |
| Auth users | Seed local | User production thật |
| API | `localhost:8000` hoặc Render | Render hoặc `localhost:8000` |
| Rủi ro | An toàn cho thử nghiệm | **Ghi dữ liệu thật** — cẩn thận khi test |

---

## Khắc phục sự cố

| Triệu chứng | Gợi ý |
|-------------|--------|
| `invalid api_key` khi login | Anon key phải cùng project `akyxznfvwogxhcwocukj` (xem CHANGELOG 2026-05-26) |
| Load rất chậm lần đầu | Render cold start; hoặc nhiều API gọi song song — sẽ tối ưu sau |
| Backend không start | Kiểm tra `backend/.env.local` không còn URL `127.0.0.1:54321` |
| CORS | Backend local cho phép `localhost:3000` trong `main.py` |
