# bin/agentic-launch.ps1
# Windows Terminal 분할 페인을 자동 셋업.
# 7개 페인: 6개 에이전트 로그 tail + 1개 컨트롤러.
# 페인은 세로(horizontal split)로만 쌓아서 셋업 안정성 우선.
#
# 실행:
#   pwsh .\bin\agentic-launch.ps1
#
# 자동 셋업 실패 시 수동 가이드를 출력.

$ErrorActionPreference = 'Stop'

$dir   = (Get-Location).Path
$logs  = '.logs'
$names = @('planner','scaffolder','api-integrator','ui-builder','verifier','release-engineer')

# ── 로그 디렉터리 + 빈 로그 파일 미리 생성 ─────────────────
New-Item -ItemType Directory -Force -Path $logs | Out-Null
foreach ($name in $names) {
    New-Item -ItemType File -Force -Path "$logs\$name.log" | Out-Null
}
Write-Host "✅ .logs\ 준비 완료" -ForegroundColor Green

# ── wt.exe 가용한지 확인 ────────────────────────────────────
$wt = Get-Command wt.exe -ErrorAction SilentlyContinue
if (-not $wt) {
    Write-Host ""
    Write-Host "⚠️  Windows Terminal(wt.exe)을 찾을 수 없습니다." -ForegroundColor Yellow
    Write-Host "    Microsoft Store에서 'Windows Terminal' 설치 후 다시 시도하세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "또는 수동 셋업으로 진행 — 아래 [수동 셋업 가이드] 참고."
    Show-ManualGuide
    exit 1
}

# ── wt.exe 명령 구성 ───────────────────────────────────────
# 첫 페인을 만들고, split-pane -H 로 아래로 6번 스택. 마지막이 controller.
function New-TailCommand($name) {
    # PowerShell 안에서 실행할 한 줄
    return "Write-Host '═══ $name ═══' -ForegroundColor Cyan; Get-Content -Wait .logs\$name.log"
}

$cwdQuoted = "`"$dir`""

# 첫 탭 — planner 페인으로 시작
$cmd = "new-tab -d $cwdQuoted --title planner pwsh -NoExit -Command `"$(New-TailCommand 'planner')`""

# 나머지 5개 에이전트 — 아래로 분할
foreach ($name in $names[1..5]) {
    $cmd += " ; split-pane -H -d $cwdQuoted --title $name pwsh -NoExit -Command `"$(New-TailCommand $name)`""
}

# 마지막 — controller 페인 (사용자가 여기에 node 명령 입력)
$controllerHint = "Write-Host '═══ controller — 입력: node bin\agentic-pipeline.js ═══' -ForegroundColor Yellow"
$cmd += " ; split-pane -H -d $cwdQuoted --title controller pwsh -NoExit -Command `"$controllerHint`""

# ── 실행 ──────────────────────────────────────────────────
function Show-ManualGuide {
    Write-Host ""
    Write-Host "─── 수동 셋업 가이드 ──────────────────────────────" -ForegroundColor Yellow
    Write-Host "1) Windows Terminal 새로 열기"
    Write-Host "2) 'Alt + Shift + -' 6번 눌러 7개 페인으로 분할 (수평 분할)"
    Write-Host "3) 각 페인에서 다음 명령 입력 (위에서부터):"
    foreach ($name in $names) {
        Write-Host "     pwsh -Command `"Get-Content -Wait .logs\$name.log`""
    }
    Write-Host "4) 마지막(컨트롤러) 페인에서:"
    Write-Host "     node bin\agentic-pipeline.js"
    Write-Host ""
    Write-Host "강사 모드(AWS 배포 포함):"
    Write-Host "     `$env:INSTRUCTOR_MODE='1'; node bin\agentic-pipeline.js"
    Write-Host "──────────────────────────────────────────────────"
}

try {
    Start-Process wt.exe -ArgumentList $cmd
    Write-Host ""
    Write-Host "✅ Windows Terminal 셋업 완료. 컨트롤러 페인(맨 아래)에서 다음 입력:" -ForegroundColor Green
    Write-Host "     node bin\agentic-pipeline.js" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "강사 모드(AWS 배포 포함):"
    Write-Host "     `$env:INSTRUCTOR_MODE='1'; node bin\agentic-pipeline.js" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ wt.exe 자동 분할 실패: $($_.Exception.Message)" -ForegroundColor Red
    Show-ManualGuide
    exit 1
}
