@echo off
REM Migration Runner für Game Systems & Blocs
REM Direkter Zugriff auf MySQL DB

setlocal enabledelayedexpansion

set dbHost=localhost
set dbUser=root
set dbPass=dust1947
set dbName=dust1947

echo.
echo ========================================
echo   GAME SYSTEMS & BLOCS MIGRATION
echo ========================================
echo.

echo Connecting to database...
mysql -h %dbHost% -u %dbUser% -p%dbPass% -e "SELECT 1" >nul 2>&1

if %errorlevel% neq 0 (
    echo ERROR: Could not connect to MySQL database!
    echo Make sure MySQL is running and credentials are correct:
    echo   Host: %dbHost%
    echo   User: %dbUser%
    echo.
    pause
    exit /b 1
)

echo [OK] Database connected
echo.

REM 1. Create game_systems table
echo Step 1: Creating game_systems table...
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "CREATE TABLE IF NOT EXISTS game_systems (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, description TEXT, rules_version VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)" >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] game_systems table ready
) else (
    echo [ERROR] Failed to create game_systems table
)
echo.

REM 2. Add description to blocs
echo Step 2: Adding description column to blocs...
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS description TEXT AFTER name" >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] description column added
) else (
    echo [WARN] Column might already exist
)
echo.

REM 3. Add game_system_id to blocs
echo Step 3: Adding game_system_id column to blocs...
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS game_system_id INT AFTER description" >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] game_system_id column added
) else (
    echo [WARN] Column might already exist
)
echo.

REM 4. Add Foreign Key constraint
echo Step 4: Adding foreign key constraint...
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "ALTER TABLE blocs ADD FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL" >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Foreign key constraint added
) else (
    echo [WARN] Constraint might already exist
)
echo.

REM 5. Insert default game systems
echo Step 5: Inserting default game systems...
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "INSERT IGNORE INTO game_systems (id, name, description, rules_version) VALUES (1, 'Warhammer 40K - 10th Edition', 'Games Workshop Warhammer 40,000 10th Edition Regeln', '10.0'), (2, 'Kill Team', 'Games Workshop Kill Team Skirmish Rules', 'Latest'), (3, 'Necromunda', 'Games Workshop Necromunda Gang Warfare', 'Latest')" >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Default game systems inserted
) else (
    echo [INFO] Game systems might already exist
)
echo.

echo ========================================
echo   VERIFICATION
echo ========================================
echo.

echo Game Systems in database:
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "SELECT id, name, rules_version FROM game_systems ORDER BY id" 2>&1

echo.
echo Blocs Table Structure:
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "DESCRIBE blocs" 2>&1

echo.
echo Sample Blocs Data:
mysql -h %dbHost% -u %dbUser% -p%dbPass% %dbName% -e "SELECT b.id, b.name, b.description, gs.name as game_system FROM blocs b LEFT JOIN game_systems gs ON b.game_system_id = gs.id LIMIT 10" 2>&1

echo.
echo ========================================
echo   [OK] MIGRATION COMPLETE!
echo ========================================
echo.
echo Ready to use the new Game Systems ^& Blocs features!
echo.
pause

