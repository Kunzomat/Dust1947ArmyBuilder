@echo off
echo ============================================
echo  phpMyAdmin öffnen für Dust1947
echo ============================================
echo.

REM Prüfe ob Apache läuft
netstat -ano | findstr ":80 " | findstr "LISTENING" > nul
if %errorlevel% neq 0 (
    echo.
    echo  WARNUNG: Apache läuft nicht!
    echo  Bitte starten Sie Apache im XAMPP Control Panel.
    echo.
    echo  Drücken Sie eine Taste, um XAMPP Control Panel zu öffnen...
    pause > nul
    start "" "C:\xampp\xampp-control.exe"
    exit /b 1
)

REM Prüfe ob MySQL läuft
netstat -ano | findstr ":3306" | findstr "LISTENING" > nul
if %errorlevel% neq 0 (
    echo.
    echo  WARNUNG: MySQL läuft nicht!
    echo  Bitte starten Sie MySQL im XAMPP Control Panel.
    echo.
    pause
    exit /b 1
)

echo  Apache ist aktiv [OK]
echo  MySQL ist aktiv [OK]
echo.
echo  Öffne phpMyAdmin im Browser...
echo.

REM Öffne phpMyAdmin
start "" "http://localhost/phpmyadmin"

echo  ✓ phpMyAdmin wurde geöffnet!
echo.
echo  Login: root (ohne Passwort)
echo  Datenbank: dust1947
echo.

timeout /t 3 > nul

