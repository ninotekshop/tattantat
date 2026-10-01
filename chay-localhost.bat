@echo off
chcp 65001 >nul
title Tat Tan Tat - Localhost
cd /d "%~dp0"
echo Dang tat cac tien trinh cu dang chiem cong 3009 (backend) va 3001 (web)...
for %%P in (3009 3001) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    echo   - Dung tien trinh PID %%A tren cong %%P
    taskkill /PID %%A /F >nul 2>&1
  )
)
timeout /t 2 /nobreak >nul
echo Dang khoi dong Backend (NestJS, cong 3009)...
start "TatTanTat Backend :3009" cmd /k "cd /d %~dp0backend && npm run start:dev"
echo Dang khoi dong Web (Next.js, cong 3001)...
start "TatTanTat Web :3001" cmd /k "cd /d %~dp0web && npm run dev"
echo Cho 30 giay de server san sang...
timeout /t 30 /nobreak >nul
start "" http://localhost:3001
echo Da mo http://localhost:3001 - dong 2 cua so den de tat server.
timeout /t 5 >nul
