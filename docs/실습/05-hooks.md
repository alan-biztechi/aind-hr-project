# 실습 ⑤. Hooks — 반복 작업 자동화

> **과정**: 실무 활용
> **소요 시간**: 약 30분 (선택 실습 포함 시 약 40분)
> **AI 요청 횟수**: 약 3회 (선택 실습 포함 시 약 5회)
> **난이도**: ★★☆☆☆
> **실습 목표**: Kiro가 프론트 파일을 저장할 때마다 **ESLint 자동 수정이 실행되는 훅**을 만들고, 고칠 수 없는 오류는 Kiro가 바로 알아차리게 한다. (선택) PR 준비 절차를 **슬래시 명령 Steering**(`/pr-workflow`)으로 만들어 필요할 때 실행한다.

---

## 0. 이 실습에서 배우는 것

- Hook이 무엇이고 **언제** 실행되는지 (트리거 → matcher → 액션)
- **Run Command(`command`) 훅**과 종료 코드: 문제가 있을 때만 Kiro에게 알리기
- "항상 자동으로"는 훅, "원할 때 한 번"은 슬래시 명령으로 나누는 기준

> 💡 **왜 Hook인가**: "코드를 고치면 lint 돌리기"처럼 반드시 해야 하는 일을 AI가 매번 기억하길 기대하면 결국 빠집니다. Steering은 **가이드라인**(Kiro가 대부분 따름)이고, Hook은 **규칙**(이벤트가 생기면 반드시 실행)입니다.

> 💡 **왜 lint-on-save인가**: Kiro 공식 문서의 대표 예시가 "TS 파일 저장 시 ESLint 실행"이고, 다른 AI 코딩 도구에서도 가장 많이 쓰는 훅이 "파일 수정 후 lint/format"입니다. 결과가 매번 같고 AI 사용량(크레딧)이 들지 않습니다.

---

## 1. 개념 (AI 사용 없음)

훅은 `.kiro/hooks/<이름>.json` 파일 하나입니다. 이번에 만들 훅은 이렇게 생겼습니다.

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "Lint on save (frontend)",
      "trigger": "PostFileSave",
      "matcher": "frontend/src/.*\\.(ts|tsx)$",
      "action": {
        "type": "command",
        "command": "cd frontend && npm run lint:fix 1>&2",
        "timeout": 60
      }
    }
  ]
}
```

| 필드 | 뜻 |
|------|-----|
| `trigger` | **언제** 실행하나. `PostFileSave`는 **Kiro가** 파일을 저장·수정한 직후 |
| `matcher` | **어떤 파일**에 반응하나. 파일 이벤트는 경로 정규식. 여기서는 `frontend/src/` 아래 `.ts`, `.tsx`만 |
| `action.type` | **무엇을** 하나. `command`는 셸 명령 실행, `agent`는 지시문을 Kiro에게 전달 |
| `action.command` | 실행할 명령. 훅은 **프로젝트 루트에서** 실행됩니다 |
| `timeout` | 초 단위 제한 시간 (기본 60) |

`command` 훅은 **종료 코드**로 결과를 알립니다.

| 종료 코드 | 동작 |
|-----------|------|
| `0` | 성공. stdout이 Kiro의 대화 맥락에 추가됨 |
| 그 밖 | 실패. **stderr가 Kiro에게 전달**되고, Kiro는 훅이 오류를 냈다는 것을 알게 됨 |

> 💡 **`1>&2`를 붙인 이유**: ESLint는 오류를 stdout으로 출력합니다. stderr로 돌려 두면 **통과했을 때는 아무것도 전달되지 않고**, 실패했을 때만 오류 위치가 Kiro에게 전달됩니다. 문제가 있을 때만 끼어드는 훅이 됩니다.

> 💡 **왜 `agent`가 아니라 `command`인가**: lint는 정해진 명령을 실행하면 끝나는 일입니다. 공식 Best practices도 "결정적인(deterministic) 작업은 shell command로 — 더 빠르고 크레딧을 쓰지 않는다"고 권합니다. 맥락을 보고 판단해야 하는 일(예: "이 변경에 테스트가 필요한지 봐줘")일 때 `agent`를 씁니다.

주요 트리거는 이렇습니다.

| 트리거 | 언제 | 많이 쓰는 예 |
|--------|------|--------------|
| `PostFileSave` / `PostFileCreate` / `PostFileDelete` | Kiro가 파일을 저장·생성·삭제할 때 (`matcher`로 경로 필터) | lint/format, 관련 파일 갱신 |
| `PreToolUse` / `PostToolUse` | Kiro가 도구를 쓰기 전/후 (`matcher`로 도구 필터: `write`, `shell` 등) | 민감 파일 수정 막기, 작업 기록 |
| `Stop` | Kiro가 한 턴의 응답을 마쳤을 때 | 컴파일·보안 점검 (매 턴 실행이라 무거움) |
| `PreTaskExec` / `PostTaskExec` | Spec 작업 시작 전/완료 후 | 작업 완료 후 테스트·타입 체크 |
| `SessionStart` / `UserPromptSubmit` | 세션 시작 / 프롬프트 전송 시 | 맥락 주입, 프롬프트 기록 |

> ⚠️ **Kiro가 저장할 때만 실행됩니다**: 사람이 편집기에서 직접 고치거나 터미널에서 실행한 명령에는 Kiro 훅이 돌지 않습니다.

> 💡 **수동 실행 훅은 없습니다**: 예전 IDE의 버튼(수동) 트리거 훅은 지금은 새로 만들 수 없습니다. 공식 문서는 원할 때 실행하는 작업을 `inclusion: manual` Steering, 즉 **슬래시 명령**으로 만들라고 안내합니다. 4절(선택)에서 만들어 봅니다.

---

## 2. 준비 — 훅 환경에서 npm이 보이는지 확인 (AI 사용 없음)

훅은 터미널과 다른 **비대화형 셸**에서 실행됩니다. Node를 `~/.zshrc`에만 등록했다면 터미널에서는 `npm`이 되는데 훅에서는 `npm: command not found`가 날 수 있습니다. 프로젝트 루트 터미널에서 확인합니다.

```bash
env -i HOME="$HOME" PATH=/usr/bin:/bin /bin/zsh -c 'command -v npm'
```

| 결과 | 할 일 |
|------|-------|
| `/…/bin/npm` 경로가 나옴 | 준비 끝 |
| 아무것도 안 나옴 | 아래처럼 Node 경로를 `~/.zshenv`(모든 zsh가 읽는 파일)에 추가하고 다시 확인 |

```bash
# 터미널에서 실제 npm 위치 확인 → 그 폴더를 ~/.zshenv 에 추가
dirname "$(which npm)"
echo 'export PATH="<위에서 나온 폴더>:$PATH"' >> ~/.zshenv
```

> 💡 nvm·Homebrew 등 Node 설치 방법에 따라 폴더가 다릅니다. 반드시 `which npm`으로 확인한 폴더를 넣으세요. `frontend/`에서 `npm install`을 한 번도 안 했다면 먼저 실행합니다.

---

## 3. 훅 만들고 동작 확인하기 (AI 2~3회)

### 3-1. 훅 만들기 (AI 1회)

IDE 탐색기의 **Agent Hooks** 섹션에서 `+` → **Ask Kiro to create a hook**을 누르거나, 채팅에 그대로 입력합니다.

```text
훅을 하나 만들어줘.
- 이름: Lint on save (frontend), 파일: .kiro/hooks/lint-on-save.json
- 트리거: PostFileSave, matcher: frontend/src/.*\.(ts|tsx)$
- 액션: command, 명령: cd frontend && npm run lint:fix 1>&2, timeout 60
```

**기대 결과**: `.kiro/hooks/lint-on-save.json`이 생기고 내용이 1절의 JSON과 같습니다. Agent Hooks 섹션에 훅이 보입니다.

> ⚠️ 새로 만든 훅은 **다음 세션부터** 적용될 수 있습니다. 채팅 탭에서 **새 세션**을 연 뒤 다음 단계를 진행합니다.

### 3-2. 오류가 있으면 Kiro가 알아차리는지 (AI 1회)

새 세션에서 입력합니다.

```text
실습용이야. frontend/src/components/common/Spinner.tsx 의 Spinner 함수 첫 줄에
const hookTest = 1; 을 추가해줘. 다른 건 고치지 마.
```

**기대 결과**
1. Kiro가 파일을 저장하자마자 훅이 실행됩니다.
2. `hookTest`는 쓰이지 않는 변수라 ESLint가 자동으로 고치지 못하고, 훅이 실패하며 이런 오류가 Kiro에게 전달됩니다.

   ```text
   frontend/src/components/common/Spinner.tsx
     8:9  error  'hookTest' is assigned a value but never used  @typescript-eslint/no-unused-vars
   ✖ 1 problem (1 error, 0 warnings)
   ```

3. Kiro가 이 오류를 언급합니다. "다른 건 고치지 마"라고 했으므로 오류를 보고만 하거나, 변수를 지울지 묻습니다.

> 💡 사람이 `npm run lint`를 따로 돌리지 않아도, **Kiro가 저장한 순간** 문제를 알았습니다. 실제 작업에서는 Kiro가 이 오류를 보고 스스로 고치는 흐름이 됩니다.

### 3-3. 문제가 없으면 조용한지 (AI 1회, 생략 가능)

```text
방금 추가한 const hookTest = 1; 줄을 지워서 원래대로 돌려줘.
```

**기대 결과**: 훅은 실행되지만 lint를 통과하므로 **아무것도 전달되지 않고**, Kiro는 평소처럼 작업만 마칩니다.

**되돌리기 확인**

```bash
git status --short frontend/src   # 아무것도 안 나오면 원래대로 돌아간 것
```

---

## 4. (선택) PR 준비를 슬래시 명령 Steering으로 만들기 (AI 2회)

PR 준비(format → lint → build → PR 본문 작성)는 **원할 때 한 번** 하는 일이라 훅이 아니라 슬래시 명령으로 만듭니다. `inclusion: manual` Steering은 채팅에서 `/<파일 이름>`으로 실행됩니다.

### 4-1. Steering 만들기 (AI 사용 없음)

`.kiro/steering/pr-workflow.md`를 새로 만들고 아래 내용을 붙여 넣습니다.

````markdown
---
inclusion: manual
---

PR 준비를 위한 전체 워크플로를 시작합니다:

## Step 1: 코드 품질 체크 (frontend)
`frontend/` 폴더에서 차례로 실행하세요.
1. `npm run format` 실행
2. `npm run lint:fix` 실행
3. `npm run lint` 실행
4. `npm run build` 실행 : 오류가 발생해도 절대 수정하지 마세요. PR 내용과 별도로 안내하세요.
- 1~2단계에서 파일이 바뀌면 바뀐 파일 목록을 보고하세요.
- 각 명령은 한 번에 하나씩 따로 실행하고, 출력을 숨기지 마세요 (`-s`, `> /dev/null`, `;`나 `&&`로 여러 명령 묶기 금지).
- 명령마다 실행 직후 결과를 한 줄로 알려 주세요. 예: "format은 모든 파일이 unchanged로 깨끗합니다."
- Step 1이 끝나면 "점검 | 결과" 요약 표를 보여 주세요.

## Step 2: PR 템플릿 작성
- `git diff main...HEAD --stat`과 `git log --oneline main..HEAD`로 main 브랜치와 비교해 변경사항 분석
- `.github/pull_request_template.md` 기반으로 PR 내용 작성
- 검증 표에는 Step 1에서 실제로 실행한 결과만 적고, 실패하거나 실행하지 못한 항목은 그대로 적으세요.

## Step 3: 최종 확인
- ```markdown (작성된 PR 내용)``` 형식으로 제공
- 추가로 확인이 필요한 사항 안내
- PR 생성(`git push`, `gh pr create`)은 하지 말고, 제가 요청하면 그때 하세요.

모든 단계를 순차적으로 수행하고 결과를 보고해주세요.
````

> 💡 **각 명령을 따로 실행**하게 한 이유: 명령을 `&&`로 묶거나 출력을 숨기면 진행 상황이 보이지 않습니다. 하나씩 실행하면 채팅에서 단계별 로그와 결과를 바로 확인할 수 있습니다.

> 💡 Step 2는 저장소에 이미 있는 [`.github/pull_request_template.md`](../../.github/pull_request_template.md) 형식을 씁니다. 새로 만들 필요는 없습니다.

### 4-2. 실행하기 (AI 1~2회)

채팅에 입력합니다.

```text
/pr-workflow
```

명령 실행 승인을 물으면 허용합니다.

| 단계 | 하는 일 |
|------|---------|
| Step 1 코드 품질 체크 | `frontend/`에서 `format` → `lint:fix` → `lint` → `build`를 하나씩 실행하고 결과를 한 줄씩 보고, 마지막에 요약 표 |
| Step 2 PR 템플릿 작성 | `main`과 비교해 변경 분석 → `.github/pull_request_template.md` 형식으로 본문 작성 |
| Step 3 최종 확인 | PR 본문을 마크다운 블록으로 제공, 추가 확인 사항 안내 |

**기대 결과**: 명령마다 실행 로그와 한 줄 결과가 보이고, 마지막에 PR 본문이 마크다운 블록으로 나옵니다. **검증 표에는 실제로 실행한 결과만** 적혀 있어야 합니다.

> 💡 지시문에 "오류가 발생해도 절대 수정하지 마세요"와 "PR 생성은 요청하면 그때"가 들어 있어서, `/pr-workflow`는 **보고만** 하고 코드를 바꾸거나 PR을 올리지 않습니다.

> 💡 `format`·`lint:fix`가 파일을 바꾸면 그 변경은 사람이 확인하고 커밋합니다. 실습 후 되돌리려면 `git status`로 바뀐 파일을 확인한 뒤 `git checkout -- <파일>`.

---

## 5. 완료 체크리스트

- [ ] 훅 파일에서 `trigger`, `matcher`, `action`, `timeout`의 뜻을 설명할 수 있다
- [ ] 훅 환경에서 `npm`이 보이는 것을 확인했다
- [ ] Kiro가 쓰이지 않는 변수를 넣었을 때, 훅이 ESLint 오류를 Kiro에게 전달했다
- [ ] 오류가 없을 때는 훅이 아무것도 전달하지 않았다
- [ ] 실습 중 바꾼 코드를 되돌렸다
- [ ] (선택) `/pr-workflow` Steering을 만들고, 단계별 로그와 PR 본문을 받았다

---

## 6. 흔한 에러 & 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 파일을 고쳤는데 훅이 아무 반응 없음 | 훅을 만든 세션에서 바로 시험함 / lint 통과(정상) | 새 세션에서 다시 시험. 일부러 쓰이지 않는 변수를 넣어 확인 |
| 내가 편집기에서 고쳤는데 훅이 안 돎 | 파일 훅은 **Kiro가** 저장할 때만 실행 | Kiro에게 수정을 요청 |
| `npm: command not found` | 훅 환경 PATH에 Node 경로가 없음 | 2절 확인 명령 → `~/.zshenv`에 `which npm` 폴더 추가 |
| `eslint: command not found` / 모듈 없음 | `frontend/`에서 `npm install`을 안 함 | `cd frontend && npm install` |
| 다른 폴더 파일에도 훅이 돎 / 아예 안 돎 | `matcher` 정규식이 다름 | 1절 JSON의 `matcher`와 같은지 확인 (JSON 파일에서는 `.` 앞의 역슬래시를 두 번 씀) |
| 훅을 고친 뒤 Agent Hooks에서 사라짐 | JSON 문법이 깨짐 | 1절 JSON과 비교해 쉼표·따옴표 확인 |
| 훅이 오래 걸려 끊김 | `timeout`(60초) 초과 | `timeout` 값을 늘리거나, 검사 범위를 줄임 |
| (선택) `/pr-workflow`가 목록에 없음 | 파일 위치·이름이나 front-matter(`inclusion: manual`)가 다름 | `.kiro/steering/pr-workflow.md`와 첫 3줄 확인 |

---

## 7. 돌아보기

- **Hook = 항상 자동으로**, **슬래시 명령(manual Steering) = 원할 때 한 번**. 같은 lint라도 "Kiro가 고칠 때마다"는 훅, "PR 올리기 전 전체 점검"은 `/pr-workflow`입니다.
- 정해진 명령은 `command` 액션으로 — 빠르고, 결과가 매번 같고, 크레딧이 들지 않습니다. 판단이 필요할 때만 `agent` 액션을 씁니다.
- 다른 프로젝트에서는 `matcher`(대상 경로)와 `command`(lint 명령)만 바꾸면 그대로 쓸 수 있습니다.
- 다음(⑥)에서는 이 모든 것을 **내 프로젝트에 이식**하는 방법과, 많이 쓰는 다른 훅 사례를 정리합니다.

---

이전 실습 ← [실습 ④ Skills](./04-skills.md) · 다음 실습 → [실습 ⑥ 실무 적용 가이드 및 FAQ](./06-실무적용-faq.md)
