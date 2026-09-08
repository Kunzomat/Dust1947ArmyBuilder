@echo off
REM Quick-Start Script für Game Systems & Blocks Migration
REM Dust1947 Admin Panel Update

echo.
echo ================================================
echo  GAME SYSTEMS & BLOCKS MIGRATION
echo ================================================
echo.

cd /d %~dp0

echo [1/5] Prüfe ob du im richtigen Verzeichnis bist...
if not exist "backend\admin_api.php" (
    echo.
    echo ERROR: admin_api.php nicht gefunden!
    echo Bitte stelle sicher, dass du im D:\private\apps\dust1947 Verzeichnis bist.
    pause
    exit /b 1
)
echo ✓ Verzeichnis OK

echo.
echo [2/5] Prüfe ob MySQL läuft...
netstat -an | find "3306" > nul
if %errorlevel% neq 0 (
    echo.
    echo WARNING: MySQL läuft vielleicht nicht!
    echo Bitte starte XAMPP/MySQL bevor du fortfährst.
    echo Öffne http://localhost/phpmyadmin um zu prüfen.
    pause
)
echo ✓ Verbindung prüfbar

echo.
echo [3/5] Datenbank-Migration wird vorbereitet...
echo Dateien die hinzugefügt/geändert wurden:
echo   - backend/database/migration_game_systems.sql
echo   - backend/admin_api.php (mit game_systems & blocks Handlern)
echo   - dust1947-frontend/src/components/admin/GameSystemManager.js
echo   - dust1947-frontend/src/components/admin/BlocksManager.js
echo   - dust1947-frontend/src/components/AdminPanel.js
echo ✓ Alle Dateien vorhanden

echo.
echo [4/5] MIGRATION AUSFÜHREN - Wähle eine Option:
echo.
echo   A) Migration via PHPMyAdmin (manuell)
echo   B) Migration via PHP-Script (automatisch)
echo   C) Migration via Command Line (mysql CLI)
echo   D) Überspringe Migration (nur Frontend)
echo.
set /p CHOICE="Wähle A, B, C oder D: "

if /i "%CHOICE%"=="A" (
    echo.
    echo Öffne http://localhost/phpmyadmin in deinem Browser...
    echo 1. Wähle Datenbank 'dust1947'
    echo 2. Klicke auf SQL-Tab
    echo 3. Kopiere den Inhalt aus: backend\database\migration_game_systems.sql
    echo 4. Klicke "Go"
    echo.
    start http://localhost/phpmyadmin
    pause
)

if /i "%CHOICE%"=="B" (
    echo.
    echo Starte PHP Migration-Script...
    start http://localhost/dust1947/backend/run-migration.php
    echo Migration läuft! Fenster sollte sich öffnen.
    timeout /t 3
    pause
)

if /i "%CHOICE%"=="C" (
    echo.
    echo Starte MySQL Command Line Migration...
    echo Bitte gib das MySQL Passwort ein wenn gefragt...
    mysql -h localhost -u root -p dust1947 < backend\database\migration_game_systems.sql
    if %errorlevel% equ 0 (
        echo ✓ Migration erfolgreich!
    ) else (
        echo ✗ Migration fehlgeschlagen!
    )
    pause
)

echo.
echo [5/5] FRONTEND VORBEREITUNG
echo.
echo Next Steps:
echo   1. Öffne Terminal im dust1947-frontend Verzeichnis
echo   2. Führe aus: npm start
echo   3. Öffne http://localhost:3000 im Browser
echo   4. Gehe zum Admin Panel
echo   5. Du solltest neue Tabs sehen:
echo      - 🎮 Game Systems
echo      - 📦 Blocks
echo.

echo.
echo ================================================
echo  MIGRATION ABGESCHLOSSEN!
echo ================================================
echo.
echo Dokumentation: GAME_SYSTEMS_BLOCKS_UPDATE.md
echo.
pause

