# EVOLV Local Development Server Launcher
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starting EVOLV Platform (Local Dev)   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir

Set-Location $RootDir
python manage.py runserver 127.0.0.1:8000
