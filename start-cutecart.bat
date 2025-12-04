@echo off
color 0A
echo ========================================
echo   Starting CuteCart POS System
echo ========================================
echo.
start cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm run start:prod"
echo.
echo ✓ Backend starting on port 3000
echo ✓ Frontend starting on port 4200
echo.
echo Access application at:
echo   Local: http://localhost:4200
echo   Network: http://^<your-ip^>:4200
echo.
echo Default login: admin / admin123
echo.
pause
