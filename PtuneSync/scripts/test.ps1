param(
    [string]$Config = "Debug",
    [string]$Platform = "x64",
    [string]$Filter = "",
    [switch]$BuildOnly
)

$ErrorActionPreference = "Stop"

Write-Host "== PtuneSync Tests =="

$root = Split-Path -Parent $PSScriptRoot
$solutionRoot = Split-Path -Parent $root
$testProject = Join-Path $solutionRoot "PtuneSync.Tests\PtuneSync.Tests.csproj"
$testOutputDir = Join-Path $solutionRoot "PtuneSync.Tests\bin\$Platform\$Config\net8.0-windows10.0.19041.0"
$testDll = Join-Path $testOutputDir "PtuneSync.Tests.dll"
$vsMsbuild = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe"
$vstest = "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\Extensions\TestPlatform\vstest.console.exe"

if (!(Test-Path $vsMsbuild)) {
    Write-Host "[ERROR] MSBuild not found: $vsMsbuild"
    exit 1
}

if (!(Test-Path $vstest)) {
    Write-Host "[ERROR] vstest.console.exe not found: $vstest"
    exit 1
}

Write-Host "== Build test project =="
& $vsMsbuild $testProject `
    /t:Build `
    /p:Configuration=$Config `
    /p:Platform=$Platform `
    /p:GenerateAppxPackageOnBuild=false `
    /p:AppxPackageSigningEnabled=false `
    /p:WindowsPackageType=None `
    /p:EnableMsixTooling=false

if ($LASTEXITCODE -ne 0) {
    Write-Host "== Build FAILED =="
    exit 1
}

if (!(Test-Path $testDll)) {
    Write-Host "[ERROR] Test DLL not found: $testDll"
    exit 1
}

if ($BuildOnly) {
    Write-Host "== Build SUCCESS (tests not executed) =="
    exit 0
}

Write-Host "== Run tests =="
$testArgs = @($testDll)
if (![string]::IsNullOrWhiteSpace($Filter)) {
    $testArgs += "/TestCaseFilter:$Filter"
}

& $vstest @testArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "== Tests FAILED =="
    exit 1
}

Write-Host "== Tests SUCCESS =="
