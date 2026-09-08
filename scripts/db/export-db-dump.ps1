[CmdletBinding()]
param(
    [string]$Namespace,
    [string]$Database,
    [string]$User,
    [string]$MysqlLabel,
    [string]$SecretName,
    [string]$SecretKey,
    [string]$ConfigPath,
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
    return Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

function Get-Config {
    param([string]$Path)

    if (-not $Path -or -not (Test-Path $Path)) {
        return $null
    }

    return Get-Content -Path $Path -Raw | ConvertFrom-Json
}

function First-NonEmpty {
    param([object[]]$Values)

    foreach ($v in $Values) {
        if ($null -ne $v -and "$v".Trim() -ne "") {
            return "$v".Trim()
        }
    }

    return $null
}

function Get-CurrentNamespace {
    $ns = kubectl config view --minify -o jsonpath="{..namespace}" 2>$null
    if (-not $ns) { return "default" }
    return $ns
}

function Get-NamespaceFromLabel {
    param([string]$Label)

    $ns = kubectl get pod -A -l $Label -o jsonpath="{.items[0].metadata.namespace}" 2>$null
    if (-not $ns) { return $null }
    return $ns
}

function Get-DatabaseFromPodLabel {
    param([string]$Ns, [string]$Label)

    $db = kubectl get pod -n $Ns -l $Label -o jsonpath="{.items[0].spec.containers[0].env[?(@.name=='MYSQL_DATABASE')].value}" 2>$null
    if (-not $db) { return $null }
    return $db
}

function Get-MySqlPodName {
    param([string]$Ns, [string]$Label)

    $pod = kubectl get pod -n $Ns -l $Label -o jsonpath="{.items[0].metadata.name}" 2>$null
    if (-not $pod) {
        throw "No MySQL pod found in namespace '$Ns' with label '$Label'."
    }
    return $pod
}

function Get-SecretValue {
    param([string]$Ns, [string]$Name, [string]$Key)

    $b64 = kubectl get secret -n $Ns $Name -o jsonpath="{.data.$Key}" 2>$null
    if (-not $b64) {
        throw "Secret '$Name' with key '$Key' was not found in namespace '$Ns'."
    }

    $bytes = [Convert]::FromBase64String($b64)
    return [Text.Encoding]::UTF8.GetString($bytes)
}

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    throw "kubectl is not available in PATH."
}

if (-not $ConfigPath) {
    $ConfigPath = Join-Path (Get-ProjectRoot) "project.config.json"
}

$config = Get-Config -Path $ConfigPath

$MysqlLabel = First-NonEmpty @($MysqlLabel, $env:DUST_DB_LABEL, $config.kubernetes.mysqlLabel, $config.mysqlLabel, "app=mysql")
$Namespace = First-NonEmpty @($Namespace, $env:DUST_DB_NAMESPACE, $config.kubernetes.namespace, $config.namespace, (Get-NamespaceFromLabel -Label $MysqlLabel), (Get-CurrentNamespace), "default")
$Database = First-NonEmpty @($Database, $env:DUST_DB_NAME, $config.database.name, $config.database.database, $config.database, (Get-DatabaseFromPodLabel -Ns $Namespace -Label $MysqlLabel))
$User = First-NonEmpty @($User, $env:DUST_DB_USER, $config.database.user, $config.user, "root")
$SecretName = First-NonEmpty @($SecretName, $env:DUST_DB_SECRET, $config.kubernetes.mysqlSecretName, $config.secretName, "mysql-secret")
$SecretKey = First-NonEmpty @($SecretKey, $env:DUST_DB_SECRET_KEY, $config.kubernetes.mysqlSecretKey, $config.secretKey, "mysql-root-password")

if (-not $Database) {
    throw "Database name is required. Use -Database, DUST_DB_NAME, or project.config.json."
}

if (-not $OutputPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $OutputPath = Join-Path (Get-ProjectRoot) "database/dump-$Database-$timestamp.sql"
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDir = Split-Path -Parent $resolvedOutput
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$podName = Get-MySqlPodName -Ns $Namespace -Label $MysqlLabel
$password = Get-SecretValue -Ns $Namespace -Name $SecretName -Key $SecretKey
$stderrPath = [System.IO.Path]::GetTempFileName()

try {
    $proc = Start-Process -FilePath "kubectl" `
        -ArgumentList @(
            "exec", "-n", $Namespace, $podName, "--",
            "env", "MYSQL_PWD=$password",
            "mysqldump", "-u$User",
            "--single-transaction", "--quick", "--lock-tables=false",
            "--databases", $Database
        ) `
        -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput $resolvedOutput `
        -RedirectStandardError $stderrPath

    if ($proc.ExitCode -ne 0) {
        $err = (Get-Content -Raw $stderrPath).Trim()
        if (-not $err) { $err = "kubectl exited with code $($proc.ExitCode)." }
        throw "Dump export failed. $err"
    }
}
finally {
    if (Test-Path $stderrPath) { Remove-Item $stderrPath -Force }
}

Write-Host "Dump exported successfully:" -ForegroundColor Green
Write-Host "  $resolvedOutput"


