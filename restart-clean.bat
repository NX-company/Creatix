@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ================================================
echo    NX STUDIO - Clean Restart
echo ================================================
echo.
echo Stopping server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo.
echo Cleaning cache...
rmdir /s /q .next 2>nul
echo Cache cleared!
echo.
echo Starting server on port 3333...
echo.
npm run dev

