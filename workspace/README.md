# Brand assets — Shopping Memo

Exported app icons and store artwork. Use this folder on **Windows** (APK) and **macOS** (iOS).

## Layout

```
workspace/
├── README.md
├── ios/
│   └── AppIcon.appiconset/    # Xcode app icon set (1024, 512, 180, …)
├── android/
│   └── mipmap-*/ic_launcher.png
└── marketing/
    ├── appstore.png           # 1024 store / marketing
    └── playstore.png          # Play Store feature graphic
```

## Regenerate web + Android icons (any OS)

From repo root:

```bash
python scripts/generate_pwa_icons.py
```

Reads `workspace/ios/AppIcon.appiconset/1024.png` and copies `workspace/android/` into `frontend/android/.../mipmap-*`.

## Android APK (Windows / CI)

```bash
# frontend/.env.local → production HTTPS URLs first
python scripts/generate_pwa_icons.py
./scripts/build-android-apk.ps1   # Windows
# Output: frontend/dist/android/shopping-memo-debug.apk
```

See [docs/MOBILE-ANDROID.md](../docs/MOBILE-ANDROID.md).

## iOS app (macOS only)

1. Clone repo on Mac; ensure `workspace/ios/AppIcon.appiconset/` is present.
2. Frontend env: copy `frontend/.env.production.local.example` → `frontend/.env.local` (production Supabase + API).
3. Add iOS platform (once):

```bash
cd frontend
npm install
npm install @capacitor/ios
npx cap add ios
```

4. Sync web build + copy icons:

```bash
python3 ../scripts/generate_pwa_icons.py
npm run cap:sync:android   # or: npm run build:mobile && npx cap sync ios
npx cap sync ios
```

5. In Xcode (`npx cap open ios`), set **App Icon** to the asset catalog or drag `workspace/ios/AppIcon.appiconset` into `App/App/Assets.xcassets`.

6. Configure signing team → Run on device/simulator.

See [docs/MOBILE-IOS.md](../docs/MOBILE-IOS.md) for details.

## Updating the icon

Replace `workspace/ios/AppIcon.appiconset/1024.png` (and other sizes if needed), update `workspace/android/` exports, then run `python scripts/generate_pwa_icons.py` and rebuild the native app.
