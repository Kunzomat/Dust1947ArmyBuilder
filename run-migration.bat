@echo off
REM Run database migration for Admin Panel fixes
echo ========================================
echo Running Admin Panel Database Migration
echo ========================================
echo.

REM Change to backend/database directory
cd /d "%~dp0backend\database"

REM Check if MySQL is running
echo Checking MySQL connection...
mysql -uroot -e "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL. Make sure XAMPP/MySQL is running.
    echo.
    echo Please start XAMPP and try again.
    pause
    exit /b 1
)

echo MySQL connection OK
echo.

REM Run the migration
echo Running migration script...
mysql -uroot dust1947 < migration_admin_fix.sql

if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo Check the error message above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Migration completed successfully!
echo ========================================
echo.
echo The following changes were applied:
echo   - Created unit_types table
echo   - Updated units table (added: type_id, soldiers, armor, move, cc, range_stat, description)
echo   - Updated weapons table (added: shots, range_val, damage, description)
echo   - Updated rules table (added: description)
echo   - Updated blocs table (added: description)
echo   - Updated platoons table (added: bloc_id, slot_type)
echo   - Fixed unit_rules table column name
echo   - Fixed unit_weapons table column name
echo.
echo You can now restart the application and test the Admin Panel.
echo.
pause

