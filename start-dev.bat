@echo off
color 0B
echo ========================================
echo   Starting CuteCart - DEVELOPMENT MODE
echo ========================================
echo.
echo Environment: DEVELOPMENT
echo Backend Port: 3001
echo Frontend Port: 4201
echo Database: database.dev.db
echo.
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm start"
echo.
echo ✓ Development backend starting on port 3001
echo ✓ Development frontend starting on port 4201
echo.
echo Access application at:
echo   Local: http://localhost:4201
echo.
echo Default login: admin / admin123
echo.
echo NOTE: This is DEVELOPMENT mode with hot-reload enabled
echo Changes to code will automatically refresh
echo.
pause
