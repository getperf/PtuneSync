param(
  [string]$Config = "Release",
  [string]$Platform = "x64"
)

$packageName = "Getperf.PtuneSync"
$processName = "PtuneSync"

$packageFilter = if ($Config -eq "Release") {
  "PtuneSync_*_${Platform}.msix"
} else {
  "PtuneSync_*_${Platform}_${Config}.msix"
}

$pkg = Get-ChildItem "$PSScriptRoot\..\AppPackages" -Recurse -Filter $packageFilter | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $pkg) { Write-Error "MSIX not found: $packageFilter"; exit 1 }

Write-Host "== Selected package =="
Write-Host $pkg.FullName

Write-Host "== Stop running process =="
Get-Process -Name $processName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "== Uninstall old package =="
$installed = Get-AppxPackage -Name $packageName -ErrorAction SilentlyContinue
if ($installed) {
  $installed | Remove-AppxPackage -ErrorAction Stop
  Write-Host "Removed: $($installed.PackageFullName)"
} else {
  Write-Host "No installed package found: $packageName"
}

Write-Host "== Install =="
Add-AppxPackage $pkg.FullName -Verbose

Write-Host "Installed: $($pkg.FullName)"
