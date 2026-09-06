@echo off
echo ==========================================
echo Checking React Environment Variables
echo ==========================================
echo.

cd /d D:\private\apps\dust1947\dust1947-frontend

echo .env.local content:
echo -------------------
type .env.local
echo.
echo ==========================================
echo.

echo Stopping React...
taskkill /F /IM node.exe 2>nul

echo.
echo Starting React with environment debug...
set REACT_APP_API_BASE=http://localhost:8000/backend/army_api.php
set REACT_APP_API_KEY=local-dev-key-12345

echo.
echo Environment variables set:
echo REACT_APP_API_BASE=%REACT_APP_API_BASE%
echo REACT_APP_API_KEY=%REACT_APP_API_KEY%
echo.
echo Starting npm start...
npm start

pause

