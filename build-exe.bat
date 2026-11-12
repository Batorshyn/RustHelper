@echo off
echo ===================================================
echo   RustHelper v1.0 - Windows .exe Builder
echo ===================================================
echo.
echo 1. Installing dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Error during npm install. Make sure Node.js is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Compiling RustHelper and creating Windows .exe...
call npm run build:exe
if %ERRORLEVEL% NEQ 0 (
    echo Error during build.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo   SUCCESS! Your .exe files are ready in 'release':
echo   - RustHelper Setup 1.0.0.exe (Installer with desktop icon)
echo   - RustHelper 1.0.0.exe (Portable - runs instantly)
echo ===================================================
pause
