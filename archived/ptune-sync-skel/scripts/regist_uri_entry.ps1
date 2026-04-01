$scheme = "ptune-sync"

#$project = "C:\home\pkm\skel\task\vscode\ptune-sync-skel"
$project = "C:\home\pkm\skel\obsidian\ptune-sync-skel"

#$command = "uv run --project $project python -m ptune_sync.uri.uri_entry `"%1`""
$command = "cmd /c uv run --project $project python -m ptune_sync.uri.uri_entry `"%1`""

New-Item -Path "HKCU:\Software\Classes\$scheme" -Force

Set-ItemProperty `
    -Path "HKCU:\Software\Classes\$scheme" `
    -Name "(Default)" `
    -Value "URL:ptune-sync Protocol"

Set-ItemProperty `
    -Path "HKCU:\Software\Classes\$scheme" `
    -Name "URL Protocol" `
    -Value ""

New-Item `
    -Path "HKCU:\Software\Classes\$scheme\shell\open\command" `
    -Force

Set-ItemProperty `
    -Path "HKCU:\Software\Classes\$scheme\shell\open\command" `
    -Name "(Default)" `
    -Value $command

