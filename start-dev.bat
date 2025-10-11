@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ================================================
echo    NX STUDIO - Development Server
echo ================================================
echo.
echo Starting Next.js on port 3333...
echo.
npm run dev
