@echo off
chcp 65001 >nul
title Tat Tan Tat - App nguoi dung (Expo)
cd /d "%~dp0mobile"

if not exist node_modules (
  echo Dang cai thu vien lan dau, vui long doi...
  call npm install
  if errorlevel 1 ( echo Cai thu vien that bai. & pause & exit /b 1 )
)

echo.
echo ===== APP NGUOI DUNG - CHON CACH CHAY THU =====
echo  1. Expo Go tren dien thoai (xem giao dien; Google, Apple, OTP, thong bao KHONG chay)
echo  2. Expo Go qua tunnel (khi dien thoai khac mang Wi-Fi voi may tinh)
echo  3. Chay that tren Android cam cap USB (day du tinh nang, can Android Studio + JDK)
echo.
choice /c 123 /n /m "Nhap 1, 2 hoac 3: "
if errorlevel 3 goto device
if errorlevel 2 goto tunnel
goto lan

:lan
echo Dang khoi dong Expo (quet ma QR bang Expo Go, dien thoai cung Wi-Fi)...
call npx expo start -c
goto end

:tunnel
echo Dang khoi dong Expo tunnel (lan dau co the hoi cai @expo/ngrok, chon Y)...
call npx expo start -c --tunnel
goto end

:device
echo Hay bat Go loi USB tren dien thoai Android va cam cap vao may tinh.
call adb devices
call npx expo run:android
goto end

:end
echo.
echo Da dung Expo. Nhan phim bat ky de dong cua so.
pause >nul
