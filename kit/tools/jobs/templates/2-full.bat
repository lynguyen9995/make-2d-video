@echo off
title FULL render
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0full.ps1"
echo.
echo Log: %~dp0logs\full.log
pause
