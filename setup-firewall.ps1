# CuteCart Firewall Setup Script
# Run this script as Administrator to configure Windows Firewall

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CuteCart Firewall Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "Configuring Windows Firewall rules..." -ForegroundColor Green
Write-Host ""

# Remove existing rules if they exist
Write-Host "Removing old rules (if any)..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "CuteCart Backend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "CuteCart Frontend" -ErrorAction SilentlyContinue

# Add rule for Backend (Port 3000)
Write-Host "Adding rule for Backend (Port 3000)..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "CuteCart Backend" `
    -Direction Inbound `
    -LocalPort 3000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Domain,Private,Public `
    -Description "Allow CuteCart Backend API access on port 3000"

# Add rule for Frontend (Port 4200)
Write-Host "Adding rule for Frontend (Port 4200)..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "CuteCart Frontend" `
    -Direction Inbound `
    -LocalPort 4200 `
    -Protocol TCP `
    -Action Allow `
    -Profile Domain,Private,Public `
    -Description "Allow CuteCart Frontend access on port 4200"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Firewall Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Firewall rules created:" -ForegroundColor Cyan
Write-Host "  - CuteCart Backend (Port 3000)" -ForegroundColor White
Write-Host "  - CuteCart Frontend (Port 4200)" -ForegroundColor White
Write-Host ""
Write-Host "You can now access CuteCart from other devices on your network!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: get-my-ip.bat (to find your IP address)" -ForegroundColor White
Write-Host "  2. Run: configure-network.bat (to configure network settings)" -ForegroundColor White
Write-Host "  3. Run: start-cutecart.bat (to start the application)" -ForegroundColor White
Write-Host ""
pause
