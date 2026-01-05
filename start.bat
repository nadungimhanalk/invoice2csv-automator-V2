@echo off
cd /d "%~dp0"
echo Starting Invoice2CSV Automator...
start "" http://localhost:3002
call npm run dev
pause
