# Run Next.js dev server using frontend/.env.local (production Supabase + Render API).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontend ".env.local"))) {
  Write-Host "Missing frontend/.env.local — copy from frontend/.env.production.local.example and fill keys." -ForegroundColor Yellow
  exit 1
}

Write-Host "Starting frontend (production env via .env.local)..." -ForegroundColor Cyan
Write-Host "  Supabase + API: see frontend/.env.local" -ForegroundColor DarkGray
Write-Host "  App: http://localhost:3000" -ForegroundColor Green

Set-Location $frontend
if (-not (Test-Path "node_modules")) {
  npm install
}
npm run dev
