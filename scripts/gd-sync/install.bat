@echo off
title GD Auto Sync Install

echo ============================================
echo   GD Auto Sync Installer
echo ============================================
echo.

:: Admin check
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Need Admin. Right-click and Run as Administrator.
    echo.
    pause
    exit /b 1
)

:: 1. Create folder
echo [1/5] Creating C:\gd-sync ...
if not exist "C:\gd-sync" mkdir "C:\gd-sync"
echo     OK

:: 2. Copy script
echo [2/5] Copying upload script...
copy /Y "%~dp0gd_upload.py" "C:\gd-sync\gd_upload.py" >nul
if %errorLevel% neq 0 (
    echo [!] Copy failed
    pause
    exit /b 1
)
echo     OK

:: 3. PEM key
echo [3/5] Checking PEM key...
if not exist "C:\gd-sync\dreaming-mech-key.pem" (
    if exist "%~dp0dreaming-mech-key.pem" (
        copy /Y "%~dp0dreaming-mech-key.pem" "C:\gd-sync\dreaming-mech-key.pem" >nul
        echo     PEM key copied!
    ) else (
        echo.
        echo     [!] Copy dreaming-mech-key.pem to C:\gd-sync\
        echo.
    )
) else (
    echo     PEM key exists
)

:: 4. Python check
echo [4/5] Checking Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo     [!] Python not found.
    echo.
    echo     Install Python:
    echo     1. Go to https://python.org/downloads
    echo     2. Download and install
    echo     3. CHECK "Add Python to PATH" !!!
    echo     4. Run this file again
    echo.
    start https://python.org/downloads
    pause
    exit /b 1
)
echo     Python found!

:: Install paramiko
echo     Installing paramiko...
pip install paramiko >nul 2>&1
if %errorLevel% neq 0 (
    echo     paramiko failed (SCP mode will be used)
) else (
    echo     paramiko OK!
)

:: 5. Task Scheduler (every 3 minutes)
echo [5/5] Setting up Task Scheduler (every 3 min)...
schtasks /delete /tn "GD_AutoSync" /f >nul 2>&1
schtasks /create /tn "GD_AutoSync" /tr "python C:\gd-sync\gd_upload.py" /sc minute /mo 3 /ru SYSTEM /f >nul 2>&1
if %errorLevel% neq 0 (
    echo     Task Scheduler failed. Set up manually:
    echo     Program: python
    echo     Args: C:\gd-sync\gd_upload.py
    echo     Repeat: every 3 minutes
) else (
    echo     Auto sync every 3 minutes - OK!
)

:: Check GDB file
echo.
if exist "C:\PsimCarS\DATA\Total.gdb" (
    echo [OK] GDB file found: C:\PsimCarS\DATA\Total.gdb
) else (
    echo [!] GDB file not found at C:\PsimCarS\DATA\Total.gdb
    echo     Edit C:\gd-sync\gd_upload.py to set correct GDB_PATH
)

:: Test run
echo.
echo ============================================
echo   Install complete! Running test...
echo ============================================
echo.
python "C:\gd-sync\gd_upload.py"

echo.
echo ============================================
echo   DONE!
echo.
echo   Script: C:\gd-sync\gd_upload.py
echo   Log: C:\gd-sync\upload.log
echo   PEM: C:\gd-sync\dreaming-mech-key.pem
echo   Auto: every 3 minutes (Task Scheduler)
echo.
echo   Manual run: python C:\gd-sync\gd_upload.py
echo ============================================
echo.
pause
