param(
    [ValidateSet("ping", "auth-status")]
    [string]$Command = "ping",
    [int]$Count = 20,
    [int]$IntervalMs = 200,
    [string]$VaultHome = "",
    [string]$InteropRoot = "",
    [int]$PerRunTimeoutSec = 10
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $scriptDir "test-uri-run.ps1"

Write-Host "== Warmup launch =="
& $runner -Command launch -VaultHome $VaultHome -InteropRoot $InteropRoot -TimeoutSec $PerRunTimeoutSec
if ($LASTEXITCODE -ne 0) {
    Write-Error "launch failed"
    exit $LASTEXITCODE
}

for ($i = 1; $i -le $Count; $i++) {
    Write-Host ("== Iteration {0}/{1} ==" -f $i, $Count)
    & $runner -Command $Command -VaultHome $VaultHome -InteropRoot $InteropRoot -TimeoutSec $PerRunTimeoutSec
    if ($LASTEXITCODE -ne 0) {
        Write-Error ("{0} failed at iteration {1}" -f $Command, $i)
        exit $LASTEXITCODE
    }

    if ($i -lt $Count) {
        Start-Sleep -Milliseconds $IntervalMs
    }
}

Write-Host "== Completed =="
