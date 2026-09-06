@echo off
echo ========================================
echo MySQL Schnell-Reparatur und Start
echo ========================================
echo.

echo SCHRITT 1: Erstelle Sicherungs-Backup der Log-Dateien...
if not exist "C:\xampp\mysql\data\backup" mkdir "C:\xampp\mysql\data\backup"
copy "C:\xampp\mysql\data\ib_logfile0" "C:\xampp\mysql\data\backup\ib_logfile0.bak" 2>nul
copy "C:\xampp\mysql\data\ib_logfile1" "C:\xampp\mysql\data\backup\ib_logfile1.bak" 2>nul
echo Backup erstellt in: C:\xampp\mysql\data\backup\

echo.
echo SCHRITT 2: Stoppe MySQL falls aktiv...
net stop mysql 2>nul
taskkill /F /IM mysqld.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo SCHRITT 3: Loesche korrupte InnoDB Log-Dateien...
if exist "C:\xampp\mysql\data\ib_logfile0" (
    del "C:\xampp\mysql\data\ib_logfile0"
    echo   - ib_logfile0 geloescht
)
if exist "C:\xampp\mysql\data\ib_logfile1" (
    del "C:\xampp\mysql\data\ib_logfile1"
    echo   - ib_logfile1 geloescht
)

echo.
echo SCHRITT 4: MySQL wird jetzt mit Recovery-Modus gestartet...
echo (Recovery-Modus ist bereits in my.ini aktiviert)
echo.
echo WICHTIG:
echo 1. Oeffne jetzt das XAMPP Control Panel
echo 2. Klicke auf "Start" bei MySQL
echo 3. MySQL sollte jetzt starten und neue Log-Dateien erstellen
echo.
echo Nach erfolgreichem Start:
echo - Erstelle ein vollstaendiges Backup mit backup-database.bat
echo - MySQL funktioniert dann wieder normal
echo.
pause

echo.
echo Moechtest du jetzt ein Datenbank-Backup erstellen? (J/N)
set /p backup="Eingabe: "
if /i "%backup%"=="J" (
    echo.
    echo Erstelle Backup...
    call backup-database.bat
)

echo.
echo ========================================
echo Fertig!
echo ========================================
echo.
echo Naechste Schritte:
echo 1. Ueberpruefe, ob MySQL im XAMPP Control Panel laeuft
echo 2. Oeffne phpMyAdmin und teste die Verbindung
echo 3. Wenn alles funktioniert, kannst du den Recovery-Modus deaktivieren
echo.
pause

