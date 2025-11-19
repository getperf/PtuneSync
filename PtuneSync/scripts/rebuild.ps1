param(
  [string]$Config = "Debug",
  [string]$Platform = "x64"
)

Write-Host "== Rebuild =="

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# compile.ps1 を実行
Write-Host "== Step 1: Compile =="
& "$root\compile.ps1" -Config $Config -Platform $Platform
if ($LASTEXITCODE -ne 0) {
  Write-Error "Compile failed"
  exit 1
}

# install.ps1 を実行
Write-Host "== Step 2: Install =="
& "$root\install.ps1" -Config $Config -Platform $Platform
if ($LASTEXITCODE -ne 0) {
  Write-Error "Install failed"
  exit 1
}

Write-Host "== Rebuild completed successfully =="
