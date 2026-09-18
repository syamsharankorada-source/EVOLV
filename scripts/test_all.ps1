# EVOLV Test Suite Executor
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Executing EVOLV Automated Test Suite  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir

Set-Location $RootDir
python manage.py test users neuro_readiness
