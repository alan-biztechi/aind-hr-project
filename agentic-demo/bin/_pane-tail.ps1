param(
    [Parameter(Mandatory)]
    [string]$Name
)

# UTF-8 console (so Korean from log files displays correctly).
# This file itself is ASCII-only so PowerShell 5.1 (Korean Windows = CP949 default)
# can parse it without the source-encoding mismatch.
try { chcp 65001 > $null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$file = ".logs/$Name.log"
if (-not (Test-Path $file)) {
    $null = New-Item -ItemType Directory -Force -Path '.logs'
    $null = New-Item -ItemType File -Force -Path $file
}

# Pane header (ASCII only)
Write-Host ('=' * 60) -ForegroundColor DarkGray
Write-Host "  $Name" -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor DarkGray
Write-Host ''

# Tail the agent log; -Encoding UTF8 so Korean content from Node controller renders right.
Get-Content -Wait $file -Encoding UTF8
