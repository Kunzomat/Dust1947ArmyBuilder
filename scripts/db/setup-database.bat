@echo off
echo ========================================
echo  Dust 1947 - Datenbank Setup
echo ========================================
echo.

REM Prüfe ob MySQL läuft
echo [1/3] Checking MySQL...
netstat -ano | findstr ":3306" > nul
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: MySQL is not running!
    echo.
    echo  Please start MySQL in XAMPP Control Panel first:
    echo  1. Open XAMPP Control Panel
    echo  2. Click 'Start' next to MySQL
    echo  3. Run this script again
    echo.
    pause
    exit /b 1
)
echo  MySQL is running! [OK]
echo.

echo [2/3] Testing MySQL connection...
C:\xampp\mysql\bin\mysql.exe -u root -e "SELECT VERSION();" > nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Cannot connect to MySQL!
    echo  Please check XAMPP MySQL is running.
    echo.
    pause
    exit /b 1
)
echo  MySQL connection OK! [OK]
echo.

echo [3/3] Setting up database...
echo.
echo Creating database 'dust1947'...
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS dust1947 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo Importing schema...
C:\xampp\mysql\bin\mysql.exe -u root dust1947 < "%~dp0backend\database\schema.sql"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Database is ready!
    echo ========================================
    echo.
    echo  Database: dust1947
    echo  Host: localhost:3306
    echo  User: root
    echo  Password: (empty)
    echo.
    echo You can now start the development server:
    echo   start-dev.bat
    echo.
) else (
    echo.
    echo  ERROR: Failed to import schema!
    echo  Please check the error messages above.
    echo.
)

pause

