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
- 백엔드(`src/main`)에도 변경이 있으면 `./mvnw -q compile`을 실행하고, 바뀐 파일을 `.kiro/steering/code-conventions.md` 기준으로 점검해 함께 보고하세요.

## Step 2: PR 템플릿 작성
- `git diff main...HEAD --stat`과 `git log --oneline main..HEAD`로 main 브랜치와 비교해 변경사항 분석
- `.github/pull_request_template.md` 기반으로 PR 내용 작성
- 검증 표에는 Step 1에서 실제로 실행한 결과만 적고, 실패하거나 실행하지 못한 항목은 그대로 적으세요.

## Step 3: 최종 확인
- ```markdown (작성된 PR 내용)``` 형식으로 제공
- 추가로 확인이 필요한 사항 안내
- PR 생성(`git push`, `gh pr create`)은 하지 말고, 제가 요청하면 그때 하세요.

모든 단계를 순차적으로 수행하고 결과를 보고해주세요.
