@echo off
setlocal

set DEST=D:\Python\web\StockResearchReports
cd /d "%DEST%"
git add .
git commit -m "Auto update"
git push origin master

pause