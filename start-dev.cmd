@echo off
cd /d "%~dp0"
if not exist "node_modules\tsx\dist\cli.mjs" (
  echo Installing dependencies (first run)...
  call npm install
)
echo Starting app at http://localhost:3000
node "node_modules\tsx\dist\cli.mjs" server.ts
