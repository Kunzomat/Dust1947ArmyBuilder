# Dust 1947 PowerShell API Importer
# Importiert Einheiten über die HTTP API

$API_BASE = "http://localhost:8180/admin_api.php"
$API_KEY = "local-dev-key-12345"
$jsonFile = "D:\private\apps\dust1947\dust1947_import_data.json"

function Invoke-AdminAPI {
    param([string]$Action, [string]$Method = "GET", [object]$Data = $null)

    $url = "$API_BASE?action=$Action"
    $headers = @{
        "X-API-Key" = $API_KEY
        "Content-Type" = "application/json"
    }

    $params = @{
        Uri = $url
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
        ErrorAction = "SilentlyContinue"
    }

    if ($Method -eq "POST" -and $Data) {
        $params["Body"] = ($Data | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-WebRequest @params
        return ($response.Content | ConvertFrom-Json)
    }
    catch {
        return @{ error = $_.Exception.Message }
    }
}

# Main
Write-Host ""
Write-Host "Dust 1947 BATCH API IMPORT" -ForegroundColor Cyan
Write-Host ([string]::new("=", 60))
Write-Host ""

# Load JSON
Write-Host "Loading JSON..." -ForegroundColor Cyan
$json = Get-Content $jsonFile -Raw | ConvertFrom-Json
$units = $json.units
Write-Host "Loaded $($units.Count) units" -ForegroundColor Green

# Ensure Game System
Write-Host ""
Write-Host "Setting up Game System..." -ForegroundColor Cyan
$result = Invoke-AdminAPI -Action "game_systems.list" -Method "GET"
$gameSystemId = 1

if ($result -and $result -is [array]) {
    foreach ($sys in $result) {
        if ($sys.name -eq "Dust 1947") {
            $gameSystemId = $sys.id
            Write-Host "Found existing: ID $gameSystemId" -ForegroundColor Green
            break
        }
    }
}

Write-Host ""
Write-Host "Starting import of $($units.Count) units..." -ForegroundColor Yellow
Write-Host ([string]::new("-", 60))

$stats = @{
    total = 0
    success = 0
    failed = 0
    errors = @()
}

$startTime = Get-Date

$count = 0
foreach ($unit in $units) {
    $count++
    $stats.total++

    $unitData = @{
        name = $unit.card_id
        type = $unit.type
        level = [int]$unit.level
        points = [int]$unit.points
        health = [int]$unit.health
        speed = [int]$unit.speed
        march_speed = [int]$unit.march_speed
        image_url = $unit.image_url
        notes = "Card: $($unit.card_id)"
        game_system_id = $gameSystemId
    }

    $result = Invoke-AdminAPI -Action "units.create" -Method "POST" -Data $unitData

    if ($result -and $result.id) {
        $stats.success++
    }
    else {
        $stats.failed++
        if ($result.error) {
            $stats.errors += @{ unit = $unit.card_id; error = $result.error }
        }
    }

    if ($count % 50 -eq 0) {
        $pct = [int]($count / $units.Count * 100)
        Write-Host "[$pct%] $count/$($units.Count) units imported"
    }
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ([string]::new("-", 60))
Write-Host ""
Write-Host "IMPORT COMPLETE" -ForegroundColor Green
Write-Host ([string]::new("=", 60))
Write-Host "Total:     $($stats.total)"
Write-Host "Success:   $($stats.success)" -ForegroundColor Green
Write-Host "Failed:    $($stats.failed)" -ForegroundColor $(if ($stats.failed -gt 0) { "Red" } else { "Green" })
Write-Host "Duration:  $([math]::Round($duration, 2)) seconds"
Write-Host "Speed:     $([math]::Round($stats.total / $duration, 0)) units/sec"
Write-Host ([string]::new("=", 60))
Write-Host ""

if ($stats.errors.Count -gt 0) {
    Write-Host "Errors (first 5):" -ForegroundColor Yellow
    foreach ($err in $stats.errors | Select-Object -First 5) {
        Write-Host "  $($err.unit): $($err.error)"
    }
    Write-Host ""
}

Write-Host "Import finished!" -ForegroundColor Green
Write-Host ""

