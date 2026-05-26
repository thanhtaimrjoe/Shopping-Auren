# Build Shopping Memo debug APK (Windows).
# Requires: JDK 17+, Android SDK (installed by this script on first run).

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Frontend = Join-Path $Root "frontend"
$Android = Join-Path $Frontend "android"
$SdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$Dist = Join-Path $Frontend "dist\android"

function Ensure-Java {
    $java = Get-Command java -ErrorAction SilentlyContinue
    if (-not $java) {
        $candidates = @(
            "C:\Program Files\Microsoft\jdk-17*\bin\java.exe",
            "C:\Program Files\Java\*\bin\java.exe"
        )
        foreach ($pattern in $candidates) {
            $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                $env:Path = "$(Split-Path $found.FullName);$env:Path"
                break
            }
        }
    }
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        throw "Java not found. Install: winget install Microsoft.OpenJDK.17"
    }
}

function Ensure-AndroidSdk {
    $sdkManager = Join-Path $SdkRoot "cmdline-tools\latest\bin\sdkmanager.bat"
    if (Test-Path $sdkManager) { return }

    Write-Host "Installing Android command-line tools to $SdkRoot ..."
    New-Item -ItemType Directory -Force -Path (Join-Path $SdkRoot "cmdline-tools") | Out-Null
    $zipUrl = "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip"
    $zipPath = Join-Path $env:TEMP "cmdline-tools.zip"
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
    $extractDir = Join-Path $env:TEMP "cmdline-tools-extract"
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
    $latest = Join-Path $SdkRoot "cmdline-tools\latest"
    if (Test-Path $latest) { Remove-Item $latest -Recurse -Force }
    Move-Item (Join-Path $extractDir "cmdline-tools") $latest
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

    $env:ANDROID_HOME = $SdkRoot
    $env:ANDROID_SDK_ROOT = $SdkRoot
    $licensesDir = Join-Path $SdkRoot "licenses"
    New-Item -ItemType Directory -Force -Path $licensesDir | Out-Null
    @(
        @{ File = "android-sdk-license"; Content = "24333f8a63b6825eec19f86f039b711b50140f27`n" },
        @{ File = "android-sdk-preview-license"; Content = "84831b9409648a918e30573bcd34528eb4fd108f`n" }
    ) | ForEach-Object {
        Set-Content -Path (Join-Path $licensesDir $_.File) -Value $_.Content -NoNewline -Encoding ASCII
    }

    $packages = @(
        "platform-tools",
        "platforms;android-36",
        "build-tools;35.0.1"
    )
    & $sdkManager --sdk_root=$SdkRoot @packages | Out-Host
}

Ensure-Java
Ensure-AndroidSdk

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
"sdk.dir=$($SdkRoot -replace '\\','\\')" | Set-Content (Join-Path $Android "local.properties") -Encoding ASCII

Push-Location $Frontend
npm run cap:sync:android
Pop-Location

Push-Location $Android
& .\gradlew.bat assembleDebug --no-daemon
Pop-Location

$apk = Get-ChildItem -Path (Join-Path $Android "app\build\outputs\apk\debug") -Filter "*.apk" | Select-Object -First 1
if (-not $apk) { throw "APK not found after build." }

New-Item -ItemType Directory -Force -Path $Dist | Out-Null
$outApk = Join-Path $Dist "shopping-memo-debug.apk"
Copy-Item $apk.FullName $outApk -Force
Write-Host ""
Write-Host "APK ready: $outApk" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $outApk).Length / 1MB, 2)) MB"
