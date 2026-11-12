---
inclusion: fileMatch
fileMatchPattern: 'frontend/src/**'
---

# Frontend Code Conventions

`frontend/src/` 아래 React + TypeScript 코드를 작성·수정할 때 따르는 규칙입니다. 아래 규칙은 현재 코드 전체가 예외 없이 지키고 있습니다.
코드를 점검할 때는 이 표의 규칙 번호(F1, F2, …)로 위반을 보고합니다.
포맷과 기본 문법 오류는 `npm run format`, `npm run lint`가 맡고, 이 문서는 도구가 잡지 못하는 **프로젝트 구조 규칙**을 다룹니다.

| # | 규칙 |
|---|------|
| F1 | HTTP 요청은 `src/api/client.ts`의 `apiClient`로만 보낸다. `axios`는 `client.ts`에서만 import한다 |
| F2 | 페이지·컴포넌트(`pages/`, `components/`)는 `src/api/`를 직접 import하지 않고, `src/hooks/`의 훅을 쓴다 |
| F3 | 서버 상태(`useQuery`, `useMutation`)는 `src/hooks/*.ts`에서만 쓴다 |
| F4 | 모듈 import는 `@/` 별칭을 쓴다. `../` 상대 경로 금지 |
| F5 | 컴포넌트는 `export function 이름()` 형태의 named export로 만든다. `export default` 금지 |
| F6 | `console.*` 금지 (`console.log`, `console.error` 등) |
| F7 | `any` 타입 금지 (`: any`, `as any`) |

## 작성 시 참고
- 새 화면은 같은 폴더의 기존 파일(예: `pages/EmployeesPage.tsx`, `hooks/useEmployees.ts`)을 본보기로 삼는다.
- 백엔드 요청·응답 타입은 `src/types/api.ts`에 둔다.
