param (
    [string]$DateStr = $(Get-Date -Format 'yyyyMMdd')
)

$logPath = "$env:LOCALAPPDATA\Packages\PtuneSync_4bqfqzfzcr10c\LocalState\logs\app$DateStr.log"

Write-Host "Waiting for: $logPath"

$timeout = 60
$elapsed = 0
while (-not (Test-Path $logPath)) {
    Start-Sleep -Seconds 1
    $elapsed++
    if ($elapsed -ge $timeout) {
        Write-Error "not found log"
        exit 1
    }
}

Get-Content $logPath -Wait
