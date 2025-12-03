@echo off
echo ========================================
echo   CuteCart Firewall Setup
echo ========================================
echo.
echo This will configure Windows Firewall to allow
echo CuteCart access from other devices on your network.
echo.
echo You need Administrator privileges to run this.
echo.
pause

PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0setup-firewall.ps1'"

pause
