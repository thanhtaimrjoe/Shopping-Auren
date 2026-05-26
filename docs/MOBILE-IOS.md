# Shopping Memo — iOS (Capacitor, macOS)

Build the same Next.js app as a native iOS shell. Brand icons live in **`workspace/ios/`** at the repo root (committed for Mac setup).

## Requirements

| Tool | Notes |
|------|--------|
| macOS | Required for Xcode |
| Xcode 15+ | iOS SDK, signing |
| Node.js 20+ | Same as frontend |
| Apple Developer account | For device / TestFlight (optional for simulator) |

## 1. Clone & env

```bash
git clone https://github.com/thanhtaimrjoe/Shopping-Auren.git
cd Shopping-Auren/frontend
cp .env.production.local.example .env.local
# Edit Supabase + API URLs (HTTPS production)
npm install
```

## 2. Add iOS (first time only)

```bash
npm install @capacitor/ios
npx cap add ios
```

## 3. Icons from `workspace/`

From repo root:

```bash
python3 scripts/generate_pwa_icons.py
```

Then sync Capacitor:

```bash
cd frontend
npm run build:mobile
npx cap sync ios
```

In Xcode (`npx cap open ios`):

- Open `App` → `Assets.xcassets` → **AppIcon**
- Replace with icons from `workspace/ios/AppIcon.appiconset/` (drag folder or import each size per `Contents.json`)

## 4. Run

```bash
cd frontend
npx cap open ios
```

Select a simulator or device → **Run** (▶). Set **Signing & Capabilities** → Team.

## 5. Release (brief)

1. `frontend/.env.local` → production URLs  
2. `npm run build:mobile && npx cap sync ios`  
3. Xcode → **Product → Archive** → Distribute (App Store / Ad Hoc)

## Troubleshooting

| Issue | Hint |
|-------|------|
| White screen | Re-run `npm run build:mobile && npx cap sync ios` |
| API errors | Check `NEXT_PUBLIC_API_URL` (HTTPS); not `localhost` on device |
| Auth redirect | Configure Supabase redirect URLs + Capacitor deep links (advanced) |

## Related

- Brand assets: [workspace/README.md](../workspace/README.md)  
- Android: [MOBILE-ANDROID.md](./MOBILE-ANDROID.md)
