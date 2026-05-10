param(
    [Parameter(Mandatory)]
    [string]$Name
)

# UTF-8 콘솔 (한글 깨짐 방지) — PowerShell 5.1 / 7 양쪽 호환
try { chcp 65001 > $null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 로그 파일이 없으면 생성
$file = ".logs/$Name.log"
if (-not (Test-Path $file)) {
    $null = New-Item -ItemType Directory -Force -Path '.logs'
    $null = New-Item -ItemType File -Force -Path $file
}

# 페인 헤더
Write-Host ('═' * 60) -ForegroundColor DarkGray
Write-Host "  $Name" -ForegroundColor Cyan
Write-Host ('═' * 60) -ForegroundColor DarkGray
Write-Host ''

# UTF-8 로 읽고, 새 라인 들어오는 즉시 출력
Get-Content -Wait $file -Encoding UTF8
