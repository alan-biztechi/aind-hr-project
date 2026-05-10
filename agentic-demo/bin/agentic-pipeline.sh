#!/usr/bin/env bash
#
# W3A-8 Cursor CLI 데모 — bash 컨트롤러
#   학생: ./bin/agentic-pipeline.sh
#   강사: INSTRUCTOR_MODE=1 ./bin/agentic-pipeline.sh
#
# 각 cursor-agent 호출의 출력을 .logs/<agent>.log 로 라우팅.
# zellij의 해당 페인이 tail -f 중이라 실시간으로 텍스트가 흐름.

set -euo pipefail
mkdir -p .logs

ts()  { date +"%H:%M:%S"; }
say() { echo "[controller $(ts)] $*"; }

# ── 사전 점검 ─────────────────────────────────────────────────────
say "▶ 백엔드 헬스체크 (http://localhost:8080)"
if ! curl -sf http://localhost:8080/v3/api-docs > /dev/null 2>&1; then
    say "❌ 백엔드(:8080) 응답 없음."
    say "   상위 폴더(aind-hr-project)에서 './mvnw spring-boot:run' 먼저 실행하세요."
    exit 1
fi
say "✅ 백엔드 OK"

# ── 한 에이전트를 자기 로그 파일로 라우팅하면서 실행 ────────────
#
# Cursor CLI는 `--agent` 플래그가 없어 .cursor/agents/*.md 를 자동 인식하지 못함.
# (Claude Code의 subagent 메커니즘과는 다름.) 그래서 bash가 직접:
#   1) .cursor/agents/<name>.md 의 frontmatter 이후 본문(역할/지침)을 읽음
#   2) 그 본문 + 이번 작업(task) 을 합쳐서 프롬프트로 전달
#   3) 각 호출은 독립 세션이라 컨텍스트는 자연스럽게 격리됨
#
# 옵션:
#   --print   비대화형 헤드리스 (출력만)
#   --force   모든 도구 호출 자동 승인 (Bash, Write 등 — 데모 목적)
#   --trust   워크스페이스 자동 신뢰
run_agent() {
    local name=$1
    local task=$2
    local agent_md=".cursor/agents/${name}.md"

    if [[ ! -f "$agent_md" ]]; then
        say "❌ $agent_md 파일이 없습니다"
        return 1
    fi

    # YAML frontmatter (--- ... ---) 이후의 본문만 추출
    local role
    role=$(awk '/^---$/{n++; next} n>=2{print}' "$agent_md")

    say "▶ $name 시작"
    {
        echo ""
        echo "[$(ts)] ▶ $name 시작"
    } >> ".logs/${name}.log"

    cursor-agent --print --force --trust "$role

## 이번 작업
$task" 2>&1 \
        | tee -a ".logs/${name}.log" > /dev/null

    echo "[$(ts)] ✅ $name 완료" >> ".logs/${name}.log"
    say "✅ $name 완료"
}

# ── 1. 계획 (순차) ────────────────────────────────────────────────
run_agent planner       "AGENTS.md, PLAN.md 기반으로 TASKS.md를 생성해줘."

# ── 2. 스캐폴딩 (순차, 실패하면 set -e로 중단) ───────────────────
run_agent scaffolder    "TASKS.md 기준으로 web-dashboard/ 서브폴더에 Vite/React/TS/Tailwind/Recharts 셋업."

# ── 3. UI + API 병렬 (Unix &/wait) ───────────────────────────────
say "▶ ui-builder + api-integrator 병렬 실행"
( run_agent ui-builder      "TASKS.md 기준으로 web-dashboard/src/components/ 컴포넌트 작성." ) &
PID_UI=$!
( run_agent api-integrator  "TASKS.md 기준으로 백엔드를 curl로 학습한 뒤 web-dashboard/src/api/, src/types.ts 작성." ) &
PID_API=$!
wait $PID_UI $PID_API
say "✅ ui-builder + api-integrator 완료"

# ── 4. 검증 (순차) ───────────────────────────────────────────────
run_agent verifier      "cd web-dashboard && npm run build 검증, 에러는 직접 수정. 결과를 RESULT.md에 기록."

# ── 5. 강사 전용 — AWS 배포 ──────────────────────────────────────
if [[ "${INSTRUCTOR_MODE:-0}" == "1" ]]; then
    run_agent release-engineer "web-dashboard/dist/ 를 AWS S3로 배포하고 공개 URL을 RESULT.md에 추가."
else
    say "⏭  release-engineer 건너뜀 (강사 모드: INSTRUCTOR_MODE=1)"
fi

say "🎉 파이프라인 완료. RESULT.md 확인."
