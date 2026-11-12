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
5. `git diff main...HEAD --name-only -- frontend/src`로 바뀐 파일을 찾고, 그 파일만 `.kiro/steering/frontend-conventions.md`의 모든 규칙 기준으로 점검해 위반을 `규칙 번호 | 파일:라인`으로 정리하세요.
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
