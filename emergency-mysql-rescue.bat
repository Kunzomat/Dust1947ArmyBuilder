@echo off
echo ========================================
echo MySQL NOTFALL-RETTUNG - Recovery Level 6
echo ========================================
echo.
echo WARNUNG: Dies ist die letzte Rettungsoption!
echo Recovery Level 6 ist sehr aggressiv und kann zu Datenverlust fuehren.
echo.
echo Was dieses Skript tut:
echo 1. Versucht MySQL mit Recovery Level 6 zu starten
echo 2. Exportiert alle rettbaren Datenbanken
echo 3. Baut MySQL komplett neu auf
echo 4. Importiert die geretteten Daten
echo.
pause

:try_start
echo.
echo ========================================
echo SCHRITT 1: MySQL mit Recovery Level 6 starten
echo ========================================
echo.
echo Recovery Level 6 ist bereits in my.ini aktiviert.
echo.
echo JETZT:
echo 1. Oeffne das XAMPP Control Panel
echo 2. Klicke auf "Start" bei MySQL
echo 3. Warte 10 Sekunden
echo.
set /p started="Ist MySQL gestartet? (J/N): "
if /i not "%started%"=="J" (
    echo.
    echo Wenn MySQL nicht startet, muessen wir die Daten neu aufbauen.
    echo Dies bedeutet Datenverlust von allen Aenderungen seit dem letzten Backup!
    echo.
    set /p rebuild="Moechtest du MySQL komplett neu aufbauen? (J/N): "
    if /i "%rebuild%"=="J" goto rebuild_from_scratch
    goto end
)

:export_data
echo.
echo ========================================
echo SCHRITT 2: Datenbank exportieren
echo ========================================
echo.
echo Exportiere alle Datenbanken...

set timestamp=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
set backupfile=mysql_recovery_backup_%timestamp%.sql

"C:\xampp\mysql\bin\mysqldump.exe" -u root --all-databases --single-transaction --quick --lock-tables=false > "%~dp0%backupfile%" 2>nul

if %errorlevel% equ 0 (
    echo.
    echo ✓ Backup erfolgreich: %backupfile%
    echo.
) else (
    echo.
    echo FEHLER: Backup fehlgeschlagen!
    echo Versuche einzelne Datenbanken zu exportieren...

    echo Exportiere dust1947_army_builder Datenbank...
    "C:\xampp\mysql\bin\mysqldump.exe" -u root dust1947_army_builder > "%~dp0dust1947_backup_%timestamp%.sql" 2>nul

    if %errorlevel% equ 0 (
        echo ✓ dust1947_army_builder exportiert
    ) else (
        echo ✗ Konnte dust1947_army_builder nicht exportieren
    )
)

echo.
echo Stoppe MySQL jetzt im XAMPP Control Panel...
pause

:rebuild_from_scratch
echo.
echo ========================================
echo SCHRITT 3: MySQL komplett neu aufbauen
echo ========================================
echo.
echo WARNUNG: Alle InnoDB-Dateien werden geloescht!
echo Stelle sicher dass:
echo - MySQL gestoppt ist
echo - Ein Backup existiert (falls vorhanden)
echo.
set /p confirm="Fortfahren mit Neuaufbau? (J/N): "
if /i not "%confirm%"=="J" goto end

echo.
echo Stoppe MySQL...
net stop mysql 2>nul
taskkill /F /IM mysqld.exe 2>nul
timeout /t 3 /nobreak >nul

echo Erstelle Sicherungskopie der alten Dateien...
if not exist "C:\xampp\mysql\data\old_innodb_backup" mkdir "C:\xampp\mysql\data\old_innodb_backup"
move "C:\xampp\mysql\data\ibdata1" "C:\xampp\mysql\data\old_innodb_backup\ibdata1_%timestamp%.bak" 2>nul
move "C:\xampp\mysql\data\ib_logfile0" "C:\xampp\mysql\data\old_innodb_backup\ib_logfile0_%timestamp%.bak" 2>nul
move "C:\xampp\mysql\data\ib_logfile1" "C:\xampp\mysql\data\old_innodb_backup\ib_logfile1_%timestamp%.bak" 2>nul

echo Entferne Recovery-Modus...
powershell -Command "(Get-Content 'C:\xampp\mysql\bin\my.ini') -replace '^innodb_force_recovery=6', '#innodb_force_recovery=6' | Set-Content 'C:\xampp\mysql\bin\my.ini'"

echo.
echo ========================================
echo SCHRITT 4: MySQL neu starten
echo ========================================
echo.
echo Starte jetzt MySQL im XAMPP Control Panel.
echo MySQL wird komplett neue InnoDB-Dateien erstellen.
echo.
pause

echo.
set /p restore="Moechtest du das Backup wiederherstellen? (J/N): "
if /i not "%restore%"=="J" goto end

:restore_data
echo.
echo ========================================
echo SCHRITT 5: Backup wiederherstellen
echo ========================================
echo.
echo Verfuegbare Backup-Dateien:
dir /b *backup*.sql 2>nul
echo.
set /p backupfile="Gib den Dateinamen ein: "

if not exist "%backupfile%" (
    echo Datei nicht gefunden!
    goto end
)

echo.
echo Importiere Datenbank...
"C:\xampp\mysql\bin\mysql.exe" -u root < "%backupfile%"

if %errorlevel% equ 0 (
    echo.
    echo ✓ Datenbank erfolgreich wiederhergestellt!
) else (
    echo.
    echo ✗ Fehler beim Import!
    echo Versuche manuell: mysql -u root ^< %backupfile%
)

:end
echo.
echo ========================================
echo Fertig!
echo ========================================
echo.
pause

