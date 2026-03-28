Get-Process | Where-Object { $_.ProcessName -like "PtuneSync*" } | Stop-Process -Force
