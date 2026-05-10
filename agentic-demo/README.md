# agentic-demo — W3A-8 Cursor CLI Hands-on

이 폴더는 **W3A-8 (Cursor CLI로 프론트엔드 만들기 — Agentic 워크플로)** 강의 데모 전용입니다.

## 이 폴더는 IDE에서 보이지 않습니다

루트의 `.cursorindexingignore`, `.copilotignore`, `.vscode/settings.json`이 이 폴더를 가립니다.
백엔드 IDE 실습(Cursor IDE: W3A-5/6, Copilot Autopilot: W3B)을 진행할 때 React/Vite 규칙이 끼어드는 것을 방지하기 위함입니다.

`.cursorignore` 가 아닌 `.cursorindexingignore` 를 쓰는 이유 — 전자는 cursor-agent CLI 의 직접 파일 편집(Edit/Write)까지 막아 데모가 Bash 우회로만 진행되어 느려집니다. 후자는 *IDE 인덱싱만 차단* 해서 IDE 격리와 CLI 자유 편집을 동시에 달성합니다.

## 어떻게 시작하나

컨트롤러는 *Node 단일 스크립트* 라 macOS/Linux/Windows 어디서나 같은 코드가 돕니다. 페인 셋업(멀티플렉서)만 OS별:

| OS | 페인 셋업 | 컨트롤러 |
|---|---|---|
| macOS / Linux | `zellij --layout .zellij/layouts/agentic-demo.kdl` | `node bin/agentic-pipeline.js` |
| Windows | `pwsh .\bin\agentic-launch.ps1` (Windows Terminal 자동 분할) | `node bin\agentic-pipeline.js` |

### macOS / Linux

```bash
# 1) 백엔드 띄움 (다른 터미널)
cd ..
./mvnw spring-boot:run

# 2) 이 폴더로 이동해서 zellij 진입
cd agentic-demo
zellij --layout .zellij/layouts/agentic-demo.kdl

# 3) controller 페인에서
node bin/agentic-pipeline.js                       # 학생
INSTRUCTOR_MODE=1 node bin/agentic-pipeline.js     # 강사 (+ AWS S3 배포)
```

### Windows (PowerShell)

```powershell
# (한 번만) PowerShell 스크립트 실행 허용
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# 1) 백엔드 띄움 (다른 터미널)
cd ..
.\mvnw.cmd spring-boot:run

# 2) 이 폴더로 이동해서 Windows Terminal 자동 셋업
cd agentic-demo
powershell .\bin\agentic-launch.ps1
# pwsh(PowerShell 7) 깔려 있으면: pwsh .\bin\agentic-launch.ps1
# launcher 가 알아서 pwsh / powershell 중 가용한 쪽으로 페인을 띄움

# 3) controller 페인(맨 아래)에서
node bin\agentic-pipeline.js                            # 학생
$env:INSTRUCTOR_MODE='1'; node bin\agentic-pipeline.js  # 강사 (+ AWS S3 배포)
```

#### 자동 셋업이 실패하면 — 수동 가이드

```powershell
# 1. Windows Terminal 새 창 열기 (wt)
# 2. Alt + Shift + - 를 6번 눌러 7개 페인으로 분할 (수평 분할)
# 3. 위에서부터 각 페인에 다음 명령 입력 (헬퍼 스크립트 사용 — 한글/UTF-8 자동 처리):
powershell -NoExit -File .\bin\_pane-tail.ps1 -Name planner
powershell -NoExit -File .\bin\_pane-tail.ps1 -Name scaffolder
powershell -NoExit -File .\bin\_pane-tail.ps1 -Name api-integrator
powershell -NoExit -File .\bin\_pane-tail.ps1 -Name ui-builder
powershell -NoExit -File .\bin\_pane-tail.ps1 -Name verifier
powershell -NoExit -File .\bin\_pane-tail.ps1 -Name release-engineer
# 4. 마지막(컨트롤러) 페인:
powershell -NoExit -File .\bin\_pane-controller.ps1
# 그 안에서: node bin\agentic-pipeline.js
```

### 리셋해서 다시 돌리기

```powershell
# Windows
Remove-Item .logs\*.log, .logs\*.raw.log, .logs\*.stderr.log -Force -ErrorAction SilentlyContinue
# 산출물 통째로 지우려면 (선택)
Remove-Item -Recurse -Force web-dashboard, TASKS.md, RESULT.md -ErrorAction SilentlyContinue
```

```bash
# macOS / Linux
rm -f .logs/*.log .logs/*.raw.log .logs/*.stderr.log
# 산출물 통째로 지우려면 (선택)
rm -rf web-dashboard TASKS.md RESULT.md
```

### 자주 막히는 지점

| 증상 | 해결 |
|---|---|
| `node` 인식 안 됨 | `winget install OpenJS.NodeJS.LTS` 후 새 PowerShell 창 |
| `cursor-agent` 인식 안 됨 | Cursor 설치 → `Cursor` 메뉴에서 *"Install cursor-agent CLI"* |
| `pwsh` 없음 | `powershell` 로 대체 (Win10 내장) — 동작은 동일 |
| `wt` 없음 | Microsoft Store → *Windows Terminal* 설치 |
| `.ps1 cannot be loaded` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| 백엔드 헬스체크 실패 | `Invoke-WebRequest http://localhost:8080/v3/api-docs` 로 직접 확인. 8080 포트 점유 시 종료 후 재시도 |
| 페인은 떴지만 텍스트가 안 흐름 | `.logs\planner.raw.log` 의 첫 줄 확인 — JSON 형태가 안 나오면 cursor-agent 인증 문제 (`cursor-agent --help`로 우선 검증) |
| TypeScript 빌드 에러로 verifier 가 멈춤 | verifier 페인 출력 + `web-dashboard\dist` 디렉터리 존재 여부 확인 |
| 페인의 한글이 깨져 보임 | 헬퍼(`_pane-tail.ps1`)가 자동으로 UTF-8 셋업하므로 정상. 그래도 깨지면 `chcp 65001` 직접 실행 후 페인 재시작 |
| WT가 7개 *탭* 으로 갈라짐 (페인이 아니라) | launcher 가 `;` 처리에 실패. 수동 가이드 (위 "자동 셋업이 실패하면" 섹션) 사용 |

## 폴더 구조

```
agentic-demo/
├── README.md                       ← 이 파일
├── AGENTS.md                       ← 모든 서브에이전트의 공통 규칙
├── PLAN.md                         ← 만들 화면 정의
├── .cursor/agents/                  ← 6개 서브에이전트 정의
│   ├── planner.md
│   ├── scaffolder.md
│   ├── ui-builder.md
│   ├── api-integrator.md
│   ├── verifier.md
│   └── release-engineer.md
│
├── .zellij/layouts/agentic-demo.kdl ← macOS/Linux 페인 레이아웃 (zellij)
├── bin/
│   ├── agentic-pipeline.js          ← Node 단일 컨트롤러 (모든 OS 공통)
│   ├── agentic-launch.ps1           ← Windows Terminal 자동 분할 런처
│   ├── _pane-tail.ps1               ← (Windows 전용) 한 페인의 UTF-8 tail 헬퍼
│   └── _pane-controller.ps1         ← (Windows 전용) 컨트롤러 페인 헬퍼
│
├── (.logs/)                         ← gitignored, 페인 tail 대상
├── (TASKS.md, RESULT.md)            ← gitignored, 자동 생성
└── (web-dashboard/)                 ← gitignored, scaffolder가 생성한 React 프로젝트
```

## 사전 준비

| 도구 | macOS/Linux | Windows |
|---|---|---|
| Node.js 18+ | brew/nvm | winget / 공식 인스톨러 (이미 깔려 있음 — MCP 실습 사전 준비) |
| Cursor CLI (`cursor-agent`) | https://docs.cursor.com/cli | 동일 |
| 멀티플렉서 | zellij (`brew install zellij`) | Windows Terminal (Microsoft Store, 보통 사전 설치) |
| 백엔드 의존성 | (위 aind-hr-project README 참고) | 동일 |

## Cursor CLI의 한계와 우회

현재 Cursor CLI(`cursor-agent`)는 `.cursor/agents/*.md` 의 *서브에이전트 자동 호출 기능이 없습니다* (Claude Code의 Task 도구와 다름). 그래서:

- Node 컨트롤러가 각 `.md` 파일의 본문(역할 설명)을 *읽어서 프롬프트에 합쳐* `cursor-agent --print` 로 호출
- 각 호출은 *독립 세션* — 컨텍스트는 자동으로 격리
- `--output-format stream-json --stream-partial-output` 으로 토큰 단위 스트리밍 → JSON.parse → 텍스트만 페인 로그에 흘림
- frontmatter의 `tools: [...]` 권한 명시는 *문서 역할만* — 실제 권한 강제는 안 됨 (`--force` 로 모든 도구 허용)
- 시각적 분리(페인별 로그)와 워크플로 형태는 그대로 유지

향후 Cursor CLI가 서브에이전트를 지원하면 컨트롤러만 갈아끼우면 됩니다.

## API 학습 방식 — 백엔드 코드는 안 봅니다

api-integrator 에이전트는 백엔드 Java 코드를 보지 않고, *실행 중인 백엔드의 OpenAPI 스펙과 실제 응답*을 curl로 조회해서 타입을 학습합니다:

```bash
# macOS/Linux/Windows 동일
curl -s http://localhost:8080/v3/api-docs
curl -s http://localhost:8080/v1/employees    # jq 는 선택, 없어도 됨
```

폴더 결합 없이 백엔드 API 정확도를 유지하는 방식입니다.
