$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

if (-not (Test-Path -LiteralPath ".\node_modules\tsx\dist\cli.mjs")) {
  Write-Host "Installing dependencies (first run)..."
  npm install
}

Write-Host "Starting app at http://localhost:3000"
node ".\node_modules\tsx\dist\cli.mjs" server.ts
