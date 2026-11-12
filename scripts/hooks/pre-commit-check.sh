#!/usr/bin/env bash
# Kiro PreToolUse 훅 (.kiro/hooks/pre-commit-check.json) 에서 실행한다.
# - Kiro가 실행하려는 셸 명령이 git commit 이 아니면: 아무것도 출력하지 않고 통과 (종료 코드 0)
# - git commit 이면 점검하고, 모두 통과하면: 아무것도 출력하지 않고 통과 (종료 코드 0)
# - 하나라도 실패하면: 실패 내용을 출력하고 커밋을 막는다 (종료 코드 2)

# ── 0. git commit 인지 판단 ──────────────────────────────
# 훅 입력(JSON)의 tool_input.command 에서, 명령의 시작이나 ; && || | 뒤에 오는 git commit 만 커밋으로 본다.
# (문자열 안에 "git commit" 이 들어 있기만 한 명령은 커밋이 아님)
is_commit=$(python3 -c '
import json, re, sys
try:
    cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
except Exception:
    cmd = ""
cmd = re.sub(r"\x27[^\x27]*\x27|\"(?:\\.|[^\"\\])*\"", "\"\"", cmd)   # 따옴표 안 문자열은 빼고 본다
print("yes" if re.search(r"(^|[;&|\n])\s*git\s+commit(\s|$)", cmd) else "no")
' 2>/dev/null)
if [ "$is_commit" != "yes" ]; then
  exit 0
fi

# 훅 실행 환경에는 Node 경로가 없을 수 있어서 흔한 설치 위치를 PATH에 더한다.
for d in /opt/homebrew/bin /usr/local/bin "$HOME"/.local/node-*/bin "$HOME"/.nvm/versions/node/*/bin "$HOME/.volta/bin"; do
  [ -d "$d" ] && PATH="$d:$PATH"
done
export PATH

fail=""

# ── 1. 품질 체크 (frontend) ──────────────────────────────
if ! command -v npm >/dev/null 2>&1; then
  fail+="[npm 없음] 훅 실행 환경에서 npm을 찾지 못했습니다. scripts/hooks/pre-commit-check.sh 의 PATH 설정에 Node 설치 경로를 추가하세요.\n\n"
else
  run() { # 이름 명령...
    local name=$1; shift
    local out
    if ! out=$("$@" 2>&1); then
      fail+="[$name 실패]\n$(printf '%s\n' "$out" | tail -15)\n\n"
    fi
  }
  run "format:check" npm --prefix frontend run -s format:check
  run "lint"         npm --prefix frontend run -s lint
  run "build"        npm --prefix frontend run -s build
fi

# ── 2. 컨벤션 (.kiro/steering/frontend-conventions.md) ────
# 커밋에 들어갈(스테이징된) frontend/src 의 .ts/.tsx 파일만, 스테이징된 내용 기준으로 검사한다.
files=$(git diff --cached --name-only --diff-filter=ACM -- 'frontend/src/*.ts' 'frontend/src/*.tsx')

rule() { # 규칙번호 정규식 설명 [대상경로-정규식] [제외경로-정규식]
  local id=$1 re=$2 msg=$3 only=${4:-.} skip=${5:-^$}
  local f ln
  for f in $files; do
    [[ $f =~ $only ]] || continue
    [[ $f =~ $skip ]] && continue
    while IFS=: read -r ln _; do
      fail+="[$id] $f:$ln — $msg\n"
    done < <(git show ":$f" | grep -nE "$re")
  done
}

rule F1 'from "axios"'                        'axios 는 src/api/client.ts 에서만 import'  '.' '^frontend/src/api/client\.ts$'
rule F2 'from "@/api/'                        'pages·components 는 src/api 대신 src/hooks 사용' '^frontend/src/(pages|components)/'
rule F3 'use(Query|Mutation)\('               'useQuery·useMutation 은 src/hooks 에서만'   '.' '^frontend/src/hooks/'
rule F4 'from "\.\./'                         '../ 대신 @/ 별칭 사용'
rule F5 'export default'                      'export default 대신 named export'
rule F6 'console\.'                           'console.* 사용 금지'
rule F7 '(: |as )any([^A-Za-z0-9_]|$)'        'any 타입 금지'
# 규칙을 추가하면 위에 rule 한 줄을 추가하고, frontend-conventions.md 표에도 같은 번호로 적는다.

if [ -n "$fail" ]; then
  {
    echo "커밋을 막았습니다. 아래 항목을 고친 뒤 다시 커밋하세요."
    echo
    printf '%b' "$fail"
  } >&2
  exit 2
fi
exit 0
