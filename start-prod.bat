@echo off
color 0A
echo ========================================
echo   Starting CuteCart - PRODUCTION MODE
echo ========================================
echo.
echo Environment: PRODUCTION
echo Backend Port: 3000
echo Frontend Port: 4200
echo Database: database.db
echo.
start cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm run start:prod"
echo.
echo ✓ Production backend starting on port 3000
echo ✓ Production frontend starting on port 4200
echo.
echo Access application at:
echo   Local: http://localhost:4200
echo   Network: http://^<your-ip^>:4200
echo.
echo Default login: admin / admin123
echo.
echo NOTE: This is PRODUCTION mode
echo Using production database and settings
echo.
pause
