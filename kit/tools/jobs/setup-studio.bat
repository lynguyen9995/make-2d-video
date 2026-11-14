@echo off
title studio setup
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
echo.
echo Log: %~dp0logs\setup.log
pause
