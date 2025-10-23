@echo off
echo ========================================
echo   Creatix - SSH Tunnel to Database
echo ========================================
echo.
echo Starting SSH tunnel to production database...
echo Database will be available at localhost:5432
echo.
echo KEEP THIS WINDOW OPEN while developing!
echo Press Ctrl+C to stop the tunnel
echo.
echo ========================================
echo.

"C:\Program Files\PuTTY\plink.exe" -ssh root@45.129.128.121 -pw "pzaNtMznbq@hw3" -L 5432:172.18.0.2:5432 -N
