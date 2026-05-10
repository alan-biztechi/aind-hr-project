# UTF-8 console for Korean log/output rendering.
# ASCII-only source — PowerShell 5.1 on Korean Windows reads .ps1 as CP949 by default.
try { chcp 65001 > $null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ('=' * 60) -ForegroundColor Yellow
Write-Host '  controller pane - run one of:' -ForegroundColor Yellow
Write-Host ('=' * 60) -ForegroundColor Yellow
Write-Host ''
Write-Host '  Student:     ' -NoNewline -ForegroundColor White
Write-Host 'node bin\agentic-pipeline.js' -ForegroundColor Cyan
Write-Host ''
Write-Host '  Instructor:  ' -NoNewline -ForegroundColor White
Write-Host "`$env:INSTRUCTOR_MODE='1'; node bin\agentic-pipeline.js" -ForegroundColor Cyan
Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Yellow
Write-Host ''
