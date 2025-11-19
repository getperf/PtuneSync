param(
  [string]$Config = "Debug",
  [string]$Platform = "x64"
)

$pkg = Get-ChildItem "$PSScriptRoot\..\AppPackages" -Recurse -Filter "*_x64_${Config}.msix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $pkg) { Write-Error "MSIX not found"; exit 1 }

Write-Host "== Uninstall old package =="
Get-AppxPackage -Name PtuneSync | Remove-AppxPackage -ErrorAction SilentlyContinue

Write-Host "== Install =="
Add-AppxPackage $pkg.FullName -Verbose

Write-Host "Installed: $($pkg.FullName)"
