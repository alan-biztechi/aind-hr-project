# Design Document

## Overview

AIND HR 백엔드를 소비하는 React 관리자 SPA입니다. Vite + React + TypeScript로 구성하고,
React Router로 도메인별 페이지를 분리합니다. 데이터 패칭/캐싱/로딩·에러 상태 관리는
TanStack Query(React Query)로 통일하여 Requirement 7(공통 로딩/에러/재시도)을 일관되게 충족합니다.

프론트엔드는 백엔드와 분리된 `frontend/` 디렉터리에 두며, 백엔드 API만을 데이터 소스로 사용합니다.
로컬 개발에서는 Vite dev 서버 프록시로 `/v1/*` 요청을 `http://localhost:8080`으로 전달하여 CORS 이슈를 회피합니다.

## Architecture

### 기술 스택

아래 버전은 npm 공식 레지스트리(registry.npmjs.org)의 `latest` 태그를 2026-10-23 기준으로 확인한 값이다.
`package.json`에는 캐럿(`^`) 범위로 고정하여 호환 가능한 패치/마이너 업데이트를 허용한다.

| 영역 | 패키지 | 고정 버전 | 이유 / 비고 |
|------|--------|-----------|-------------|
| 빌드 | vite | `^8.3.5` | Rolldown 기반 최신. **Node `^20.19 \|\| >=22.12` 필요** (Req 8.1) |
| 빌드 | @vitejs/plugin-react | `^6.1.2` | vite `^8` 대응 공식 React 플러그인 |
| 런타임 | react / react-dom | `^19.3.1` | React 19 |
| 언어 | typescript | `~5.9.3` | **주의: `latest`는 7.0.x(네이티브 포팅)이나 생태계 호환이 미성숙하여 검증된 안정 5.9.3 사용** (Req 8.2) |
| 라우팅 | react-router-dom | `^7.18.4` | v7. Node >=20. (Req 8.3) |
| 서버 상태 | @tanstack/react-query | `^5.104.5` | v5. 로딩/에러/캐시/재시도 일원화 (Req 7.2, 7.3) |
| HTTP | axios | `^1.20.0` | 인터셉터로 베이스 URL·에러 정규화 (Req 7.1, 7.4) |
| 폼 | react-hook-form | `^7.90.0` | 선언적 검증 (Req 2.5, 3.5, 5.5) |
| 타입 | @types/react / @types/react-dom | `^19.x` (latest) | React 19 타입 |
| 스타일 | CSS Modules (+ 소량의 전역 CSS) | — | 의존성 최소화, 컴포넌트 단위 스타일 |

> **TypeScript 버전 주의**: npm `latest`는 네이티브 컴파일러로 포팅된 TypeScript 7 라인을 가리킨다.
> 아직 ESLint 플러그인·일부 번들러 타입 등 생태계 호환이 성숙하지 않아, 이 실습 프로젝트는 안정적인 5.9 계열을 사용한다.
> (react-hook-form·tanstack 등 주요 의존성도 devDeps에서 TS 5~6을 사용 중)
>
> **Node 버전 주의**: Vite 8 / plugin-react 6 / react-router 7은 모두 Node 20.19+ (또는 22.12+)를 요구한다.
> 실행 환경의 Node 버전을 먼저 확인할 것.
>
> 스타일링은 무거운 UI 프레임워크 없이 가벼운 CSS로 시작한다. 필요 시 추후 교체 가능하도록 컴포넌트 단위로 분리한다.

### 레이어 구성

```
라우트(pages) → 도메인 훅(hooks: useQuery/useMutation) → api 모듈(axios) → 백엔드
                           ↑
                    공통 컴포넌트(components) / 타입(types)
```

- **api 모듈**: 도메인별 함수. URL·요청/응답 타입만 담당. 비즈니스 로직 없음.
- **hooks**: TanStack Query 래퍼. query key, 무효화(invalidation), 로딩/에러 노출.
- **pages**: 라우트 단위 화면. 훅을 소비하고 컴포넌트를 조립.
- **components**: 재사용 UI(테이블, 모달, 뱃지, 폼 필드, 로딩/에러 표시).

### 폴더 구조

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts            # /v1 프록시 → http://localhost:8080
├── .env.example              # VITE_API_BASE_URL
└── src/
    ├── main.tsx              # QueryClientProvider + RouterProvider
    ├── App.tsx               # 레이아웃 + 라우트 정의
    ├── api/
    │   ├── client.ts         # axios 인스턴스 + 에러 정규화 인터셉터
    │   ├── departments.ts
    │   ├── employees.ts
    │   ├── attendances.ts
    │   └── leaves.ts
    ├── hooks/
    │   ├── useDepartments.ts
    │   ├── useEmployees.ts
    │   ├── useAttendances.ts
    │   └── useLeaves.ts
    ├── types/
    │   └── api.ts            # 백엔드 DTO 대응 타입
    ├── components/
    │   ├── layout/           # Sidebar, AppLayout
    │   ├── common/           # DataTable, Modal, StatusBadge, Spinner, ErrorState, ConfirmDialog
    │   └── forms/            # DepartmentForm, EmployeeForm, CheckInForm, LeaveForm
    └── pages/
        ├── DashboardPage.tsx
        ├── DepartmentsPage.tsx
        ├── EmployeesPage.tsx
        ├── AttendancesPage.tsx
        ├── LeavesPage.tsx
        └── NotFoundPage.tsx
```

### 라우팅 (Req 1)

| 경로 | 페이지 |
|------|--------|
| `/` | DashboardPage |
| `/departments` | DepartmentsPage |
| `/employees` | EmployeesPage |
| `/attendances` | AttendancesPage |
| `/leaves` | LeavesPage |
| `*` | NotFoundPage (404) |

`AppLayout`이 사이드바 + `<Outlet/>`을 렌더링하고, `NavLink`의 활성 상태로 현재 메뉴를 강조합니다(Req 1.3).

## Components and Interfaces

### API 타입 (types/api.ts) — 백엔드 DTO 대응

백엔드 응답 필드를 그대로 매핑합니다. 날짜/시간은 문자열(ISO)로 수신합니다.

```typescript
// 공통 응답
export type SuccessFlag = "SUCCESS" | "FAIL";
export interface ResultResponse { success: SuccessFlag; message: string; }
export interface UpdateResponse extends ResultResponse { id: number; }

// 부서 (Department entity)
export interface Department {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface DepartmentCreateRequest { name: string; description?: string; }
export interface DepartmentUpdateRequest { id: number; name: string; description?: string; }

// 직원 (EmployeeResponse — 부서명 포함)
export type EmployeeStatus = "ACTIVE" | "RESIGNED";
export interface EmployeeResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  departmentId: number;
  departmentName: string;
  position: string;
  hireDate: string;       // yyyy-MM-dd
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}
export interface EmployeeCreateRequest {
  name: string; email: string; phone?: string;
  departmentId: number; position: string; hireDate: string;
}
export interface EmployeeUpdateRequest extends EmployeeCreateRequest {
  id: number; status: EmployeeStatus;
}

// 출퇴근 (AttendanceResponse — 직원/부서명 포함)
export type AttendanceStatus = "NORMAL" | "LATE" | "EARLY_LEAVE" | "ABSENT";
export interface AttendanceResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  workDate: string;       // yyyy-MM-dd
  checkIn: string | null; // HH:mm:ss
  checkOut: string | null;
  status: AttendanceStatus;
  note: string | null;
  createdAt: string;
}
export interface AttendanceCheckInRequest {
  employeeId: number; workDate: string; checkIn: string; // HH:mm
}

// 휴가 (LeaveRequest entity)
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveType = "연차" | "반차" | "병가" | "경조사";
export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;      // yyyy-MM-dd
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  approverId: number | null;
  requestDate: string;    // 주의: 백엔드가 created_at을 requestDate로 노출
  updatedAt: string;
}
export interface LeaveRequestCreateRequest {
  employeeId: number; leaveType: string;
  startDate: string; endDate: string; reason?: string;
}
```

> 주의: `LeaveRequest`는 직원명을 포함하지 않으므로(엔티티 직접 반환), 휴가 목록에서 직원명이 필요하면
> 직원 목록을 조회해 `employeeId`로 조인하여 표시한다.

### API 모듈 인터페이스 (api/*.ts)

```typescript
// departments.ts
getDepartments(): Promise<Department[]>                       // GET /v1/departments
getDepartment(id): Promise<Department>                        // GET /v1/departments/{id}
createDepartment(body: DepartmentCreateRequest): Promise<UpdateResponse>  // POST
updateDepartment(body: DepartmentUpdateRequest): Promise<UpdateResponse>  // PUT
deleteDepartment(id): Promise<UpdateResponse>                 // DELETE /v1/departments/{id}

// employees.ts
getEmployees(): Promise<EmployeeResponse[]>                   // GET /v1/employees
getEmployee(id): Promise<EmployeeResponse>                    // GET /v1/employees/{id}
getEmployeesByDepartment(deptId): Promise<EmployeeResponse[]> // GET /v1/employees/department/{id}
createEmployee(body): Promise<UpdateResponse>                 // POST
updateEmployee(body): Promise<UpdateResponse>                 // PUT
deleteEmployee(id): Promise<UpdateResponse>                   // DELETE

// attendances.ts
getAttendances(): Promise<AttendanceResponse[]>               // GET /v1/attendances
getAttendancesByDate(workDate): Promise<AttendanceResponse[]> // GET /v1/attendances/date/{date}
checkIn(body: AttendanceCheckInRequest): Promise<UpdateResponse>  // POST /check-in
checkOut(id, checkOut: string): Promise<UpdateResponse>       // PATCH /{id}/check-out?checkOut=HH:mm

// leaves.ts
getLeaves(): Promise<LeaveRequest[]>                          // GET /v1/leaves
getLeavesByEmployee(empId): Promise<LeaveRequest[]>           // GET /v1/leaves/employee/{id}
createLeave(body): Promise<UpdateResponse>                    // POST /v1/leaves
```

### axios client (api/client.ts) — Req 7.1, 7.4

- `baseURL = import.meta.env.VITE_API_BASE_URL ?? ""` (빈 값이면 Vite 프록시의 상대경로 `/v1` 사용)
- 응답 인터셉터: HTTP 에러 시 백엔드 `{ success, message }`의 `message`를 추출해 `Error(message)`로 정규화.
- 메시지가 없으면 기본 문구("요청 처리 중 오류가 발생했습니다.") 사용.

### 공통 컴포넌트 (components/common)

- **DataTable**: 컬럼 정의 + 행 데이터 + (선택) 행 클릭 핸들러. 빈 상태 렌더링 포함.
- **StatusBadge**: `kind`(attendance/leave/employee)와 `value`를 받아 색상 매핑된 뱃지 출력 (Req 4.5, 5.6).
- **Spinner / ErrorState**: 로딩·에러 공통 표시. ErrorState는 재시도 콜백 버튼 포함 (Req 7.2, 7.3).
- **Modal / ConfirmDialog**: 폼 모달과 삭제 확인(Req 2.6, 3.7).

### 상태/색상 매핑

| 도메인 | 값 | 표시 |
|--------|-----|------|
| 출퇴근 | NORMAL / LATE / EARLY_LEAVE / ABSENT | 초록 / 주황 / 노랑 / 회색 |
| 휴가 | PENDING / APPROVED / REJECTED | 파랑 / 초록 / 빨강 |
| 직원 | ACTIVE / RESIGNED | 초록 / 회색 |

### 페이지 설계 요약

- **DashboardPage (Req 6)**: 4개 쿼리 병렬 — 부서 수, 직원 수, 오늘(`new Date` → yyyy-MM-dd) 출퇴근 수, PENDING 휴가 수. 각 카드 클릭 시 해당 라우트로 이동.
- **DepartmentsPage (Req 2)**: 테이블 + 등록/수정 모달 + 삭제 확인.
- **EmployeesPage (Req 3)**: 부서 필터 드롭다운 + 테이블 + 등록/수정 모달(부서 드롭다운은 부서 쿼리로 채움) + 상세 보기 + 삭제 확인.
- **AttendancesPage (Req 4)**: 날짜 선택(기본 전체) + 테이블 + 출근 등록 폼 + 행별 퇴근 등록(checkOut 미기입 행만).
- **LeavesPage (Req 5)**: 직원 필터 + 테이블(직원명은 직원 쿼리로 조인) + 휴가 신청 폼(유형 셀렉트, 날짜 검증).

## Data Models

프론트엔드는 자체 영속 데이터를 두지 않는다. 모든 상태는 TanStack Query 캐시에 보관하며,
query key는 다음 규칙을 따른다.

| key | 설명 | 무효화 트리거 |
|-----|------|----------------|
| `["departments"]` | 부서 목록 | 부서 생성/수정/삭제 |
| `["employees"]` / `["employees", {deptId}]` | 직원 목록/부서필터 | 직원 생성/수정/삭제 |
| `["attendances"]` / `["attendances", {date}]` | 출퇴근 목록/날짜 | 출근/퇴근 등록 |
| `["leaves"]` / `["leaves", {empId}]` | 휴가 목록/직원 | 휴가 신청 |

뮤테이션 성공 시 관련 key를 `invalidateQueries`로 갱신한다(Req 2.2~2.4, 3.4~3.7, 4.3~4.4, 5.3).

## Error Handling

- **네트워크/HTTP 오류**: axios 인터셉터가 메시지 정규화 → 쿼리/뮤테이션의 `error`로 전파 → 페이지가 `ErrorState`(재시도 버튼) 표시.
- **검증 오류**: react-hook-form이 제출 전 차단하고 필드 하단에 메시지 표시(이름 필수, 이메일 형식, 종료일≥시작일 등).
- **뮤테이션 실패**: 모달 내 인라인 오류 메시지로 표시하고 폼 입력 유지.
- **빈 데이터**: DataTable이 "데이터가 없습니다" 빈 상태를 렌더링.

## Testing Strategy

> 이 저장소는 실습용이며, 자동 테스트는 요구사항에 포함되지 않았다. 아래는 선택적 권장 사항이다.

- 수동 검증: 백엔드를 `./mvnw spring-boot:run`으로 띄우고 각 페이지의 CRUD 플로우를 확인.
- (선택) Vitest + React Testing Library로 api 모듈의 요청 URL/본문 형성, StatusBadge 매핑, 폼 검증 단위 테스트.
- (선택) 타입 체크(`tsc --noEmit`)와 `vite build`를 CI 게이트로 사용.

## 미결 사항 / 가정

- 백엔드 CORS 설정이 없을 수 있으므로 **개발 환경은 Vite 프록시**를 기본으로 한다. 프로덕션 배포 시에는 `VITE_API_BASE_URL`로 실제 호스트를 지정한다.
- 인증/권한은 현재 백엔드에 없으므로 프론트엔드도 로그인 없이 동작한다(실습 범위).
- 휴가 승인/반려 API가 백엔드에 없으므로, 휴가 화면은 **조회 + 신청**까지만 제공한다(상태 변경 UI 없음).
- 퇴근 등록은 `checkOut`을 쿼리 파라미터로 전달하는 백엔드 계약을 그대로 따른다.
