# Internal helper for agentic-pipeline.js on Windows.
#
# Why this exists:
#   Node child_process.spawn() with shell:true on Windows wraps the
#   command in cmd.exe /d /s /c "...", whose argv parser mangles
#   multi-line strings, commas, and Korean characters. The result:
#   the agent prompt arrives at cursor-agent truncated, and the model
#   complains "message cut off at '...'" instead of doing the task.
#
#   This helper bypasses cmd.exe entirely. Node spawns powershell.exe
#   with shell:false; powershell reads the UTF-8 prompt file and passes
#   it to cursor-agent as a single argv element via PS's & operator.
#   No cmd.exe in the path -> multi-line / commas / Korean all survive.
#
# ASCII-only source so PS 5.1 on Korean Windows (CP949 default) can parse it.

param(
    [Parameter(Mandatory)]
    [string]$PromptFile
)

$ErrorActionPreference = 'Continue'

# UTF-8 console for cursor-agent's stream-json output (which contains Korean).
try { chcp 65001 > $null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# -Raw keeps the file as a single string with newlines intact.
$prompt = Get-Content -LiteralPath $PromptFile -Raw -Encoding UTF8

# & operator: runs the command, $prompt is a single argv element.
& cursor-agent --print --force --trust --output-format stream-json --stream-partial-output $prompt
exit $LASTEXITCODE
