param (
    [string]$DateStr = $(Get-Date -Format 'yyyy-MM-dd')
)

#  ptune-log_2025-10-26.log
$logPath = ".\logs\ptune-log_$DateStr.log"
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

Get-Content $logPath -Encoding UTF8 -Wait
