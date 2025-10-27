@echo off
echo ========================================
echo   DEPLOY CORE FEATURES BRANCH
echo ========================================
echo.
echo This will:
echo 1. Switch to main branch
echo 2. Merge dev/core-features into main
echo 3. Push to GitHub
echo 4. Deploy to production server
echo.
echo Press Ctrl+C to cancel or
pause

cd /d "C:\Projects\Creatix"

echo.
echo [1/5] Switching to main branch...
git checkout main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to checkout main
    pause
    exit /b 1
)

echo.
echo [2/5] Pulling latest changes from origin/main...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to pull from origin
    pause
    exit /b 1
)

echo.
echo [3/5] Merging dev/core-features into main...
git merge dev/core-features --no-ff -m "Merge dev/core-features into main"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Merge conflict! Please resolve manually
    pause
    exit /b 1
)

echo.
echo [4/5] Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push to GitHub
    pause
    exit /b 1
)

echo.
echo [5/5] Deploying to production server...
"C:\Program Files\PuTTY\plink.exe" -ssh root@45.129.128.121 -pw "pzaNtMznbq@hw3" -batch "cd /root/Creatix && git pull origin main && docker compose build app && docker compose up -d app"

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
pause
