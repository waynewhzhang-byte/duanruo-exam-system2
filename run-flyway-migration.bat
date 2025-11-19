@echo off
REM 执行 Flyway 数据库迁移脚本

echo ========================================
echo 执行 Flyway 数据库迁移
echo ========================================

mvn flyway:migrate -pl exam-infrastructure

echo.
echo ========================================
echo 迁移完成
echo ========================================
pause

