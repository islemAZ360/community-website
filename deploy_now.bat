@echo off
cd /d "%~dp0"
echo === Git Add ===
git add .
echo === Git Commit ===
git commit -m "Update pricing: Monthly 500, 6-Months 1500, Lifetime 3000 RUB"
echo === Git Push ===
git push origin main
echo === DONE ===
