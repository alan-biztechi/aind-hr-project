# bin/agentic-launch.ps1
# Auto-setup Windows Terminal split panes.
# 7 panes: 6 agent log tails + 1 controller.
# Stacked horizontally for setup stability.
#
# ASCII-only source. PowerShell 5.1 on Korean Windows reads .ps1 as CP949
# by default, so non-ASCII characters in the source mangle the parser.
# Console output is forced to UTF-8 below so log content still renders correctly.
#
# Run:
#   powershell .\bin\agentic-launch.ps1     (Win10 default)
#   pwsh .\bin\agentic-launch.ps1            (PowerShell 7+)

$ErrorActionPreference = 'Stop'

# Force UTF-8 for this console too.
try { chcp 65001 > $null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$dir   = (Get-Location).Path
$logs  = '.logs'
$names = @('planner','scaffolder','api-integrator','ui-builder','verifier','release-engineer')

# ---- Manual setup guide (defined first so it can be called from error paths) ----
function Show-ManualGuide {
    Write-Host ''
    Write-Host '--- Manual setup guide ---------------------------' -ForegroundColor Yellow
    Write-Host '1) Open a new Windows Terminal window'
    Write-Host '2) Press Alt + Shift + - six times to make 7 horizontal panes'
    Write-Host '3) From top to bottom, run in each pane:'
    foreach ($n in $names) {
        Write-Host "     $shell -NoExit -File .\bin\_pane-tail.ps1 -Name $n"
    }
    Write-Host '4) In the last (controller) pane:'
    Write-Host "     $shell -NoExit -File .\bin\_pane-controller.ps1"
    Write-Host '--------------------------------------------------'
}

# ---- Pre-create log dir + empty log files ------------------------
New-Item -ItemType Directory -Force -Path $logs | Out-Null
foreach ($name in $names) {
    New-Item -ItemType File -Force -Path "$logs\$name.log" | Out-Null
}
Write-Host '[OK] .logs/ ready' -ForegroundColor Green

# ---- Prefer pwsh, fall back to powershell 5.1 --------------------
$shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { 'pwsh' } else { 'powershell' }
Write-Host "[INFO] shell: $shell" -ForegroundColor Cyan

# ---- Check wt.exe ------------------------------------------------
if (-not (Get-Command wt.exe -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Write-Host '[ERR] Windows Terminal (wt.exe) not found.' -ForegroundColor Red
    Write-Host "      Install 'Windows Terminal' from Microsoft Store and retry." -ForegroundColor Yellow
    Show-ManualGuide
    exit 1
}

# ---- Per-pane wt arg builders (array form -> auto token escape) --
function TailPaneArgs([string]$name) {
    return @($shell, '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', '.\bin\_pane-tail.ps1', '-Name', $name)
}

function ControllerPaneArgs() {
    return @($shell, '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', '.\bin\_pane-controller.ps1')
}

# ---- Build wt argument array -------------------------------------
# Each element becomes a separate argv token.
# A bare ';' element is recognized by wt as the sub-command separator.
$wtArgs = @()

# First pane - planner (new-tab)
$wtArgs += @('new-tab', '-d', $dir, '--title', 'planner') + (TailPaneArgs 'planner')

# Remaining 5 agents - split-pane -H (stack downward)
foreach ($n in $names[1..5]) {
    $wtArgs += @(';', 'split-pane', '-H', '-d', $dir, '--title', $n) + (TailPaneArgs $n)
}

# Last - controller
$wtArgs += @(';', 'split-pane', '-H', '-d', $dir, '--title', 'controller') + (ControllerPaneArgs)

# ---- Run ---------------------------------------------------------
try {
    Start-Process wt.exe -ArgumentList $wtArgs
    Write-Host ''
    Write-Host '[OK] Windows Terminal launched. In the controller pane (bottom), run the printed command.' -ForegroundColor Green
} catch {
    Write-Host ''
    Write-Host "[ERR] wt.exe split failed: $($_.Exception.Message)" -ForegroundColor Red
    Show-ManualGuide
    exit 1
}
