@echo off
echo ========================================
echo   CuteCart Network Configuration
echo ========================================
echo.
echo Detecting IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP:~1%
echo Current IP: %IP%
echo.
set /p CONFIRM="Use this IP? (y/n): "
if /i "%CONFIRM%"=="n" (
  set /p IP="Enter IP address: "
)
powershell -Command "(Get-Content frontend\src\environments\environment.network.ts) -replace 'http://.*:3000/api', 'http://%IP%:3000/api' | Set-Content frontend\src\environments\environment.network.ts"
echo.
echo ✓ Configuration updated!
echo ✓ API URL set to: http://%IP%:3000/api
echo.
pause
