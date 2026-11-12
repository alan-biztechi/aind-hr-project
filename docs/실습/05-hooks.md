# 실습 ⑤. Hooks — 반복 작업 자동화

> **과정**: 실무 활용
> **소요 시간**: 약 30분
> **AI 요청 횟수**: 약 6회
> **난이도**: ★★★☆☆
> **실습 목표**: 프론트엔드 코드 컨벤션을 Steering으로 정하고, **커밋을 요청하면 훅이 커밋 직전에 자동으로 검사해 문제가 있을 때만 막게** 한다. 이어서 `/pr-workflow` 한 줄로 format → lint → build부터 PR 본문 작성까지 진행한다.

---

## 0. 이 실습에서 배우는 것

- Hook이 무엇이고 **언제** 실행되는지 (트리거 → 액션)
- 문제가 있을 때만 멈추는 **Run Command(`command`) 훅**과 종료 코드
- 필요할 때 실행하는 워크플로를 **슬래시 명령(`/pr-workflow`)**으로 만드는 법

> 💡 **왜 Hook인가**: "커밋 전에 lint·build·컨벤션 확인", "PR 올리기 전 본문 작성"처럼 좋은 절차도 사람이 매번 기억해야 하면 결국 빠집니다. Hook은 이런 일을 **이벤트에 묶어 자동으로** 돌립니다.

---

## 1. 준비된 파일 (AI 사용 없음)

| 파일 | 역할 |
|------|------|
| `.kiro/steering/frontend-conventions.md` | 프론트 컨벤션 (처음엔 F1~F7). `frontend/src/` 파일을 다룰 때 자동으로 대화에 포함되어, Kiro가 코드를 쓸 때부터 지킵니다 (`inclusion: fileMatch`). |
| `.kiro/hooks/pre-commit-check.json` | **훅**. Kiro가 `git commit`을 실행하기 직전에 아래 스크립트를 실행합니다. |
| `scripts/hooks/pre-commit-check.sh` | 훅이 실행하는 검사. `format:check` → `lint` → `build` → 스테이징된 `frontend/src` 파일의 컨벤션(F1~F7) |
| `.kiro/steering/pr-workflow.md` | **`/pr-workflow`** 슬래시 명령. format → lint:fix → lint → build, 컨벤션 점검 → PR 템플릿 작성 → 최종 확인 (`inclusion: manual`) |
| `.github/pull_request_template.md` | PR 본문 형식 |

### 훅 파일 구조

`.kiro/hooks/pre-commit-check.json`을 엽니다.

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "Pre-commit check (frontend)",
      "trigger": "PreToolUse",
      "matcher": "shell",
      "action": {
        "type": "command",
        "command": "bash scripts/hooks/pre-commit-check.sh",
        "timeout": 120
      }
    }
  ]
}
```

| 필드 | 뜻 |
|------|-----|
| `trigger` | **언제** 실행하나. `PreToolUse`는 에이전트가 도구를 쓰기 **직전** |
| `matcher` | **어떤 도구**에 반응하나. `shell`은 셸 명령 도구 전체 |
| `action.type` | **무엇을** 하나. `command`(Run Command)는 셸 명령을 실행하고, `agent`(Ask Kiro)는 지시문을 에이전트에게 전달 |
| `action.command` | 실행할 명령. 훅은 **프로젝트 루트에서** 실행되고, 도구 호출 정보(JSON)를 표준 입력으로 받습니다. |

`command` 훅은 **종료 코드**로 결과를 알립니다.

| 종료 코드 | 동작 |
|-----------|------|
| `0` | 통과. 원래 명령을 그대로 실행 (이 스크립트는 이때 아무것도 출력하지 않음) |
| `2` | **차단**. 원래 명령을 실행하지 않고, 스크립트가 출력한 이유를 Kiro와 사용자에게 보여 줌 |

그래서 이 훅은 **문제가 있을 때만 멈춥니다.**

| 상황 | 동작 |
|------|------|
| `git commit`이 아닌 명령 (`git add`, `npm run` 등) | 아무 표시 없이 통과 |
| `git commit` + 검사 모두 통과 | 아무 표시 없이 커밋 |
| `git commit` + 실패나 위반 있음 | 커밋을 막고 실패 항목·위반 위치만 보여 줌 |

주요 트리거는 이렇습니다.

| 트리거 | 언제 |
|--------|------|
| `PostFileSave` / `PostFileCreate` / `PostFileDelete` | **에이전트가** 파일을 저장·생성·삭제할 때 (`matcher`로 경로 필터) |
| `PreToolUse` / `PostToolUse` | 에이전트가 도구를 쓰기 전/후 (`matcher`로 도구 필터) |
| `Stop` | 에이전트가 한 턴의 응답을 마쳤을 때 |
| `PreTaskExec` / `PostTaskExec` | Spec 작업 시작 전/완료 후 |
| `SessionStart` / `UserPromptSubmit` | 세션 시작 / 프롬프트 전송 시 |

> 💡 **왜 커밋 직전인가**: 코드를 고칠 때마다 검사하면 작업 중간에도 결과가 쏟아집니다. 사람이 "이제 커밋해줘"라고 한 **그 순간에 한 번** 검사하면, 작업 흐름을 끊지 않고 커밋에 들어갈 코드만 확인할 수 있습니다.

> 💡 **왜 `agent`가 아니라 `command`인가**: `matcher`는 도구 이름만 거를 수 있어서, 훅은 **모든 셸 명령**마다 실행됩니다. `agent` 훅이면 그때마다 Kiro가 지시문을 읽고 판단하느라 매번 멈칫합니다. `command` 훅은 스크립트가 "커밋이 아니면 바로 통과"를 순식간에 처리해서, 평소에는 아무것도 보이지 않습니다. 검사도 매번 같은 결과가 나오고 AI 사용량이 들지 않습니다.

> 💡 **수동으로 돌리는 방법**: 예전 IDE의 수동(버튼) 트리거 훅은 지금은 새로 만들 수 없습니다(Kiro 공식 문서). 이 훅은 **"커밋해줘"라는 요청이 곧 실행 버튼** 역할을 합니다. 커밋과 상관없이 원할 때 점검하려면 `/pr-workflow`를 씁니다.

> ⚠️ **Kiro를 거치지 않은 커밋에는 돌지 않습니다**: 터미널이나 IDE의 Git 화면에서 직접 `git commit`하면 Kiro 훅은 실행되지 않습니다. 모든 커밋에 강제하려면 git 자체의 pre-commit 훅이 필요합니다.

훅이 로드됐는지는 IDE 탐색기의 **Agent Hooks** 섹션에서 확인합니다.

---

## 2. 훅 동작 확인 — 위반이 있으면 커밋이 멈추는지 (AI 2회)

**① 위반 코드 넣기.** 기본 에이전트 채팅에 입력합니다.

```text
실습용이야. 컨벤션 위반인 걸 알고 있으니 그대로 해줘.
frontend/src/pages/EmployeesPage.tsx 의 EmployeesPage() 함수 첫 줄에
console.log("직원 페이지 렌더링"); 을 추가해줘.
```

이 단계에서는 훅이 아무것도 표시하지 않습니다. 커밋이 아니기 때문입니다.

**② 커밋 요청하기.** 이어서 입력합니다.

```text
방금 바꾼 EmployeesPage.tsx만 스테이징해서 "실습: 콘솔 로그 추가" 메시지로 커밋해줘.
```

**기대 결과**
1. `git add`는 아무 표시 없이 실행됩니다.
2. `git commit`을 실행하려는 순간 **훅이 커밋을 막고** 이렇게 보여 줍니다.

   ```text
   커밋을 막았습니다. 아래 항목을 고친 뒤 다시 커밋하세요.

   [F6] frontend/src/pages/EmployeesPage.tsx:22 — console.* 사용 금지
   ```

   `format:check`, `lint`, `build`는 통과해서 목록에 나오지 않습니다. **실패한 것만** 나옵니다.
3. 커밋이 만들어지지 않았는지 확인합니다.

   ```bash
   git log --oneline -1   # "실습: 콘솔 로그 추가" 커밋이 없어야 함
   ```

> 💡 **lint와 무엇이 다른가**: 이 프로젝트의 ESLint 설정은 `console.log`를 막지 않아서 `npm run lint`는 통과합니다. 훅은 도구가 모르는 **프로젝트 규칙**(F1~F7)까지 커밋 전에 검사합니다.

**③ 위반이 없으면 그대로 커밋되는지.** 되돌린 뒤 위반 없는 변경으로 커밋을 요청합니다.

```bash
git restore --staged frontend/src/pages/EmployeesPage.tsx
git checkout -- frontend/src/pages/EmployeesPage.tsx
```

```text
frontend/src/pages/NotFoundPage.tsx 의 컴포넌트 함수 바로 위에 // 404 페이지 주석 한 줄만 추가하고, 그 파일만 스테이징해서 "실습: 통과 커밋" 메시지로 커밋해줘.
```

**기대 결과**: 훅은 **아무것도 표시하지 않고** 커밋이 만들어집니다. 확인 후 테스트 커밋을 지웁니다.

```bash
git log --oneline -1    # "실습: 통과 커밋"이 맨 위에 있는지 확인한 뒤에만 아래 실행
git reset --hard HEAD~1
```

---

## 3. 프로젝트에 맞게 개선 — 컨벤션 하나 추가하기 (AI 2회)

이 프로젝트의 컴포넌트 props 타입은 모두 `interface <컴포넌트명>Props` 형태입니다(`ModalProps`, `DataTableProps` 등). 이 규칙을 추가합니다. **두 곳**에 한 줄씩 넣습니다.

**① 규칙 문서** — `.kiro/steering/frontend-conventions.md`의 F7 행 바로 아래에 추가합니다. Kiro가 코드를 쓸 때 이 규칙을 따르게 됩니다.

```markdown
| F8 | 컴포넌트 props 타입은 `interface <컴포넌트명>Props`로 선언한다 (예: `ModalProps`) |
```

**② 검사 스크립트** — `scripts/hooks/pre-commit-check.sh`의 `rule F7 …` 줄 바로 아래에 추가합니다. 커밋 직전에 이 규칙을 검사하게 됩니다.

```bash
rule F8 'type [A-Za-z]*Props[[:space:]]*='    'props 타입은 interface <컴포넌트명>Props 로 선언'
```

> 💡 `rule 번호 '찾을 정규식' '설명'` 형식입니다. 특정 폴더만 검사하려면 네 번째 인자에 대상 경로 정규식, 다섯 번째 인자에 제외 경로 정규식을 적습니다(F1~F3 참고).

**새 대화**를 열고 차례로 입력합니다.

```text
실습용이야. 컨벤션 위반인 걸 알고 있으니 그대로 해줘.
frontend/src/components/common/Divider.tsx 를 새로 만들어줘.
props 타입은 type Props = { label: string } 로 하고, label을 <hr> 아래에 보여주는 컴포넌트야.
```

```text
Divider.tsx만 스테이징해서 "실습: Divider 추가" 메시지로 커밋해줘.
```

**기대 결과**: 훅이 커밋을 막고 `[F8] frontend/src/components/common/Divider.tsx:… — props 타입은 interface <컴포넌트명>Props 로 선언`을 보여 주면 성공입니다.

> 💡 Steering에는 **규칙의 뜻**을, 스크립트에는 **검사 방법**을 적었습니다. Kiro는 Steering을 보고 처음부터 규칙대로 쓰려 하고, 스크립트는 그래도 빠진 것을 커밋 직전에 확실하게 잡습니다.

**되돌리기** (새로 만든 파일만 지우고, 추가한 F8은 남겨도 됩니다)

```bash
git restore --staged frontend/src/components/common/Divider.tsx
rm frontend/src/components/common/Divider.tsx
```

---

## 4. `/pr-workflow` 실행하기 (AI 1회)

채팅에 입력합니다.

```text
/pr-workflow
```

`pr-workflow.md`의 지시문대로 차례로 진행됩니다. 명령 실행 승인을 물으면 허용합니다.

| 단계 | 하는 일 |
|------|---------|
| Step 1 코드 품질 체크 | `frontend/`에서 `npm run format` → `npm run lint:fix` → `npm run lint` → `npm run build` → 바뀐 `frontend/src` 파일을 컨벤션으로 점검 |
| Step 2 PR 템플릿 작성 | `git diff main...HEAD`로 변경 분석 → `.github/pull_request_template.md` 형식으로 본문 작성 |
| Step 3 최종 확인 | 작성된 PR 본문을 마크다운으로 보여 주고, 추가로 확인할 사항 안내 |

**기대 결과**: 마지막에 PR 본문이 마크다운 블록으로 나옵니다. **검증 표에는 실제로 실행한 결과만** 적혀 있어야 합니다. 예를 들어 컴파일이 실패했다면 실패로 적혀 있어야 합니다.

> 💡 지시문에 "오류가 발생해도 절대 코드를 수정하지 마세요"와 "PR 생성은 요청하면 그때"가 들어 있어서, `/pr-workflow`는 **보고만** 하고 코드를 바꾸거나 PR을 올리지 않습니다. 실제로 PR을 만들려면 결과를 확인한 뒤 따로 요청합니다.

> 💡 **슬래시 명령 vs 훅**: `/pr-workflow`는 **사람이 원할 때** 실행하고, 훅은 **이벤트가 생기면 자동으로** 실행합니다. 반복 작업이 "원할 때 한 번"이면 슬래시 명령, "특정 순간마다 반드시"면 훅을 씁니다.

---

## 5. 완료 체크리스트

- [ ] 훅 파일에서 `trigger`, `matcher`, `action`의 뜻을 설명할 수 있다
- [ ] 위반 코드를 넣은 뒤 커밋을 요청했더니, 훅이 F6 위반만 보여 주고 커밋을 막았다
- [ ] 위반 없는 변경은 훅이 아무것도 표시하지 않고 커밋됐다
- [ ] Steering과 스크립트에 F8을 추가했고, 훅이 F8 위반으로 커밋을 막았다
- [ ] `/pr-workflow`로 PR 본문을 받았다
- [ ] 실습 중 바꾸거나 만든 코드를 되돌렸다

---

## 6. 흔한 에러 & 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 커밋했는데 훅이 아무것도 안 함 | 검사가 모두 통과함 (정상) / 또는 훅이 꺼져 있음 | 위반을 일부러 넣어 확인. Agent Hooks에서 훅이 켜져 있는지 확인 |
| 터미널에서 커밋했더니 검사가 없음 | Kiro 훅은 Kiro가 실행하는 명령에만 반응 | Kiro에게 커밋을 요청 |
| `[npm 없음]`으로 커밋이 막힘 | 훅 실행 환경의 PATH에 Node 경로가 없음 | `scripts/hooks/pre-commit-check.sh`의 PATH 목록(`for d in …`)에 `which npm`으로 확인한 폴더를 추가 |
| `[format:check 실패]`로 막힘 | 포맷이 맞지 않는 파일이 있음 | `cd frontend && npm run format` 후 다시 커밋 |
| `[lint 실패]` / `[build 실패]`로 막힘 | 린트·타입·빌드 오류 | 출력된 마지막 15줄의 파일:라인을 보고 수정 |
| F8을 추가했는데 검사되지 않음 | Steering에만 추가하고 스크립트에는 `rule F8` 줄을 넣지 않음 | 스크립트의 `rule F7` 아래에 `rule F8 …` 추가 |
| 훅을 고친 뒤 Agent Hooks에서 사라짐 | JSON 문법이 깨짐 | `git checkout -- .kiro/hooks/pre-commit-check.json` |
| Kiro가 위반 코드를 거부함 | Steering이 컨벤션 위반을 막음 | 요청에 "실습용이야. 위반인 걸 알고 있으니 그대로 해줘"를 넣기 |
| `/pr-workflow`가 목록에 없음 | 파일 이름이나 front-matter(`inclusion: manual`)가 다름 | `.kiro/steering/pr-workflow.md`와 첫 3줄 확인 |
| `npm run format`/`format:check`/`lint`가 없다고 나옴 | `frontend/`에서 `npm install`을 하지 않음 | `cd frontend && npm install` |


---

## 7. 돌아보기

- **Steering(기준) + Hook(자동 실행) + 슬래시 명령(필요할 때 실행)** 을 조합하면, 규칙은 한 곳에 두고 점검은 자동으로 돌릴 수 있습니다.
- 훅 검사는 스크립트라 매번 같은 결과가 나옵니다. ESLint로 표현할 수 있는 규칙(예: `no-console`)은 ESLint 설정으로 옮기면 편집기에서도 바로 보입니다.
- 다른 프로젝트에서는 `frontend-conventions.md`의 규칙과 `pr-workflow.md`의 빌드 명령·기준 브랜치만 바꾸면 그대로 쓸 수 있습니다.
- 다음(⑥)에서는 이 모든 것을 **내 프로젝트에 이식**하는 방법을 정리합니다.

---

이전 실습 ← [실습 ④ Skills](./04-skills.md) · 다음 실습 → [실습 ⑥ 실무 적용 가이드 및 FAQ](./06-실무적용-faq.md)
