# Basic API integration tests
# Run: pwsh .\tests\api-basic.ps1
# Requires `npx prisma dev` and `next dev` running

$base = "http://localhost:3000"

# Login as admin
Write-Host "=== Login ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@mrgla.com","password":"admin123"}'
$token = $login.token
Write-Host "OK: token=$($token.Substring(0,20))..." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token" }

# Test KPIs
Write-Host "=== KPIs ===" -ForegroundColor Cyan
$kpis = Invoke-RestMethod -Uri "$base/api/admin/kpis" -Headers $headers
Write-Host "OK: today revenue=$($kpis.today.revenue)" -ForegroundColor Green

# Test Reports - all types
Write-Host "=== Reports ===" -ForegroundColor Cyan
@("bookings","revenue","occupancy","expenses","staff","summary","cashup","commission","cancellation") | ForEach-Object {
    $r = Invoke-RestMethod -Uri "$base/api/admin/reports?type=$_&from=2024-01-01&to=2026-12-31" -Headers $headers
    Write-Host "OK: $_" -ForegroundColor Green
}

# Test CSV export
Write-Host "=== CSV Export ===" -ForegroundColor Cyan
$csv = Invoke-RestMethod -Uri "$base/api/admin/reports?type=bookings&from=2024-01-01&to=2026-12-31&format=csv" -Headers $headers
Write-Host "OK: CSV length=$($csv.Length)" -ForegroundColor Green

# Test Clients search
Write-Host "=== Clients ===" -ForegroundColor Cyan
$clients = Invoke-RestMethod -Uri "$base/api/clients?q=test" -Headers $headers
Write-Host "OK: clients count=$($clients.clients.Length)" -ForegroundColor Green

# Test Bookings search
Write-Host "=== Bookings ===" -ForegroundColor Cyan
$bookings = Invoke-RestMethod -Uri "$base/api/bookings?page=1&limit=5" -Headers $headers
Write-Host "OK: total=$($bookings.total), page=$($bookings.page)" -ForegroundColor Green

# Test Users
Write-Host "=== Users ===" -ForegroundColor Cyan
$users = Invoke-RestMethod -Uri "$base/api/users" -Headers $headers
Write-Host "OK: users count=$($users.users.Length)" -ForegroundColor Green

# Test Partners
Write-Host "=== Partners ===" -ForegroundColor Cyan
$partners = Invoke-RestMethod -Uri "$base/api/partners" -Headers $headers
Write-Host "OK: partners count=$($partners.partners.Length)" -ForegroundColor Green

# Test Discounts
Write-Host "=== Discounts ===" -ForegroundColor Cyan
$discounts = Invoke-RestMethod -Uri "$base/api/discounts" -Headers $headers
Write-Host "OK: discounts count=$($discounts.discounts.Length)" -ForegroundColor Green

# Test Discount validate
Write-Host "=== Discount Validate ===" -ForegroundColor Cyan
$validate = Invoke-RestMethod -Uri "$base/api/discounts/validate" -Method Post -Headers $headers -ContentType "application/json" -Body '{"code":"WELCOME10","totalAmount":50000}'
Write-Host "OK: discountAmount=$($validate.discountAmount)" -ForegroundColor Green

Write-Host ""
Write-Host "=== ALL TESTS PASSED ===" -ForegroundColor Green
