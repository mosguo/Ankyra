$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[Ankyra] Preparing local stack..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "[Ankyra] .env not found. Created from .env.example." -ForegroundColor Yellow
  } else {
    throw ".env.example not found."
  }
}

$envFile = Get-Content ".env" -Raw
$redisUrl = "redis://127.0.0.1:6379"
if ($envFile -match "REDIS_URL=(.+)") {
  $redisUrl = $Matches[1].Trim()
}

Write-Host "[Ankyra] Expected Redis URL: $redisUrl" -ForegroundColor DarkCyan
Write-Host "[Ankyra] If Redis is not running, start it first." -ForegroundColor Yellow

npm run dev:setup
npm run dev:all
