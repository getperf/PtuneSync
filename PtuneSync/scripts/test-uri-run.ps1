param(
    [ValidateSet("pull", "auth-status", "auth-login")]
    [string]$Command = "pull",
    [string]$VaultHome = "$env:TEMP\\PtuneSyncProtocolTest\\work",
    [int]$TimeoutSec = 30,
    [string]$ListName = "_Today",
    [switch]$IncludeCompleted,
    [switch]$SkipRequestId
)

$requestId = "{0}-{1}" -f (Get-Date -Format "yyyyMMddTHHmmssfffZ"), ([guid]::NewGuid().ToString("N").Substring(0, 8))
$runDir = Join-Path $env:TEMP "PtuneSyncProtocolTest\\runs\\$requestId"
$statusFile = Join-Path $runDir "status.json"
$requestFile = Join-Path $runDir "request.json"

New-Item -ItemType Directory -Force -Path $runDir | Out-Null
New-Item -ItemType Directory -Force -Path $VaultHome | Out-Null

$requestCommand = switch ($Command) {
    "pull" { "pull" }
    "auth-status" { "auth-status" }
    "auth-login" { "auth-login" }
}

$uriCommand = switch ($Command) {
    "pull" { "run/pull" }
    "auth-status" { "run/auth/status" }
    "auth-login" { "run/auth/login" }
}

$request = @{
    schema_version = 1
    command = $requestCommand
    created_at = [DateTimeOffset]::UtcNow.ToString("O")
    home = $VaultHome
    status_file = $statusFile
    workspace = @{
        run_dir = $runDir
        status_file = $statusFile
    }
    args = @{
        list = $ListName
        include_completed = [bool]$IncludeCompleted
    }
}

if (-not $SkipRequestId) {
    $request.request_id = $requestId
}

$request | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $requestFile

$escapedRequestFile = [Uri]::EscapeDataString($requestFile.Replace('\', '/'))
$uri = if ($SkipRequestId) {
    "net.getperf.ptune.googleoauth:/${uriCommand}?request_file=$escapedRequestFile"
} else {
    "net.getperf.ptune.googleoauth:/${uriCommand}?request_id=$requestId&request_file=$escapedRequestFile"
}

Write-Host "== Request =="
Write-Host $requestFile
Write-Host "== Status =="
Write-Host $statusFile
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
            Write-Host "phase=$($status.phase) status=$($status.status) message=$($status.message)"
            if ($status.phase -eq "completed") {
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
