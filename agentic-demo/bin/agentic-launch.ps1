# bin/agentic-launch.ps1
# Windows Terminal 분할 페인을 자동 셋업.
# 7개 페인: 6개 에이전트 로그 tail + 1개 컨트롤러.
# 페인은 세로(horizontal split)로만 쌓아서 셋업 안정성 우선.
#
# 실행:
#   powershell .\bin\agentic-launch.ps1     (Win10 기본)
#   pwsh .\bin\agentic-launch.ps1            (PowerShell 7+)

$ErrorActionPreference = 'Stop'

# 자기 자신부터 UTF-8
try { chcp 65001 > $null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$dir   = (Get-Location).Path
$logs  = '.logs'
$names = @('planner','scaffolder','api-integrator','ui-builder','verifier','release-engineer')

# ── 로그 디렉터리 + 빈 로그 파일 미리 생성 ─────────────────
New-Item -ItemType Directory -Force -Path $logs | Out-Null
foreach ($name in $names) {
    New-Item -ItemType File -Force -Path "$logs\$name.log" | Out-Null
}
Write-Host '✅ .logs\ 준비 완료' -ForegroundColor Green

# ── pwsh 우선, 없으면 powershell 5.1 fallback ──────────────
$shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { 'pwsh' } else { 'powershell' }
Write-Host "ℹ️  사용할 셸: $shell" -ForegroundColor Cyan

# ── wt.exe 가용한지 확인 ────────────────────────────────────
if (-not (Get-Command wt.exe -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Write-Host '❌ Windows Terminal(wt.exe)을 찾을 수 없습니다.' -ForegroundColor Red
    Write-Host "   Microsoft Store에서 'Windows Terminal' 설치 후 다시 시도하세요." -ForegroundColor Yellow
    Show-ManualGuide
    exit 1
}

# ── 페인별 wt 인자 빌더 (배열로 전달 → 토큰별 escape 자동 처리) ──
function TailPaneArgs([string]$name) {
    return @($shell, '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', '.\bin\_pane-tail.ps1', '-Name', $name)
}

function ControllerPaneArgs() {
    return @($shell, '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', '.\bin\_pane-controller.ps1')
}

# ── 수동 셋업 가이드 ────────────────────────────────────────
function Show-ManualGuide {
    Write-Host ''
    Write-Host '─── 수동 셋업 가이드 ──────────────────────────────' -ForegroundColor Yellow
    Write-Host '1) Windows Terminal 새로 열기'
    Write-Host '2) Alt + Shift + - 를 6번 눌러 7개 페인으로 분할 (수평 분할)'
    Write-Host '3) 위에서부터 각 페인에 다음 명령 입력:'
    foreach ($n in $names) {
        Write-Host "     $shell -NoExit -File .\bin\_pane-tail.ps1 -Name $n"
    }
    Write-Host '4) 마지막(컨트롤러) 페인:'
    Write-Host "     $shell -NoExit -File .\bin\_pane-controller.ps1"
    Write-Host '──────────────────────────────────────────────────'
}

# ── wt 명령 인자 배열 만들기 ────────────────────────────────
# 각 element 가 별도 argv 토큰으로 전달됨.
# `;` 도 별도 element 로 두면 wt 가 sub-command 구분자로 해석.
$wtArgs = @()

# 첫 페인 — planner (new-tab)
$wtArgs += @('new-tab', '-d', $dir, '--title', 'planner') + (TailPaneArgs 'planner')

# 나머지 5개 에이전트 — split-pane -H 로 아래로 쌓기
foreach ($n in $names[1..5]) {
    $wtArgs += @(';', 'split-pane', '-H', '-d', $dir, '--title', $n) + (TailPaneArgs $n)
}

# 마지막 — controller
$wtArgs += @(';', 'split-pane', '-H', '-d', $dir, '--title', 'controller') + (ControllerPaneArgs)

# ── 실행 ──────────────────────────────────────────────────
try {
    Start-Process wt.exe -ArgumentList $wtArgs
    Write-Host ''
    Write-Host '✅ Windows Terminal 셋업 완료. 컨트롤러 페인(맨 아래)에서 안내된 명령을 입력하세요.' -ForegroundColor Green
} catch {
    Write-Host ''
    Write-Host "❌ wt.exe 자동 분할 실패: $($_.Exception.Message)" -ForegroundColor Red
    Show-ManualGuide
    exit 1
}
