@echo off
echo ========================================
echo   EXPERIMENTAL WORKSPACE LAUNCHER
echo ========================================
echo.
echo Opening VS Code for EXPERIMENTAL workspace...
echo Dev server will run on port 3003
echo.

REM Открываем VS Code в директории experimental
start "VS Code - Experimental" code "C:\Projects\Creatix-wt-exp"

REM Ждем 2 секунды чтобы VS Code успел открыться
timeout /t 2 /nobreak >nul

REM Запускаем dev сервер на порту 3003
echo Starting dev server on port 3003...
cd /d "C:\Projects\Creatix-wt-exp"
start "Dev Server - Experimental (3003)" cmd /k "npm run dev -- -p 3003"

echo.
echo ========================================
echo   EXPERIMENTAL workspace ready!
echo   VS Code: C:\Projects\Creatix-wt-exp
echo   Dev Server: http://localhost:3003
echo ========================================
echo.
pause
