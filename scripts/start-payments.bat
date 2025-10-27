@echo off
echo ========================================
echo   PAYMENTS WORKSPACE LAUNCHER
echo ========================================
echo.
echo Opening VS Code for PAYMENTS workspace...
echo Dev server will run on port 3001
echo.

REM Открываем VS Code в директории payments
start "VS Code - Payments" code "C:\Projects\Creatix-wt-payments"

REM Ждем 2 секунды чтобы VS Code успел открыться
timeout /t 2 /nobreak >nul

REM Запускаем dev сервер на порту 3001
echo Starting dev server on port 3001...
cd /d "C:\Projects\Creatix-wt-payments"
start "Dev Server - Payments (3001)" cmd /k "npm run dev -- -p 3001"

echo.
echo ========================================
echo   PAYMENTS workspace ready!
echo   VS Code: C:\Projects\Creatix-wt-payments
echo   Dev Server: http://localhost:3001
echo ========================================
echo.
pause
