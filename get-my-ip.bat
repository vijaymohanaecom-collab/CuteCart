@echo off
echo ========================================
echo   Your IP Address
echo ========================================
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo IPv4 Address: %%a
echo.
pause
