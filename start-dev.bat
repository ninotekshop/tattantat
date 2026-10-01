@echo off
chcp 65001 >nul
title Tat Tan Tat - Khoi dong
setlocal
set "ROOT=%~dp0"

echo ==============================================
echo   TAT TAN TAT - Khoi dong moi truong phat trien
echo ==============================================

if not exist "%ROOT%backend\package.json" (
  echo [LOI] Khong tim thay thu muc backend. Hay dat file .bat nay o thu muc goc du an.
  pause
  exit /b 1
)
if not exist "%ROOT%web\package.json" (
  echo [LOI] Khong tim thay thu muc web. Hay dat file .bat nay o thu muc goc du an.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js/npm. Tai tai https://nodejs.org roi chay lai.
  pause
  exit /b 1
)

rem Cai thu vien neu chua co (chi lan dau)
if not exist "%ROOT%backend\node_modules" (
  echo Dang cai thu vien cho backend...
  pushd "%ROOT%backend"
  call npm install
  popd
)
if not exist "%ROOT%web\node_modules" (
  echo Dang cai thu vien cho web...
  pushd "%ROOT%web"
  call npm install
  popd
)

echo.
echo Dang mo Backend (cong 3009) va Web (cong 3001) o 2 cua so rieng...
start "Backend - npm run start:dev" /D "%ROOT%backend" cmd /k "npm run start:dev"
rem Cho backend khoi dong truoc vai giay
timeout /t 5 /nobreak >nul
start "Web - npm run dev" /D "%ROOT%web" cmd /k "npm run dev"

echo.
echo Da khoi dong. Doi khoang 30-60 giay de backend san sang, sau do mo:
echo   Web:     http://localhost:3001
echo   Backend: http://localhost:3009/api/v1/health
echo.
echo De tat: dong 2 cua so "Backend" va "Web" (hoac nhan Ctrl+C trong moi cua so).
timeout /t 8 >nul
start "" "http://localhost:3001"
endlocal
