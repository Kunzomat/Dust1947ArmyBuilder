@echo off
echo ========================================
echo MySQL KOMPLETT NEU AUFBAUEN
echo ========================================
echo.
echo WARNUNG: Dies loescht ALLE InnoDB-Systemdateien!
echo.
echo Deine Benutzertabellen bleiben erhalten, aber:
echo - Die mysql.plugin Tabelle wird neu erstellt
echo - Alle InnoDB-internen Daten gehen verloren
echo.
echo Dieses Skript:
echo 1. Stoppt MySQL
echo 2. Sichert die alten InnoDB-Dateien
echo 3. Loescht ibdata1 und alle ib_logfile*
echo 4. Entfernt den Recovery-Modus
echo 5. MySQL erstellt beim naechsten Start neue, saubere Dateien
echo.

set /p confirm="Moechtest du fortfahren? (J/N): "
if /i not "%confirm%"=="J" (
    echo Abgebrochen.
    pause
    exit /b 0
)

echo.
echo Stoppe MySQL...
net stop mysql 2>nul
taskkill /F /IM mysqld.exe 2>nul
timeout /t 3 /nobreak >nul
echo MySQL gestoppt.

echo.
echo Erstelle Backup der alten Dateien...
set timestamp=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%

if not exist "C:\xampp\mysql\data\old_innodb" mkdir "C:\xampp\mysql\data\old_innodb"

if exist "C:\xampp\mysql\data\ibdata1" (
    move "C:\xampp\mysql\data\ibdata1" "C:\xampp\mysql\data\old_innodb\ibdata1_%timestamp%.bak"
    echo   - ibdata1 gesichert
)
if exist "C:\xampp\mysql\data\ib_logfile0" (
    move "C:\xampp\mysql\data\ib_logfile0" "C:\xampp\mysql\data\old_innodb\ib_logfile0_%timestamp%.bak"
    echo   - ib_logfile0 gesichert
)
if exist "C:\xampp\mysql\data\ib_logfile1" (
    move "C:\xampp\mysql\data\ib_logfile1" "C:\xampp\mysql\data\old_innodb\ib_logfile1_%timestamp%.bak"
    echo   - ib_logfile1 gesichert
)
if exist "C:\xampp\mysql\data\ib_buffer_pool" (
    del "C:\xampp\mysql\data\ib_buffer_pool"
    echo   - ib_buffer_pool geloescht
)

echo.
echo Entferne Recovery-Modus aus my.ini...
powershell -Command "(Get-Content 'C:\xampp\mysql\bin\my.ini') -replace '^innodb_force_recovery=.*', '#innodb_force_recovery=1' | Set-Content 'C:\xampp\mysql\bin\my.ini'"
echo Recovery-Modus deaktiviert.

echo.
echo ========================================
echo Vorbereitung abgeschlossen!
echo ========================================
echo.
echo NAECHSTE SCHRITTE:
echo 1. Oeffne das XAMPP Control Panel
echo 2. Klicke auf "Start" bei MySQL
echo 3. MySQL erstellt automatisch neue InnoDB-Dateien
echo 4. Teste deine Datenbanken in phpMyAdmin
echo.
echo Deine Datenbanktabellen sollten noch vorhanden sein!
echo (Sie sind in separaten .frm/.ibd Dateien gespeichert)
echo.
echo Falls Probleme auftreten, befinden sich Backups in:
echo C:\xampp\mysql\data\old_innodb\
echo.
pause

