# 실습 ⑤. Hooks — 반복 작업 자동화

> **과정**: 실무 활용
> **소요 시간**: 약 30분
> **AI 요청 횟수**: 약 4회
> **난이도**: ★★★☆☆
> **실습 목표**: 프론트엔드 코드 컨벤션을 Steering으로 정하고, **훅이 변경 직후 자동으로 컨벤션을 점검**하게 한다. 이어서 `/pr-workflow` 한 줄로 format → lint → build부터 PR 본문 작성까지 진행한다.

---

## 0. 이 실습에서 배우는 것

- Hook이 무엇이고 **언제** 실행되는지 (트리거 → 액션)
- 지시문만 적으면 되는 **Ask Kiro(`agent`) 훅**
- 필요할 때 실행하는 워크플로를 **슬래시 명령(`/pr-workflow`)**으로 만드는 법

> 💡 **왜 Hook인가**: "화면 코드 고친 뒤 컨벤션 확인", "PR 올리기 전 빌드·본문 작성"처럼 좋은 절차도 사람이 매번 기억해야 하면 결국 빠집니다. Hook은 이런 일을 **이벤트에 묶어 자동으로** 돌립니다.

---

## 1. 준비된 파일 (AI 사용 없음)

저장소에 4개 파일이 있습니다. 모두 **설정과 지시문**이고, 스크립트는 없습니다.

| 파일 | 역할 |
|------|------|
| `.kiro/steering/frontend-conventions.md` | 프론트 컨벤션 (처음엔 F1~F7). `frontend/src/` 파일을 다룰 때 자동으로 대화에 포함됩니다 (`inclusion: fileMatch`). |
| `.kiro/hooks/convention-review.json` | **훅**. 에이전트가 응답을 마칠 때, 이번 턴에 고친 `frontend/src/` 파일을 `frontend-conventions.md`의 규칙으로 점검합니다. |
| `.kiro/steering/pr-workflow.md` | **`/pr-workflow`** 슬래시 명령. `frontend/`에서 format → lint:fix → lint → build, 컨벤션 점검 → PR 템플릿 작성 → 최종 확인을 차례로 진행합니다 (`inclusion: manual`). |
| `.github/pull_request_template.md` | PR 본문 형식 |

### 훅 파일 구조

`.kiro/hooks/convention-review.json`을 엽니다.

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "Frontend convention review after changes",
      "trigger": "Stop",
      "action": {
        "type": "agent",
        "prompt": "이번 턴에 frontend/src/ 아래 파일(.ts, .tsx)을 수정했다면, ... frontend-conventions.md 의 모든 규칙 기준으로 점검하고 ... 보고만 해. ... 수정하지 않았다면 아무 말도 하지 말고 끝내."
      }
    }
  ]
}
```

| 필드 | 뜻 |
|------|-----|
| `trigger` | **언제** 실행하나. `Stop`은 에이전트가 한 턴의 응답을 마쳤을 때 |
| `action.type` | **무엇을** 하나. `agent`(Ask Kiro)는 지시문을 에이전트에게 전달하고, `command`(Run Command)는 셸 명령을 실행 |
| `action.prompt` | 에이전트에게 전달할 지시문 |

주요 트리거는 이렇습니다.

| 트리거 | 언제 |
|--------|------|
| `PostFileSave` / `PostFileCreate` / `PostFileDelete` | **에이전트가** 파일을 저장·생성·삭제할 때 (`matcher`로 경로 필터) |
| `PreToolUse` / `PostToolUse` | 에이전트가 도구를 쓰기 전/후 |
| `Stop` | 에이전트가 한 턴의 응답을 마쳤을 때 |
| `PreTaskExec` / `PostTaskExec` | Spec 작업 시작 전/완료 후 |
| `SessionStart` / `UserPromptSubmit` | 세션 시작 / 프롬프트 전송 시 |

> 💡 **왜 `Stop`인가**: 에이전트가 파일을 여러 개 고치면 `PostFileSave`는 파일마다 돌아서 AI를 여러 번 부릅니다. `Stop`은 **한 턴에 한 번**만 돌아서 빠르고 사용량이 적습니다.

> 💡 **버튼으로 실행하는 훅은 어디 갔나**: 예전 IDE의 수동(버튼) 트리거 훅은 지금은 새로 만들 수 없습니다. Kiro 공식 문서는 필요할 때 실행하는 작업을 `inclusion: manual` Steering으로 만들어 `/파일이름`으로 실행하라고 안내합니다. `/pr-workflow`가 그 방식입니다. 지시문을 적는 방식은 예전 버튼 훅의 "Ask Kiro"와 같습니다.

훅이 로드됐는지는 IDE 탐색기의 **Agent Hooks** 섹션에서 확인합니다. 훅은 **새 세션**부터 적용되니, 새 대화를 열고 진행하세요.

---

## 2. 훅 동작 확인 — 일부러 위반하기 (AI 1회)

기본 에이전트 채팅에 입력합니다.

```text
실습용이야. 컨벤션 위반인 걸 알고 있으니 그대로 해줘.
frontend/src/pages/EmployeesPage.tsx 의 EmployeesPage() 함수 첫 줄에
console.log("직원 페이지 렌더링"); 을 추가해줘.
```

**기대 결과**
1. Kiro가 코드를 추가합니다. `frontend-conventions.md`가 대화에 포함돼 있어서, 추가하기 전에 "F6 위반"이라고 먼저 경고할 수도 있습니다. 그것도 Steering이 동작한 것입니다.
2. 응답이 끝나면 **훅이 실행되어** 점검 표가 이어서 나옵니다.

   | 규칙 번호 | 파일:라인 | 설명 |
   |-----------|-----------|------|
   | F6 | `EmployeesPage.tsx:22` 근처 | `console.*` 금지 |

3. 표가 나온 뒤에는 훅이 다시 돌아도 "이번 턴에 수정하지 않았다면 아무 말도 하지 말고 끝내" 지시 때문에 조용히 끝납니다.

> 💡 **lint와 무엇이 다른가**: 이 프로젝트의 ESLint 설정은 `console.log`를 막지 않아서 `npm run lint`로는 통과합니다. 훅은 도구가 모르는 **프로젝트 규칙**(F1~F7)을 Steering 기준으로 점검합니다.

이번에는 코드를 고치지 않는 질문을 해 봅니다.

```text
EmployeesPage는 무슨 역할을 하는 화면이야?
```

**기대 결과**: 답변 뒤에 점검 표가 **나오지 않습니다**. 이번 턴에 `frontend/src/` 파일을 고치지 않았기 때문입니다.

**되돌리기**

```bash
git checkout -- frontend/src/pages/EmployeesPage.tsx
```

---

## 3. 프로젝트에 맞게 개선 — 컨벤션 하나 추가하기 (AI 1회)

이 프로젝트의 컴포넌트 props 타입은 모두 `interface <컴포넌트명>Props` 형태입니다(`ModalProps`, `DataTableProps` 등). 이 규칙을 컨벤션에 추가합니다.

`.kiro/steering/frontend-conventions.md`의 F7 행 **바로 아래**에 한 줄을 추가합니다.

```markdown
| F8 | 컴포넌트 props 타입은 `interface <컴포넌트명>Props`로 선언한다 (예: `ModalProps`) |
```

훅과 `/pr-workflow`는 고칠 필요가 없습니다. 둘 다 "`frontend-conventions.md`의 **모든 규칙**"을 기준으로 점검하도록 적혀 있어서, Steering에 추가한 규칙을 그대로 따릅니다.

**새 대화**를 열고 입력합니다.

```text
실습용이야. 컨벤션 위반인 걸 알고 있으니 그대로 해줘.
frontend/src/components/common/Divider.tsx 를 새로 만들어줘.
props 타입은 type Props = { label: string } 로 하고, label을 <hr> 아래에 보여주는 컴포넌트야.
```

**기대 결과**: 훅 점검 표에 **F8 위반**(`type Props`)이 나오면 성공입니다.

> 💡 규칙 한 줄을 추가했더니 훅의 점검 기준이 바로 바뀌었습니다. 훅은 지시문만 들고 있고, **기준은 Steering 한 곳**에 있어서 규칙을 고칠 곳이 하나뿐입니다.

**되돌리기** (새로 만든 파일만 지우고, 추가한 F8은 남겨도 됩니다)

```bash
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

> 💡 **슬래시 명령 vs 훅**: `/pr-workflow`는 **사람이 원할 때** 실행하고, 훅은 **이벤트가 생기면 자동으로** 실행합니다. 둘 다 지시문만 적으면 되는 방식이라, 반복 작업의 성격에 따라 골라 씁니다.

---

## 5. 완료 체크리스트

- [ ] 훅 파일에서 `trigger`와 `action`의 뜻을 설명할 수 있다
- [ ] 위반 코드를 추가시켰더니 훅이 F6 위반을 보고했다
- [ ] 코드를 고치지 않은 질문에서는 훅이 아무것도 보고하지 않았다
- [ ] F8을 추가했고, 훅이 F8 위반을 보고했다
- [ ] `/pr-workflow`로 PR 본문을 받았다
- [ ] 실습 중 바꾸거나 만든 코드를 되돌렸다

---

## 6. 흔한 에러 & 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 훅이 실행되지 않음 | 훅을 추가하거나 고친 뒤 같은 세션을 계속 씀 | 새 대화(세션)를 열고 다시 시도 |
| 훅 파일을 고친 뒤 Agent Hooks에서 사라짐 | `prompt`의 따옴표를 지워 JSON이 깨짐 | `git checkout -- .kiro/hooks/convention-review.json` 후 다시 수정 |
| F8이 점검되지 않음 | 규칙을 추가한 뒤 같은 대화를 계속 씀 | 새 대화에서 다시 요청 |
| 점검 표가 계속 반복됨 | 훅 지시문의 "수정하지 않았다면 아무 말도 하지 말고 끝내"가 빠짐 | 지시문 끝 문장을 되살리기 |
| Kiro가 위반 코드를 거부함 | Steering이 컨벤션 위반을 막음 | 요청에 "실습용이야. 위반인 걸 알고 있으니 그대로 해줘"를 넣기 |
| `/pr-workflow`가 목록에 없음 | 파일 이름이나 front-matter(`inclusion: manual`)가 다름 | `.kiro/steering/pr-workflow.md`와 첫 3줄 확인 |
| `npm run format`/`lint`가 없다고 나옴 | `frontend/`에서 `npm install`을 하지 않음 | `cd frontend && npm install` |
| 빌드 단계 실패 | Node 미설치 또는 타입 오류 | 실습 ⓪의 환경 확인. 실패도 결과로 보고되는 것이 정상 |

---

## 7. 돌아보기

- **Steering(기준) + Hook(자동 실행) + 슬래시 명령(필요할 때 실행)** 을 조합하면, 규칙은 한 곳에 두고 점검은 자동으로 돌릴 수 있습니다.
- 훅이 AI로 점검하면 결과가 매번 조금씩 다를 수 있습니다. **반드시 지켜야 하는** 규칙은 ESLint 규칙으로 옮기세요(예: `no-console`). 그러면 `npm run lint`가 매번 같은 결과로 잡습니다.
- 다른 프로젝트에서는 `frontend-conventions.md`의 규칙과 `pr-workflow.md`의 빌드 명령·기준 브랜치만 바꾸면 그대로 쓸 수 있습니다.
- 다음(⑥)에서는 이 모든 것을 **내 프로젝트에 이식**하는 방법을 정리합니다.

---

이전 실습 ← [실습 ④ Skills](./04-skills.md) · 다음 실습 → [실습 ⑥ 실무 적용 가이드 및 FAQ](./06-실무적용-faq.md)
