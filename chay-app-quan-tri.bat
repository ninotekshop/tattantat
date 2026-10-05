@echo off
chcp 65001 >nul
title Tat Tan Tat - App quan tri (Expo)
cd /d "%~dp0admin-app"

if not exist node_modules (
  echo Dang cai thu vien lan dau, vui long doi...
  call npm install
  if errorlevel 1 ( echo Cai thu vien that bai. & pause & exit /b 1 )
)

echo.
echo ===== APP QUAN TRI - CHON CACH CHAY THU =====
echo  1. Expo Go tren dien thoai (cung Wi-Fi). Thong bao day KHONG chay trong Expo Go
echo  2. Expo Go qua tunnel (khi dien thoai khac mang Wi-Fi voi may tinh)
echo.
choice /c 12 /n /m "Nhap 1 hoac 2: "
if errorlevel 2 goto tunnel

echo Dang khoi dong Expo (quet ma QR bang Expo Go)...
call npx expo start -c
goto end

:tunnel
echo Dang khoi dong Expo tunnel (lan dau co the hoi cai @expo/ngrok, chon Y)...
call npx expo start -c --tunnel

:end
echo.
echo Da dung Expo. Nhan phim bat ky de dong cua so.
pause >nul
