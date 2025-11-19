@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Usage: scripts\start-backend.bat [profile]
REM Default profile is "dev"
set PROFILE=%1
if "%PROFILE%"=="" set PROFILE=dev

echo [start-backend] Using profile "%PROFILE%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-backend.ps1" -Profile %PROFILE%
set EXITCODE=%ERRORLEVEL%
exit /b %EXITCODE%

