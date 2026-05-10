# agentic-demo — W3A-8 Cursor CLI Hands-on

이 폴더는 **W3A-8 (Cursor CLI로 프론트엔드 만들기 — Agentic 워크플로)** 강의 데모 전용입니다.

## 이 폴더는 IDE에서 보이지 않습니다

루트의 `.cursorignore`, `.copilotignore`, `.vscode/settings.json`이 이 폴더를 가립니다.
백엔드 IDE 실습(Cursor IDE: W3A-5/6, Copilot Autopilot: W3B)을 진행할 때 React/Vite 규칙이 끼어드는 것을 방지하기 위함입니다.

## 어떻게 시작하나

```bash
# 1) 백엔드부터 띄움 (다른 터미널)
cd ..        # aind-hr-project 루트로
./mvnw spring-boot:run

# 2) 이 폴더로 이동해서 zellij 진입
cd agentic-demo
zellij --layout .zellij/layouts/agentic-demo.kdl

# 3) 활성화된 controller 페인에서 파이프라인 실행
./bin/agentic-pipeline.sh                # 학생 모드 (5 에이전트)
INSTRUCTOR_MODE=1 ./bin/agentic-pipeline.sh   # 강사 모드 (+ AWS S3 배포)
```

## 폴더 구조

```
agentic-demo/
├── README.md                       ← 이 파일
├── AGENTS.md                       ← 모든 서브에이전트의 공통 규칙
├── PLAN.md                         ← 만들 화면 정의
├── .cursorignore                    ← (빈) 워크스페이스 anchor
│
├── .cursor/agents/                  ← 6개 서브에이전트 정의
│   ├── planner.md
│   ├── scaffolder.md
│   ├── ui-builder.md
│   ├── api-integrator.md
│   ├── verifier.md
│   └── release-engineer.md
│
├── .zellij/layouts/agentic-demo.kdl ← 6+1 페인 레이아웃
├── bin/agentic-pipeline.sh          ← bash 컨트롤러
│
├── (.logs/)                         ← gitignored, 페인 tail 대상
├── (TASKS.md, RESULT.md)            ← gitignored, 자동 생성
└── (web-dashboard/)                 ← gitignored, scaffolder가 생성한 React 프로젝트
```

## API 학습 방식 — 백엔드 코드는 안 봅니다

api-integrator 에이전트는 백엔드 Java 코드를 보지 않고, *실행 중인 백엔드의 OpenAPI 스펙과 실제 응답*을 curl로 조회해서 타입을 학습합니다:

```bash
curl -s http://localhost:8080/v3/api-docs
curl -s http://localhost:8080/v1/employees | jq '.[0]'
```

폴더 결합 없이 백엔드 API 정확도를 유지하는 방식입니다.
