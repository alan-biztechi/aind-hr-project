# UTF-8 콘솔 셋업
try { chcp 65001 > $null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ('═' * 60) -ForegroundColor Yellow
Write-Host '  controller — 다음 중 하나를 입력하세요' -ForegroundColor Yellow
Write-Host ('═' * 60) -ForegroundColor Yellow
Write-Host ''
Write-Host '  학생 모드:' -NoNewline -ForegroundColor White
Write-Host ' node bin\agentic-pipeline.js' -ForegroundColor Cyan
Write-Host ''
Write-Host '  강사 모드:' -NoNewline -ForegroundColor White
Write-Host " `$env:INSTRUCTOR_MODE='1'; node bin\agentic-pipeline.js" -ForegroundColor Cyan
Write-Host ''
Write-Host ('═' * 60) -ForegroundColor Yellow
Write-Host ''
