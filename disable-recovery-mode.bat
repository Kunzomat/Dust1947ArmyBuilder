@echo off
echo ========================================
echo MySQL Recovery-Modus deaktivieren
echo ========================================
echo.

echo WARNUNG: Nur ausfuehren, wenn:
echo 1. MySQL erfolgreich gestartet wurde
echo 2. Ein Backup erstellt wurde
echo 3. Alle Daten zugreifbar sind
echo.
set /p confirm="Fortfahren? (J/N): "
if /i not "%confirm%"=="J" (
    echo Abgebrochen.
    pause
    exit /b 0
)

echo.
echo Stoppe MySQL...
net stop mysql 2>nul
timeout /t 2 /nobreak >nul

echo Deaktiviere Recovery-Modus in my.ini...
powershell -Command "(Get-Content 'C:\xampp\mysql\bin\my.ini') -replace '^innodb_force_recovery=1', '#innodb_force_recovery=1' | Set-Content 'C:\xampp\mysql\bin\my.ini'"

echo.
echo Recovery-Modus wurde deaktiviert!
echo.
echo Starte MySQL jetzt im XAMPP Control Panel neu.
echo MySQL laeuft dann wieder im normalen Modus mit vollem Funktionsumfang.
echo.
pause

