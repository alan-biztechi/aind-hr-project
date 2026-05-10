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
run_agent() {
    local name=$1
    local prompt=$2
    say "▶ $name 시작"
    echo "" >> ".logs/${name}.log"
    echo "[$(ts)] ▶ $name 시작" >> ".logs/${name}.log"
    cursor-agent --agent "$name" --prompt "$prompt" 2>&1 \
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
