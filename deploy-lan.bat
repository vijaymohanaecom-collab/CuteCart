@echo off
color 0B
echo ========================================
echo   CuteCart LAN Deployment Wizard
echo ========================================
echo.

REM Step 1: Get IP Address
echo [Step 1/5] Detecting your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP:~1%

if "%IP%"=="" (
    echo ERROR: Could not detect IP address!
    echo Please run 'ipconfig' manually to find your IP.
    pause
    exit /b 1
)

echo.
echo Your IP Address: %IP%
echo.
set /p CONFIRM="Is this correct? (y/n): "
if /i "%CONFIRM%"=="n" (
    set /p IP="Enter your IP address: "
)

echo.
echo ========================================
echo [Step 2/5] Checking Prerequisites...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo ✓ npm is installed

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo.
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)
echo ✓ Backend dependencies ready

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo.
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)
echo ✓ Frontend dependencies ready

echo.
echo ========================================
echo [Step 3/5] Configuring Network Settings...
echo ========================================
echo.

REM Update frontend environment
powershell -Command "(Get-Content frontend\src\environments\environment.network.ts) -replace 'http://.*:3000/api', 'http://%IP%:3000/api' | Set-Content frontend\src\environments\environment.network.ts"
echo ✓ Frontend configured for network access
echo   API URL: http://%IP%:3000/api

echo.
echo ========================================
echo [Step 4/5] Checking Database...
echo ========================================
echo.

if not exist "backend\database.sqlite" (
    echo Initializing database...
    cd backend
    call npm run init-db
    cd ..
    echo ✓ Database initialized
) else (
    echo ✓ Database already exists
)

echo.
echo ========================================
echo [Step 5/5] Firewall Configuration
echo ========================================
echo.
echo IMPORTANT: You need to configure Windows Firewall
echo to allow connections on ports 3000 and 4200.
echo.
echo Options:
echo   1. Run setup-firewall.bat as Administrator (Recommended)
echo   2. Manually configure firewall
echo   3. Skip (may not work from other devices)
echo.
set /p FIREWALL="Configure firewall now? (y/n): "

if /i "%FIREWALL%"=="y" (
    echo.
    echo Please run 'setup-firewall.bat' as Administrator
    echo Right-click on setup-firewall.bat and select "Run as Administrator"
    echo.
    echo Press any key after configuring firewall...
    pause >nul
)

echo.
echo ========================================
echo   Configuration Complete!
echo ========================================
echo.
echo Your CuteCart is ready for LAN deployment!
echo.
echo Access URLs:
echo   Local:   http://localhost:4200
echo   Network: http://%IP%:4200
echo.
echo Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo Next Steps:
echo   1. Start CuteCart: run 'start-cutecart.bat'
echo   2. Access from mobile: http://%IP%:4200
echo   3. Change default password in Settings
echo.
echo For detailed instructions, see: LAN_DEPLOYMENT_GUIDE.md
echo.
pause
