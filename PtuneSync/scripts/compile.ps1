param(
    [string]$Config = "Debug",
    [string]$Platform = "x64"
)

Write-Host "== Build =="

# Visual Studio 2022 の MSBuild を使用
$vs2022 = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe"

if (Test-Path $vs2022) {
    & $vs2022 "$PSScriptRoot\..\PtuneSync.csproj" `
        /p:Configuration=$Config `
        /p:Platform=$Platform `
        /p:GenerateAppxPackageOnBuild=true
}
else {
    # Write-Host "MSBuild 17.x (VS2022) が見つかりません。dotnet build にフォールバックします。"
    dotnet build "$PSScriptRoot\..\PtuneSync.csproj" `
        -c $Config `
        -p:Platform=$Platform `
        -p:GenerateAppxPackageOnBuild=true
}
