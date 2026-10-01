@echo off
cd /d "%~dp0"
if not exist tmp mkdir tmp
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$out = @(); foreach ($p in 3009,3001,3000) { $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; foreach ($x in $c) { $pr = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $x.OwningProcess); $out += ('PORT ' + $p + ' | PID ' + $x.OwningProcess + ' | START ' + $pr.CreationDate + ' | USER-SESSION ' + $pr.SessionId + ' | CMD ' + $pr.CommandLine) } }; $out += '--- node processes ---'; Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $out += ('PID ' + $_.ProcessId + ' | PARENT ' + $_.ParentProcessId + ' | START ' + $_.CreationDate + ' | CMD ' + $_.CommandLine) }; $out += '--- pm2 ---'; $out += (Get-Command pm2 -ErrorAction SilentlyContinue | Out-String); $out | Out-File -Encoding utf8 tmp\kiem-tra-cong.txt"
echo Da ghi ket qua vao tmp\kiem-tra-cong.txt
timeout /t 3 >nul
