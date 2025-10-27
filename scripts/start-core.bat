@echo off
echo ========================================
echo   CORE FEATURES WORKSPACE LAUNCHER
echo ========================================
echo.
echo Opening VS Code for CORE FEATURES workspace...
echo Dev server will run on port 3002
echo.

REM Открываем VS Code в директории core
start "VS Code - Core Features" code "C:\Projects\Creatix-wt-core"

REM Ждем 2 секунды чтобы VS Code успел открыться
timeout /t 2 /nobreak >nul

REM Запускаем dev сервер на порту 3002
echo Starting dev server on port 3002...
cd /d "C:\Projects\Creatix-wt-core"
start "Dev Server - Core (3002)" cmd /k "npm run dev -- -p 3002"

echo.
echo ========================================
echo   CORE FEATURES workspace ready!
echo   VS Code: C:\Projects\Creatix-wt-core
echo   Dev Server: http://localhost:3002
echo ========================================
echo.
pause
