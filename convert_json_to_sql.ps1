# Dust 1947 JSON to SQL Converter
# Konvertiert dust1947_import_data.json zu import.sql

$jsonFile = "D:\private\apps\dust1947\dust1947_import_data.json"
$sqlFile = "D:\private\apps\dust1947\dust1947_import.sql"

Write-Host "📖 Reading JSON..." -ForegroundColor Cyan
$json = Get-Content $jsonFile -Raw | ConvertFrom-Json
$units = $json.units

Write-Host "✅ Loaded $($units.Count) units" -ForegroundColor Green

# Start SQL file
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$sql = "-- ============================================================`n"
$sql += "-- DUST 1947 BULK IMPORT`n"
$sql += "-- Generated: $timestamp`n"
$sql += "-- Total units: $($units.Count)`n"
$sql += "-- ============================================================`n`n"
$sql += "INSERT IGNORE INTO game_systems (id, name, description)`n"
$sql += "VALUES (1, 'Dust 1947', 'Dust 1947 alternate history wargame');`n`n"
$sql += "SET FOREIGN_KEY_CHECKS = 0;`n`n"
$sql += "INSERT INTO units (name, type, level, points, health, speed, march_speed, image_url, notes, game_system_id)`n"
$sql += "VALUES`n"

$valueLines = @()
$index = 0

foreach ($unit in $units) {
    $index++

    $name = if ([string]::IsNullOrWhiteSpace($unit.name) -or $unit.name -eq "Unit $($unit.card_id)") {
        "Unit $($unit.card_id)"
    } else {
        $unit.name
    }

    # Escape single quotes for SQL
    $name = $name -replace "'", "''"
    $notes = ($unit.notes -replace "'", "''") + " | Card: $($unit.card_id)"
    $image = $unit.image_url -replace "'", "''"

    $type = $unit.type -replace "'", "''"
    $level = $unit.level
    $points = $unit.points
    $health = $unit.health
    $speed = $unit.speed
    $march_speed = $unit.march_speed

    $line = "('$name', '$type', $level, $points, $health, $speed, $march_speed, '$image', '$notes', 1)"
    $valueLines += $line

    if ($index % 100 -eq 0) {
        Write-Host "  Processing $index/$($units.Count)..." -ForegroundColor Yellow
    }
}

# Join with commas
$sql += ($valueLines -join ",`n")

# Complete SQL
$sql += ";`n`n"
$sql += "SET FOREIGN_KEY_CHECKS = 1;`n`n"
$sql += "SELECT COUNT(*) as total_units FROM units WHERE game_system_id = 1;`n`n"
$sql += "SELECT`n"
$sql += "    'Dust 1947' as game_system,`n"
$sql += "    COUNT(*) as total_units,`n"
$sql += "    COUNT(DISTINCT type) as unit_types,`n"
$sql += "    MIN(points) as min_points,`n"
$sql += "    MAX(points) as max_points,`n"
$sql += "    ROUND(AVG(points), 1) as avg_points`n"
$sql += "FROM units`n"
$sql += "WHERE game_system_id = 1;`n`n"
$sql += "SELECT type, COUNT(*) as count FROM units WHERE game_system_id = 1 GROUP BY type;"

# Save SQL file
$sql | Out-File -FilePath $sqlFile -Encoding UTF8
Write-Host "✅ SQL file created: $sqlFile" -ForegroundColor Green

$fileSize = (Get-Item $sqlFile).Length / 1KB
Write-Host "📊 File size: $([math]::Round($fileSize, 1)) KB" -ForegroundColor Yellow

Write-Host "`n✨ Ready for import!" -ForegroundColor Green
Write-Host "Next step: Import via MySQL client or database tool" -ForegroundColor Cyan



