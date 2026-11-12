---
inclusion: manual
---

PR 준비를 위한 전체 워크플로를 시작합니다:

## Step 1: 코드 품질 체크
1. 포맷: 이 프로젝트에는 포매터가 없으니 건너뛰고 "해당 없음"으로 보고하세요.
2. 코드 컨벤션 점검: `git diff main...HEAD --name-only -- src/main`으로 바뀐 파일을 찾고, 그 파일만 `.kiro/steering/code-conventions.md`의 C1~C10 기준으로 점검해 위반을 `규칙 번호 | 파일:라인`으로 정리
3. `./mvnw -q compile` 실행
4. `cd frontend && npm run build` 실행
- 오류가 발생해도 절대 코드를 수정하지 마세요. PR 내용과 별도로 안내하세요.

## Step 2: PR 템플릿 작성
- `git diff main...HEAD --stat`과 `git log --oneline main..HEAD`로 main 브랜치와 비교해 변경사항 분석
- `.github/pull_request_template.md` 기반으로 PR 내용 작성
- 검증 표에는 Step 1에서 실제로 실행한 결과만 적고, 실패하거나 실행하지 못한 항목은 그대로 적으세요.

## Step 3: 최종 확인
- ```markdown (작성된 PR 내용)``` 형식으로 제공
- 추가로 확인이 필요한 사항 안내
- PR 생성(`git push`, `gh pr create`)은 하지 말고, 제가 요청하면 그때 하세요.

모든 단계를 순차적으로 수행하고 결과를 보고해주세요.
