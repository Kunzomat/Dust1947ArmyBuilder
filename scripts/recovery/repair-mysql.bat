@echo off
echo ========================================
echo MySQL Reparatur-Tool
echo ========================================
echo.

:menu
echo Bitte waehle eine Option:
echo.
echo 1. Schritt 1: MySQL im Recovery-Modus starten
echo 2. Schritt 2: Datenbank exportieren
echo 3. Schritt 3: Recovery-Modus deaktivieren und InnoDB neu aufbauen
echo 4. Schritt 4: Datenbank wiederherstellen
echo 5. Beenden
echo.
set /p choice="Deine Wahl (1-5): "

if "%choice%"=="1" goto step1
if "%choice%"=="2" goto step2
if "%choice%"=="3" goto step3
if "%choice%"=="4" goto step4
if "%choice%"=="5" goto end
echo Ungueltige Eingabe! Bitte waehle 1-5.
goto menu

:step1
echo.
echo ========================================
echo SCHRITT 1: Recovery-Modus ist aktiviert
echo ========================================
echo.
echo Der Recovery-Modus ist bereits in der Konfiguration aktiviert.
echo.
echo WICHTIG:
echo 1. Oeffne XAMPP Control Panel
echo 2. Klicke auf "Start" bei MySQL
echo 3. MySQL sollte jetzt im Recovery-Modus starten
echo.
echo Wenn MySQL erfolgreich gestartet ist, druecke eine Taste
echo und fahre mit Schritt 2 fort.
echo.
pause
goto menu

:step2
echo.
echo ========================================
echo SCHRITT 2: Datenbank exportieren
echo ========================================
echo.
echo Exportiere alle Datenbanken...
"C:\xampp\mysql\bin\mysqldump.exe" -u root --all-databases --single-transaction --quick --lock-tables=false > "%~dp0mysql_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql" 2>nul

if %errorlevel% equ 0 (
    echo.
    echo Erfolgreich! Backup erstellt: mysql_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
    echo.
    echo WICHTIG: Stoppe jetzt MySQL im XAMPP Control Panel!
    echo Druecke eine Taste wenn MySQL gestoppt ist...
    pause
) else (
    echo.
    echo FEHLER: Backup fehlgeschlagen!
    echo Stelle sicher, dass MySQL laeuft und versuche es erneut.
    echo.
    pause
)
goto menu

:step3
echo.
echo ========================================
echo SCHRITT 3: InnoDB neu aufbauen
echo ========================================
echo.
echo WARNUNG: Dieser Schritt loescht die InnoDB Log-Dateien!
echo Stelle sicher, dass:
echo - MySQL gestoppt ist
echo - Ein Backup erstellt wurde
echo.
set /p confirm="Moechtest du fortfahren? (J/N): "
if /i not "%confirm%"=="J" goto menu

echo.
echo Stoppe MySQL falls noch aktiv...
net stop mysql 2>nul

echo Entferne Recovery-Modus aus Konfiguration...
powershell -Command "(Get-Content 'C:\xampp\mysql\bin\my.ini') -replace 'innodb_force_recovery=1', '#innodb_force_recovery=1' | Set-Content 'C:\xampp\mysql\bin\my.ini'"

echo Loesche InnoDB Log-Dateien...
if exist "C:\xampp\mysql\data\ib_logfile0" del "C:\xampp\mysql\data\ib_logfile0"
if exist "C:\xampp\mysql\data\ib_logfile1" del "C:\xampp\mysql\data\ib_logfile1"

echo.
echo Fertig! Starte jetzt MySQL normal im XAMPP Control Panel.
echo MySQL wird automatisch neue Log-Dateien erstellen.
echo.
pause
goto menu

:step4
echo.
echo ========================================
echo SCHRITT 4: Datenbank wiederherstellen
echo ========================================
echo.
echo Dieser Schritt ist nur noetig, wenn du die Datenbank
echo komplett neu aufbauen musst.
echo.
echo Verfuegbare Backup-Dateien:
dir /b mysql_backup_*.sql 2>nul
echo.
set /p backupfile="Gib den Dateinamen des Backups ein (oder ENTER zum Abbrechen): "
if "%backupfile%"=="" goto menu

if not exist "%backupfile%" (
    echo Datei nicht gefunden!
    pause
    goto menu
)

echo.
echo Stelle sicher, dass MySQL laeuft!
pause

echo Importiere Datenbank...
"C:\xampp\mysql\bin\mysql.exe" -u root < "%backupfile%"

if %errorlevel% equ 0 (
    echo Erfolgreich wiederhergestellt!
) else (
    echo FEHLER beim Import!
)
echo.
pause
goto menu

:end
echo.
echo Programm beendet.
exit /b 0

