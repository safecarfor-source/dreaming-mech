@echo off
title GD Auto Sync v2 Install

echo ============================================
echo   GD Auto Sync v2 Installer
echo ============================================
echo.

:: Admin check
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Run as Administrator! Right-click - Run as administrator
    echo.
    pause
    exit /b 1
)

:: 1. Remove old scheduled task
echo [1/7] Removing old scheduled task...
schtasks /delete /tn "GD_AutoSync" /f >nul 2>&1
echo     OK

:: 2. Kill old processes
echo [2/7] Killing old processes...
taskkill /f /im pythonw.exe /fi "WINDOWTITLE eq GD*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq GD*" >nul 2>&1
echo     OK

:: 3. Create folder and copy files
echo [3/7] Setting up C:\gd-sync ...
if not exist "C:\gd-sync" mkdir "C:\gd-sync"
copy /Y "%~dp0gd_upload.py" "C:\gd-sync\gd_upload.py" >nul
echo     Script copied OK

:: 4. PEM key check
echo [4/7] Checking PEM key...
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
    echo     PEM key exists OK
)

:: 5. Python + paramiko
echo [5/7] Checking Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo     [!] Python not installed. Install from https://python.org/downloads
    start https://python.org/downloads
    pause
    exit /b 1
)
echo     Python OK!
echo     Installing paramiko...
pip install paramiko >nul 2>&1
echo     paramiko OK

:: 6. Register startup (auto-run on boot)
echo [6/7] Registering startup...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_FILE=%STARTUP%\GD_AutoSync.vbs

echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run "pythonw C:\gd-sync\gd_upload.py", 0, False >> "%VBS_FILE%"
echo     Startup registered!

:: Watchdog
if exist "%~dp0watchdog.vbs" (
    copy /Y "%~dp0watchdog.vbs" "C:\gd-sync\watchdog.vbs" >nul
    set WD_FILE=%STARTUP%\GD_Watchdog.vbs
    echo Set WshShell = CreateObject("WScript.Shell"^) > "%WD_FILE%"
    echo WshShell.Run "wscript C:\gd-sync\watchdog.vbs", 0, False >> "%WD_FILE%"
    echo     Watchdog registered!
)

:: 7. Desktop shortcut for manual upload
echo [7/7] Creating desktop shortcut...
set DESKTOP=%USERPROFILE%\Desktop
set MANUAL_VBS=%DESKTOP%\GD_ManualUpload.vbs

echo Set WshShell = CreateObject("WScript.Shell") > "%MANUAL_VBS%"
echo WshShell.Run "cmd /c python C:\gd-sync\gd_upload.py --once & echo. & echo Upload Done! & pause", 1, True >> "%MANUAL_VBS%"
echo     Desktop shortcut [GD_ManualUpload] created!

:: GDB file check
echo.
if exist "C:\Program Files\PsimCarS\Data\DM\TOTAL.GDB" (
    echo [OK] GDB file found: C:\Program Files\PsimCarS\Data\DM\TOTAL.GDB
) else (
    echo [!] GDB file NOT found. Check GDB_PATH in C:\gd-sync\gd_upload.py
)

:: Test run (once)
echo.
echo ============================================
echo   Test upload (1 time)...
echo ============================================
python "C:\gd-sync\gd_upload.py" --once

:: Start background process
echo.
echo ============================================
echo   Starting background process...
echo ============================================
start "" pythonw "C:\gd-sync\gd_upload.py"
echo     Background process started!

echo.
echo ============================================
echo   INSTALL COMPLETE!
echo.
echo   Script: C:\gd-sync\gd_upload.py
echo   Log:    C:\gd-sync\upload.log
echo   PEM:    C:\gd-sync\dreaming-mech-key.pem
echo.
echo   * Auto-start on PC boot
echo   * Upload every 3 minutes
echo   * Manual upload: Desktop GD_ManualUpload icon
echo   * Check log: type C:\gd-sync\upload.log
echo ============================================
echo.
pause
