@echo off
echo ============================================
echo  Dust 1947 Development Environment
echo ============================================
echo.

REM Prüfe ob MySQL läuft
echo [0/3] Checking MySQL...
netstat -ano | findstr ":3306" > nul
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: MySQL is not running!
    echo  Please start MySQL in XAMPP Control Panel first.
    echo.
    pause
    exit /b 1
)
echo  MySQL is running! [OK]
echo.

echo [1/3] Starting PHP Backend Server on port 8000...
start "Dust1947 Backend" cmd /k "cd /d D:\private\apps\dust1947 && C:\xampp\php\php.exe -S localhost:8000"

timeout /t 3 /nobreak > nul

echo [2/3] Starting React Frontend on port 3000...
start "Dust1947 Frontend" cmd /k "cd /d D:\private\apps\dust1947\dust1947-frontend && npm start"

echo.
echo ============================================
echo  Dust 1947 Development Environment Started!
echo ============================================
echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  phpMyAdmin: http://localhost/phpmyadmin
echo.
echo  Press any key to close this window...
pause > nul

