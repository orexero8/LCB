@echo off
echo === Cleaning up old processes on port 51214 and 3000 ===
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :51214') do (
  if "%%a" neq "0" (
    taskkill /f /pid %%a >nul 2>&1
  )
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
  if "%%a" neq "0" (
    taskkill /f /pid %%a >nul 2>&1
  )
)
timeout /t 2 /nobreak >nul

echo === Removing old database data for clean start ===
if exist "data\pglite" rmdir /s /q "data\pglite"
mkdir "data\pglite" >nul 2>&1

echo === Starting PGlite database in new window (max 10 connections) ===
start "PGlite" node "node_modules\@electric-sql\pglite-socket\dist\scripts\server.js" --db ./data/pglite --port 51214 --max-connections 10
echo Waiting for PGlite to be ready...
timeout /t 7 /nobreak >nul

echo === Applying Prisma schema via SQL ===
node data/apply-schema.mjs

echo === Seeding database ===
node data/seed-raw.mjs

echo.
echo ========================================
echo  PGlite is running in a separate window.
echo  Close it when you are done.
echo ========================================
echo.
echo === Starting Next.js dev server ===
npx.cmd next dev -p 3000
