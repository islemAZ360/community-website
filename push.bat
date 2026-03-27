@echo off
echo =======================================
echo Pushing updates to GitHub (community-website)
echo =======================================

set "msg=%~1"
if "%msg%"=="" set msg=Auto update

git add .
git commit -m "%msg%"
git push origin main

echo =======================================
echo Done! Updates are on GitHub.
echo =======================================
pause
