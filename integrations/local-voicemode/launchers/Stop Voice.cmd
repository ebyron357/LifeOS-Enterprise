@echo off
rem LifeOS local voice launcher: double-click to stop the voice services.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\Manage-Voice.ps1" stop
pause
