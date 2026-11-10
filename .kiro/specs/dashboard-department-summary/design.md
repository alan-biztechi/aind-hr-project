# Design Document

## Overview

대시보드(`DashboardPage`) 상단에 **부서별 직원 수 요약 카드**를 추가합니다.
신규 API나 라이브러리 없이, 기존 `useEmployees()` 훅이 가져오는 `EmployeeResponse[]`를 프론트에서 `departmentName` 기준으로 집계해 표시합니다.
백엔드는 변경하지 않습니다 (Req 3.4).

핵심 설계 결정은 세 가지입니다.

1. **집계는 순수 함수로 분리**한다. UI와 분리되어 입력/출력이 명확하고, 나중에 테스트 러너를 도입하면 바로 테스트할 수 있다.
2. **요약 컴포넌트가 `useEmployees()`를 직접 호출**한다. 대시보드 페이지가 이미 같은 query key(`["employees"]`)로 호출하므로 TanStack Query가 요청을 중복 제거하여 추가 네트워크 요청이 생기지 않는다 (Introduction).
3. **로딩/오류/빈 상태를 요약 영역 안에서 처리**한다. 요약이 실패해도 기존 지표 카드 4종은 영향을 받지 않는다 (Req 2.2, 3.1).

## Architecture

### 기술 스택

신규 의존성은 없습니다. 기존 스택을 그대로 사용합니다.

| 영역 | 사용 대상 | 비고 |
|------|-----------|------|
| 서버 상태 | `@tanstack/react-query` `useEmployees()` | 기존 훅 재사용, key `["employees"]` |
| 타입 | `types/api.ts`의 `EmployeeResponse` | `departmentName: string` 사용 (Req 3.2) |
| 공통 UI | `Spinner`, `ErrorState` (`components/common`) | 로딩/오류 표시 재사용 |
| 스타일 | CSS Modules | `DashboardPage.module.css`의 CSS 변수(`--color-*`)와 동일한 톤 |

### 데이터 흐름

```
DashboardPage
 └─ DepartmentSummary ── useEmployees() ──(캐시 공유)──> GET /v1/employees
        │
        └─ summarizeByDepartment(employees) → DepartmentCount[]
                                               └─ 카드 목록 렌더링
```

### 폴더 구조 (추가/변경 파일)

```
frontend/src/
├── components/
│   └── dashboard/                       # 신규 (대시보드 전용 컴포넌트)
│       ├── DepartmentSummary.tsx        # 신규: 요약 영역 (로딩/오류/빈 상태/카드)
│       ├── DepartmentSummary.module.css # 신규
│       └── summarizeByDepartment.ts     # 신규: 순수 집계 함수
└── pages/
    └── DashboardPage.tsx                # 변경: <DepartmentSummary /> 삽입
```

> `components/` 아래는 현재 `common`, `forms`, `layout`으로 나뉘어 있고 대시보드 전용 컴포넌트를 둘 곳이 없다. 기존 구분 방식(역할/영역별 폴더)을 따라 `dashboard/` 폴더를 추가한다.

## Components and Interfaces

### 집계 함수 — `summarizeByDepartment.ts` (Req 1.1, 1.3, 3.2)

```typescript
import type { EmployeeResponse } from "@/types/api";

export interface DepartmentCount {
  departmentName: string;
  count: number;
}

export function summarizeByDepartment(
  employees: EmployeeResponse[],
): DepartmentCount[];
```

동작 규칙:

- `departmentName`이 같은 직원을 하나로 합산한다 (미결 사항 #4).
- 퇴사(`RESIGNED`) 직원도 포함한다. 상태로 필터링하지 않는다 (미결 사항 #1).
- 직원이 0명인 부서는 입력에 나타나지 않으므로 결과에도 없다 (미결 사항 #2).
- 정렬: `count` 내림차순, 같으면 `departmentName` 오름차순 (`localeCompare(b, "ko")`) (Req 1.3).
- 입력 배열을 변경하지 않는다 (순수 함수).

### 요약 컴포넌트 — `DepartmentSummary.tsx` (Req 1, 2)

```typescript
export function DepartmentSummary(): JSX.Element;
```

Props는 없다. 내부에서 `useEmployees()`를 호출한다.

상태별 렌더링 (Req 2):

| 조건 | 표시 |
|------|------|
| `isLoading` | `<Spinner label="부서별 인원을 불러오는 중..." />` (Req 2.1) |
| `isError` | `<ErrorState error={error} onRetry={refetch} />` (Req 2.2) |
| 성공 + 집계 결과 0건 | "표시할 부서별 인원이 없습니다." 안내 (Req 2.3) |
| 성공 + 1건 이상 | 부서별 카드 목록 (Req 1.1, 1.2) |

구현 메모:

- 집계는 `useMemo(() => summarizeByDepartment(data ?? []), [data])`로 계산한다. 직원 쿼리가 무효화되어 `data`가 바뀌면 자동으로 재계산된다 (Req 1.4).
- 영역에 제목 "부서별 인원"을 두고 `<section aria-labelledby=...>`로 감싼다.
- 카드는 클릭 동작이 없으므로 `button`이 아닌 `ul > li`로 렌더링한다 (범위 밖: 부서별 필터 이동). 각 카드는 부서명(작은 글씨)과 인원 수(큰 숫자)를 보여준다 (Req 1.2).
- 카드의 `key`는 `departmentName`을 쓴다 (집계 결과에서 이름은 유일하다).

### 대시보드 페이지 — `DashboardPage.tsx` 변경 (Req 1.1, 3.1)

- `PageHeader` 아래, 기존 지표 카드 그리드(`styles.grid`) **위**에 `<DepartmentSummary />`를 삽입한다.
- 기존 4개 카드(부서/직원/오늘 출근/대기 휴가)의 코드와 동작은 변경하지 않는다.

### 스타일 — `DepartmentSummary.module.css`

- 컨테이너는 `display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`로 반응형 줄바꿈 (미결 사항 #3).
- 카드 외형은 `DashboardPage.module.css`의 `.card`와 같은 CSS 변수(`--color-surface`, `--color-border`, `--color-text-muted`, `--color-primary`)를 사용해 일관된 톤을 유지한다.
- 클릭 대상이 아니므로 `cursor: pointer`, hover 효과는 넣지 않는다.
- 요약 영역과 기존 지표 그리드 사이에 여백을 둔다.

## Data Models

신규 영속 데이터나 서버 타입은 없다.

- 입력: `EmployeeResponse[]` (기존 타입 그대로).
- 파생 데이터: `DepartmentCount { departmentName: string; count: number }` — 컴포넌트 내부에서만 쓰이는 표시용 타입이며 `summarizeByDepartment.ts`에 정의한다. `types/api.ts`는 백엔드 DTO 대응용이므로 여기에 넣지 않는다.
- 상태 저장: 별도 상태 없음. TanStack Query 캐시(`["employees"]`)에서 파생 계산한다.

## Error Handling

- **조회 실패**: `useEmployees()`의 `isError`를 요약 영역에서만 처리한다. `ErrorState`가 메시지와 "다시 시도" 버튼을 제공하며, 버튼은 `refetch`를 호출한다 (Req 2.2). 기존 axios 인터셉터가 `{ success, message }`를 `Error(message)`로 정규화하므로 그 메시지가 그대로 표시된다.
- **영향 격리**: 기존 지표 카드는 요약 컴포넌트의 상태와 무관하게 렌더링된다 (Req 2.2, 3.1).
- **빈 데이터**: 오류가 아니라 정상 응답이므로 빈 상태 안내를 표시한다 (Req 2.3).
- **예외 입력**: 집계 함수는 빈 배열을 받으면 빈 배열을 반환한다. `departmentName`은 타입상 `string`이므로 별도 null 처리는 하지 않는다.

## Testing Strategy

> 이 저장소의 프론트엔드에는 테스트 러너가 없고, 자동 테스트는 요구사항에 포함되지 않았다. 아래는 현재 환경에서 실행 가능한 검증 방법이다.

- **정적 검증 (필수)**: `npm run typecheck`, `npm run build` 통과 (Req 3.3).
- **변경 범위 검증 (필수)**: `git status`로 백엔드(`src/`, `pom.xml`) 파일이 변경되지 않았음을 확인 (Req 3.4).
- **수동 검증 (백엔드 기동 필요)**: `npm run dev` 후 대시보드에서 아래를 확인한다.
  - 부서별 카드와 인원 수가 표시되고 정렬 규칙이 맞다 (Req 1.1~1.3).
  - 직원 페이지에서 직원을 등록/삭제한 뒤 대시보드로 돌아오면 수치가 갱신된다 (Req 1.4).
  - 백엔드를 중지하면 요약 영역에만 오류와 "다시 시도"가 보이고 기존 카드는 그대로다 (Req 2.2, 3.1).
- **(선택) 단위 테스트**: Vitest 등을 도입하면 `summarizeByDepartment`를 우선 대상으로 한다. 러너 도입은 별도 승인이 필요하다.

## 미결 사항 / 가정

- `requirements.md`의 기본 가정을 그대로 따른다: 퇴사자 포함, 0명 부서 숨김, 동명 부서 합산, 부서 전부 표시.
- 백엔드를 띄운 상태의 화면 동작은 구현 단계에서 사용자가 `npm run dev`로 직접 확인해야 한다 (개발 서버는 자동화 환경에서 실행하지 않는다).
- 대시보드 날짜 처리처럼 기존 코드의 별개 이슈(`toISOString()`은 UTC 기준이라 한국 시간대에서 하루 어긋날 수 있음)는 이 Spec의 범위 밖이며 수정하지 않는다.
