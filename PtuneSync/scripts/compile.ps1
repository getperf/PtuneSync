param(
    [string]$Config = "Debug",
    [string]$Platform = "x64"
)

Write-Host "== PtuneSync Build (MSIX Release) =="

$vsMsbuild = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe"

if (!(Test-Path $vsMsbuild)) {
    Write-Host "[ERROR] MSBuild not found: $vsMsbuild"
    exit 1
}

$env:BuildingFromScript = "true"

Write-Host "== Cleaning manifest cache =="
Get-ChildItem "$PSScriptRoot\..\obj\" -Filter *.manifest -Recurse |
Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "== Build start =="

& $vsMsbuild "$PSScriptRoot\..\PtuneSync.csproj" `
    /t:"Restore;Rebuild" `
    /p:Configuration=$Config `
    /p:Platform=$Platform `
    /p:GenerateAppxPackageOnBuild=true `
    /p:AppxBundle=Always `
    /p:AppxBundlePlatforms=$Platform `
    /p:UapAppxPackageBuildMode=StoreUpload `
    /p:AppxPackageDir="$PSScriptRoot\..\AppPackages\" `
    /p:AppxPackageSigningEnabled=true `
    /p:AppxPackageValidationEnabled=true `
    /p:BuildingFromScript=true

if ($LASTEXITCODE -ne 0) {
    Write-Host "== Build FAILED =="
    exit 1
}

Write-Host "== Build SUCCESS =="