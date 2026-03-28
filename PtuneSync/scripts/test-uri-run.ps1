param(
    [ValidateSet("pull", "review", "auth-status", "auth-login")]
    [string]$Command = "pull",
    [string]$VaultHome = "",
    [int]$TimeoutSec = 30,
    [string]$ListName = "_Today",
    [string]$Date = "",
    [switch]$IncludeCompleted,
    [string]$RequestNonce = "",
    [string]$InteropRoot = ""
)

$packageFamilyName = "Getperf.PtuneSync_mex14frpm041c"
$packageLocalState = Join-Path $env:LOCALAPPDATA "Packages\\$packageFamilyName\\LocalState"

$effectiveInteropRoot = if ([string]::IsNullOrWhiteSpace($InteropRoot)) {
    Join-Path $packageLocalState "interop"
} else {
    $InteropRoot
}

$effectiveVaultHome = if ([string]::IsNullOrWhiteSpace($VaultHome)) {
    Join-Path $packageLocalState "vault_home"
} else {
    $VaultHome
}

$requestNonceValue = if ([string]::IsNullOrWhiteSpace($RequestNonce)) {
    "{0}-{1}" -f (Get-Date -Format "yyyyMMddTHHmmssfffZ"), ([guid]::NewGuid().ToString("N").Substring(0, 2))
} else {
    $RequestNonce
}
$interopDir = $effectiveInteropRoot
$statusFile = Join-Path $interopDir "status.json"
$requestFile = Join-Path $interopDir "request.json"

New-Item -ItemType Directory -Force -Path $interopDir | Out-Null
New-Item -ItemType Directory -Force -Path $effectiveVaultHome | Out-Null

$requestCommand = switch ($Command) {
    "pull" { "pull" }
    "review" { "review" }
    "auth-status" { "auth-status" }
    "auth-login" { "auth-login" }
}

$uriCommand = switch ($Command) {
    "pull" { "run/pull" }
    "review" { "run/review" }
    "auth-status" { "run/auth/status" }
    "auth-login" { "run/auth/login" }
}

$request = @{
    schema_version = 1
    request_nonce = $requestNonceValue
    command = $requestCommand
    created_at = [DateTimeOffset]::UtcNow.ToString("O")
    home = $effectiveVaultHome
    status_file = $statusFile
    workspace = @{
        status_file = $statusFile
    }
    args = @{
        preset = if ([string]::IsNullOrWhiteSpace($Date)) { "today" } else { "date" }
        date = $Date
        list = $ListName
        include_completed = [bool]$IncludeCompleted
    }
}

if (Test-Path -LiteralPath $statusFile) {
    Remove-Item -LiteralPath $statusFile -Force
}

$request | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $requestFile

$escapedRequestFile = [Uri]::EscapeDataString($requestFile.Replace('\', '/'))
$uri = "net.getperf.ptune.googleoauth:/${uriCommand}?request_file=$escapedRequestFile"

Write-Host "== Request =="
Write-Host $requestFile
Write-Host "== Status =="
Write-Host $statusFile
Write-Host "== VaultHome =="
Write-Host $effectiveVaultHome
Write-Host "== RequestNonce =="
Write-Host $requestNonceValue
Write-Host "== URI =="
Write-Host $uri

Start-Process $uri

$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
    if (Test-Path $statusFile) {
        $raw = Get-Content $statusFile -Raw
        try {
            $status = $raw | ConvertFrom-Json
            Write-Host "== Current Status =="
            Write-Host "request_nonce=$($status.request_nonce) phase=$($status.phase) status=$($status.status) message=$($status.message)"
            if ($status.request_nonce -ne $requestNonceValue) {
                Write-Host "status.json belongs to a different request_nonce; waiting for current request"
            }
            elseif ($status.phase -eq "completed") {
                Write-Host "== status.json =="
                Write-Host $raw
                exit 0
            }
        }
        catch {
            Write-Host "status.json exists but could not parse yet"
        }
    }

    Start-Sleep -Milliseconds 500
}

Write-Error "Timed out waiting for status.json completion: $statusFile"
if (Test-Path $statusFile) {
    Write-Host "== Final status.json =="
    Get-Content $statusFile
}
exit 1
