@echo off
echo ========================================
echo Rebuilding and Starting Backend
echo ========================================

cd /d d:\duanruo-exam-system2

echo.
echo Step 1: Clean and compile...
call mvn clean install -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Starting backend...
java -jar exam-bootstrap\target\exam-bootstrap-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev

pause

