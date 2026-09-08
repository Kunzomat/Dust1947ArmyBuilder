@echo off
echo ========================================
echo  Dust 1947 - System Check
echo ========================================
echo.

REM Check 1: XAMPP installed
echo [1/4] Checking XAMPP installation...
if exist "C:\xampp\php\php.exe" (
    echo  XAMPP found! [OK]
    C:\xampp\php\php.exe --version | findstr /C:"PHP"
) else (
    echo  XAMPP not found! [FAILED]
    echo  Please install XAMPP from https://www.apachefriends.org/
)
echo.

REM Check 2: MySQL running
echo [2/4] Checking MySQL...
netstat -ano | findstr ":3306" > nul
if %errorlevel% equ 0 (
    echo  MySQL is running! [OK]
) else (
    echo  MySQL is NOT running! [FAILED]
    echo  Start MySQL in XAMPP Control Panel
)
echo.

REM Check 3: Database exists
echo [3/4] Checking database...
if exist "C:\xampp\mysql\bin\mysql.exe" (
    C:\xampp\mysql\bin\mysql.exe -u root -e "USE dust1947; SELECT COUNT(*) FROM blocs;" > nul 2>&1
    if %errorlevel% equ 0 (
        echo  Database 'dust1947' exists! [OK]
    ) else (
        echo  Database not found! [FAILED]
        echo  Run: setup-database.bat
    )
) else (
    echo  MySQL client not found! [FAILED]
)
echo.

REM Check 4: Node.js installed
echo [4/4] Checking Node.js...
where node > nul 2>&1
if %errorlevel% equ 0 (
    echo  Node.js found! [OK]
    node --version
    npm --version
) else (
    echo  Node.js not found! [FAILED]
    echo  Install from https://nodejs.org/
)
echo.

echo ========================================
echo  Summary
echo ========================================
echo.
echo If all checks passed, you can start:
echo   start-dev.bat
echo.
echo If something failed:
echo  - MySQL not running? Start it in XAMPP Control Panel
echo  - Database missing? Run: setup-database.bat
echo  - Node.js missing? Install from nodejs.org
echo.
pause

