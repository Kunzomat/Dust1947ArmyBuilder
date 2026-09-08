[CmdletBinding()]
param(
    [string]$SourcePath = "project.config.example.json",
    [string]$TargetPath = "project.config.json",
    [switch]$Force,
    [switch]$SkipDerivedFiles
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $projectRoot $SourcePath
$target = Join-Path $projectRoot $TargetPath

if (-not (Test-Path $source)) {
    throw "Source config not found: $source"
}

if ((-not (Test-Path $target)) -or $Force) {
    Copy-Item -Path $source -Destination $target -Force
    Write-Host "Created config:" -ForegroundColor Green
    Write-Host "  $target"
} else {
    Write-Host "Config already exists:" -ForegroundColor Yellow
    Write-Host "  $target"
}

if ($SkipDerivedFiles) {
    exit 0
}

$config = Get-Content -Path $target -Raw | ConvertFrom-Json

function Escape-PhpSingleQuoted {
    param([string]$Value)
    return ($Value -replace "'", "\\'")
}

if (-not $config.database.host -or -not $config.database.name -or -not $config.database.user -or -not $config.database.password) {
    throw "Config is missing required database fields: database.host, database.name, database.user, database.password"
}

if (-not $config.api.baseUrl -or -not $config.api.apiKey) {
    throw "Config is missing required API fields: api.baseUrl, api.apiKey"
}

$backendConfigPath = Join-Path $projectRoot "backend/config.local.php"
$apiKey = Escape-PhpSingleQuoted "$($config.api.apiKey)"
$dbHost = Escape-PhpSingleQuoted "$($config.database.host)"
$dbName = Escape-PhpSingleQuoted "$($config.database.name)"
$dbUser = Escape-PhpSingleQuoted "$($config.database.user)"
$dbPass = Escape-PhpSingleQuoted "$($config.database.password)"

$backendConfigContent = @"
<?php
// Generated from project.config.json
define('API_KEY', '$apiKey');

define('DB_HOST', '$dbHost');
define('DB_NAME', '$dbName');
define('DB_USER', '$dbUser');
define('DB_PASS', '$dbPass');
"@

Set-Content -Path $backendConfigPath -Value $backendConfigContent -Encoding UTF8
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  $backendConfigPath"

$frontendEnvPath = Join-Path $projectRoot "dust1947-frontend/.env.local"
$frontendEnvContent = @"
# Generated from project.config.json
REACT_APP_API_BASE=$($config.api.baseUrl)
REACT_APP_API_KEY=$($config.api.apiKey)
"@

Set-Content -Path $frontendEnvPath -Value $frontendEnvContent -Encoding UTF8
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  $frontendEnvPath"



