# CuteCart Authentication Test Script
Write-Host "`n=== CuteCart Authentication Test ===" -ForegroundColor Cyan

$apiUrl = "http://192.168.1.6:3000/api"
$username = "admin"
$password = "admin123"

# Test 1: Health Check
Write-Host "[1/4] Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method GET -UseBasicParsing
    Write-Host "SUCCESS: Backend is running" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Backend health check failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "[2/4] Testing login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = $username
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $token = $loginResponse.token
    $user = $loginResponse.user
    
    Write-Host "SUCCESS: Login successful!" -ForegroundColor Green
    Write-Host "User: $($user.username) Role: $($user.role)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: Login failed!" -ForegroundColor Red
    exit 1
}

# Test 3: Protected Endpoint
Write-Host "[3/4] Testing protected endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $stats = Invoke-RestMethod -Uri "$apiUrl/invoices/stats/summary" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "SUCCESS: Protected endpoint accessible!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Protected endpoint failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    exit 1
}

# Test 4: Products
Write-Host "[4/4] Testing products endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $products = Invoke-RestMethod -Uri "$apiUrl/products" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "SUCCESS: Products endpoint accessible!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Products endpoint failed!" -ForegroundColor Red
}

Write-Host "`n=== All Tests Passed ===" -ForegroundColor Green
Write-Host "Backend authentication is working correctly.`n" -ForegroundColor Gray
