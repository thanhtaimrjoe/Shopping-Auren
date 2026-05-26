# Shopping Memo — Android (Capacitor)

Ứng dụng web Next.js được đóng gói thành app Android native shell bằng [Capacitor](https://capacitorjs.com/).

## Yêu cầu

| Công cụ | Ghi chú |
|---------|---------|
| Node.js 20+ | Đã dùng cho frontend |
| Android Studio | SDK, emulator hoặc thiết bị USB |
| JDK 17+ | Thường đi kèm Android Studio |

## Cấu trúc

```
frontend/
├── capacitor.config.ts   # appId, webDir=out
├── android/              # Dự án Gradle (Capacitor)
├── out/                  # Static export (gitignored, tạo khi build)
└── src/components/CapacitorNative.tsx
```

- **App ID**: `com.shoppingmemo.app`
- **Web assets**: thư mục `out/` sau `npm run build:mobile`

## Build & chạy trên emulator / máy thật

### 1. Cấu hình API (bắt buộc trước khi build)

Biến `NEXT_PUBLIC_*` được nhúng lúc `next build`. Sao chép mẫu:

```bash
cp frontend/.env.mobile.example frontend/.env.local
# Chỉnh URL Supabase + Backend cho môi trường deploy hoặc dev
```

**Lưu ý emulator Android:** không dùng `localhost` của máy host. Dùng `10.0.2.2` (xem `.env.mobile.example`).

### 2. Build web + đồng bộ Android

```bash
cd frontend
npm run cap:sync:android
```

### 3. Mở Android Studio

```bash
npm run cap:open:android
```

Trong Android Studio: chọn device → **Run** (▶).

Hoặc một lệnh (cần `adb` + device):

```bash
npm run cap:run:android
```

## Quy trình phát triển

| Bước | Lệnh |
|------|------|
| Sửa UI/logic Next.js | `npm run dev` (trình duyệt, nhanh) |
| Kiểm tra trên Android | `npm run cap:sync:android` → Run trong Android Studio |
| Chỉ đồng bộ sau khi đã build | `npx cap sync android` |

Sau mỗi thay đổi frontend cần chạy lại `cap:sync:android` (hoặc `build:mobile` + `cap sync`).

## PWA vs Capacitor

- Trình duyệt / PWA: Service Worker vẫn bật (`RegisterSW`).
- App Android native: Service Worker **tắt**; shell dùng WebView + plugin Status Bar / Splash Screen.

## Phát hành (APK / AAB)

1. Đặt `.env.local` trỏ production (HTTPS).
2. `npm run cap:sync:android`
3. Android Studio → **Build → Generate Signed Bundle / APK**

## iOS (sau này)

Cùng codebase Capacitor. Khi sẵn sàng (macOS + Xcode):

```bash
npm install @capacitor/ios
npx cap add ios
npm run build:mobile && npx cap sync ios
npx cap open ios
```

## Xử lý sự cố

| Triệu chứng | Gợi ý |
|-------------|--------|
| Màn hình trắng | Chạy lại `npm run cap:sync:android`; kiểm tra `out/` có file |
| API lỗi / không kết nối | Kiểm tra `NEXT_PUBLIC_API_URL`; emulator dùng `10.0.2.2` |
| HTTP bị chặn | `network_security_config.xml` cho phép cleartext dev |
| Đăng nhập redirect | Cần cấu hình deep link Supabase + `@capacitor/app` (bước nâng cao) |

## Tham khảo

- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Next.js static export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
