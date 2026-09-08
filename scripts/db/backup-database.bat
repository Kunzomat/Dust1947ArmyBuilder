@echo off
echo ================================================
echo  Dust1947 Database Backup
echo ================================================
echo.

set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=backup_dust1947_%TIMESTAMP%.sql

echo Creating backup: %BACKUP_FILE%
echo.

C:\xampp\mysql\bin\mysqldump.exe -u root dust1947 > "%~dp0backend\database\%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo  SUCCESS: Backup created successfully!
    echo  Location: backend\database\%BACKUP_FILE%
    echo.
) else (
    echo.
    echo  ERROR: Backup failed!
    echo.
)

pause

