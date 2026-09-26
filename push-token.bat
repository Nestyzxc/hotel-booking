@echo off
REM push-token.bat URL TOKEN
REM Example: push-token.bat https://github.com/user/repo.git ghp_xxxxxxxxxxxx
set REMOTE_URL=%1
set TOKEN=%2
if "%REMOTE_URL%"=="" goto :usage
if "%TOKEN%"=="" goto :usage
git -C D:\hotel-n8n remote add origin %REMOTE_URL%
git -C D:\hotel-n8n push https://%TOKEN%@%REMOTE_URL:~8% main
exit /b 0
:usage
echo Usage: push-token.bat REMOTE-URL TOKEN
echo Example: push-token.bat https://github.com/user/repo.git ghp_xxxxxxxxxxxx
exit /b 1
