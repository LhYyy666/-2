param(
  [switch]$SkipInstall = $false,
  [switch]$OpenBrowser = $true,
  [string]$DevScript = "",
  [switch]$NoStart = $false
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
function Test-Node {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "未检测到 Node.js，请先安装 Node.js"; exit 1 }
}
function Install-Deps($dir) {
  if ($SkipInstall) { return }
  if (-not (Test-Path (Join-Path $dir "package.json"))) { return }
  if (-not (Test-Path (Join-Path $dir "node_modules"))) {
    Push-Location $dir
    npm install
    Pop-Location
  }
}
function Read-Script($dir) {
  $pkgPath = Join-Path $dir "package.json"
  if (-not (Test-Path $pkgPath)) { return $null }
  $pkg = Get-Content -Raw $pkgPath | ConvertFrom-Json
  if ($DevScript -ne "") { return $DevScript }
  if ($pkg.scripts.dev) { return "dev" }
  if ($pkg.scripts.start) { return "start" }
  if ($pkg.scripts.serve) { return "serve" }
  return $null
}
function Start-Dev($dir, $script) {
  if (-not $script) { return }
  Start-Process -FilePath "powershell.exe" -WorkingDirectory $dir -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command npm run $script"
}
Test-Node
$web = Join-Path $root "web-admin"
$cloud = Join-Path $root "cloud-functions\adminService"
Install-Deps $web
Install-Deps $cloud
if (-not $NoStart) {
  $scriptName = Read-Script $web
  Start-Dev $web $scriptName
  Start-Sleep -Seconds 2
  if ($OpenBrowser) {
    $url = "http://localhost:5173/"
    Start-Process $url
  }
}
