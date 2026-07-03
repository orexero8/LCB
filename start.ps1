Write-Host "=== Starting PGLite database ==="
$pglite = Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "pglite-server --db ./data/pglite --port 51214" -PassThru
Start-Sleep -Seconds 3

Write-Host "`n=== Pushing Prisma schema ==="
npx prisma db push
if ($?) {
    Write-Host "`n=== Seeding database ==="
    npx tsx prisma/seed.ts
}

Write-Host "`n=== Starting Next.js dev server ==="
npx next dev

$pglite.Kill()
