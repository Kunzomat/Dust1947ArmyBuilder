# Migration Runner für Game Systems & Blocs
# Direkter Zugriff auf MySQL DB

$dbHost = "localhost"
$dbUser = "root"
$dbPass = "dust1947"
$dbName = "dust1947"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GAME SYSTEMS & BLOCS MIGRATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test connection with mysql CLI
Write-Host "Connecting to database..." -ForegroundColor Yellow
$testConnection = mysql -h $dbHost -u $dbUser -p$dbPass -e "SELECT 1" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not connect to MySQL database!" -ForegroundColor Red
    Write-Host "Make sure MySQL is running and credentials are correct:" -ForegroundColor Red
    Write-Host "  Host: $dbHost"
    Write-Host "  User: $dbUser"
    Write-Host "  Password: ***"
    exit 1
}

Write-Host "✓ Database connected" -ForegroundColor Green
Write-Host ""

# 1. Create game_systems table
Write-Host "Step 1: Creating game_systems table..." -ForegroundColor Yellow
$sql1 = @"
CREATE TABLE IF NOT EXISTS game_systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rules_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
"@

$sql1 | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ game_systems table ready" -ForegroundColor Green
} else {
    Write-Host "✗ Error creating table" -ForegroundColor Red
}

Write-Host ""

# 2. Add description to blocs
Write-Host "Step 2: Adding description column to blocs..." -ForegroundColor Yellow
$sql2 = "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS description TEXT AFTER name;"

$sql2 | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ description column added" -ForegroundColor Green
} else {
    Write-Host "✗ Error (might already exist)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Add game_system_id to blocs
Write-Host "Step 3: Adding game_system_id column to blocs..." -ForegroundColor Yellow
$sql3 = "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS game_system_id INT AFTER description;"

$sql3 | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ game_system_id column added" -ForegroundColor Green
} else {
    Write-Host "✗ Error (might already exist)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Add Foreign Key constraint
Write-Host "Step 4: Adding foreign key constraint..." -ForegroundColor Yellow
$checkFk = "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'blocs' AND COLUMN_NAME = 'game_system_id' AND REFERENCED_TABLE_NAME = 'game_systems';"

$checkResult = $checkFk | mysql -h $dbHost -u $dbUser -p$dbPass $dbName --skip-column-names 2>&1 | Select-Object -First 1

if ($checkResult -gt 0) {
    Write-Host "✓ Foreign key constraint already exists" -ForegroundColor Green
} else {
    $sql4 = "ALTER TABLE blocs ADD FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL;"
    $sql4 | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Foreign key constraint added" -ForegroundColor Green
    } else {
        Write-Host "✗ Error adding constraint" -ForegroundColor Yellow
    }
}

Write-Host ""

# 5. Insert default game systems
Write-Host "Step 5: Inserting default game systems..." -ForegroundColor Yellow
$checkSystems = "SELECT COUNT(*) as cnt FROM game_systems;"
$sysCount = $checkSystems | mysql -h $dbHost -u $dbUser -p$dbPass $dbName --skip-column-names 2>&1 | Select-Object -First 1

if ($sysCount -eq 0) {
    $sql5 = @"
INSERT IGNORE INTO game_systems (id, name, description, rules_version) VALUES
    (1, 'Warhammer 40K - 10th Edition', 'Games Workshop Warhammer 40,000 10th Edition Regeln', '10.0'),
    (2, 'Kill Team', 'Games Workshop Kill Team Skirmish Rules', 'Latest'),
    (3, 'Necromunda', 'Games Workshop Necromunda Gang Warfare', 'Latest');
"@

    $sql5 | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Default game systems inserted" -ForegroundColor Green
    } else {
        Write-Host "✗ Error inserting systems" -ForegroundColor Red
    }
} else {
    Write-Host "✓ Game systems already exist ($sysCount systems)" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify game_systems
Write-Host "📊 Game Systems:" -ForegroundColor Cyan
$sql = "SELECT id, name, rules_version FROM game_systems ORDER BY id;"
$result = $sql | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

$result | ForEach-Object {
    if ($_ -match "^(\d+)\s+(.+)\s+(.+)$") {
        Write-Host "  [$($matches[1])] $($matches[2]) (v$($matches[3]))" -ForegroundColor Green
    }
}

Write-Host ""

# Verify blocs structure
Write-Host "📋 Blocs Table Structure:" -ForegroundColor Cyan
$sql = "DESCRIBE blocs;"
$result = $sql | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

$result | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}

Write-Host ""

# Sample data
Write-Host "📦 Sample Blocs Data:" -ForegroundColor Cyan
$sql = @"
SELECT b.id, b.name, b.description, gs.name as game_system
FROM blocs b
LEFT JOIN game_systems gs ON b.game_system_id = gs.id
LIMIT 5;
"@

$result = $sql | mysql -h $dbHost -u $dbUser -p$dbPass $dbName 2>&1

$result | ForEach-Object {
    if ($_ -notmatch "^(id|---)" -and $_ -ne "") {
        Write-Host "  $_" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ready to use the new Game Systems & Blocs features!" -ForegroundColor Cyan

