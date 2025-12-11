@echo off
color 0A
echo ========================================
echo   Starting CuteCart POS System
echo ========================================
echo.
echo Checking frontend build...
if not exist "frontend\dist\frontend\browser\index.html" (
    echo Building frontend for production...
    cd frontend
    call npm run build:prod
    cd ..
    echo ✓ Frontend build complete
) else (
    echo ✓ Frontend already built
)
echo.
echo Starting servers...
start cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm run serve:prod"
echo.
echo ✓ Backend running on port 3000
echo ✓ Frontend serving on port 4200
echo.
echo Access application at:
echo   Local: http://localhost:4200
echo   Network: http://^<your-ip^>:4200
echo.
echo Default login: admin / admin123
echo.
echo NOTE: Serving pre-built production files
echo To rebuild frontend, delete frontend\dist folder
echo.
pause
