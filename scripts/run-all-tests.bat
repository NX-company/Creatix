@echo off
echo ========================================
echo   AUTO TEST LAUNCHER
echo ========================================
echo.
echo Starting automated testing...
echo.

REM Проверяем что туннель к БД запущен
echo [1/3] Checking DB tunnel...
netstat -ano | findstr ":5432" >nul
if %ERRORLEVEL% NEQ 0 (
    echo DB tunnel NOT running! Starting it now...
    start "DB Tunnel" cmd /c "cd /d c:\Projects\Creatix && start-db-tunnel.bat"
    echo Waiting 3 seconds for tunnel to establish...
    timeout /t 3 /nobreak >nul
) else (
    echo DB tunnel already running
)

REM Проверяем что dev сервер запущен
echo.
echo [2/3] Checking dev server...
netstat -ano | findstr ":3001" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Dev server NOT running! Please start it manually with: npm run dev
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo Dev server already running on port 3001
)

REM Запускаем тесты
echo.
echo [3/3] Running automated tests...
echo.
cd /d c:\Projects\Creatix
npx tsx scripts\test-full-flow.ts

echo.
echo ========================================
echo   Tests completed
echo ========================================
pause
