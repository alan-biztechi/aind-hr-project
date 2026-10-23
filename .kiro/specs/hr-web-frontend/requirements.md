# Requirements Document

## Introduction

AIND HR 백엔드(Spring Boot, `/v1/*` REST API)를 사용하는 React 기반 관리자 웹 프론트엔드입니다.
인사/근태 관리 담당자가 부서, 직원, 출퇴근, 휴가 신청을 브라우저에서 조회하고 관리할 수 있는
싱글 페이지 애플리케이션(SPA)을 제공합니다.

기존 백엔드 API는 다음 4개 도메인으로 구성됩니다.

- 부서 `/v1/departments` — 목록/상세/등록/수정/삭제
- 직원 `/v1/employees` — 목록/상세/부서별/등록/수정/삭제 (부서명 포함)
- 출퇴근 `/v1/attendances` — 전체/날짜별/직원별 조회, 출근 등록, 퇴근 등록
- 휴가 `/v1/leaves` — 목록/상세/직원별 조회, 휴가 신청

프론트엔드는 이 API만을 데이터 소스로 사용하며, 응답 필드와 검증 규칙은 백엔드 계약을 그대로 따릅니다.

## Requirements

### Requirement 1 — 애플리케이션 셸 및 네비게이션

**User Story:** HR 담당자로서, 하나의 화면에서 4개 도메인을 빠르게 오갈 수 있도록 공통 레이아웃과 네비게이션을 원한다.

#### Acceptance Criteria

1. WHEN 사용자가 앱에 접속하면 THEN 시스템은 사이드바(또는 상단바) 네비게이션과 함께 대시보드/부서/직원/출퇴근/휴가 메뉴를 표시해야 한다.
2. WHEN 사용자가 네비게이션 항목을 클릭하면 THEN 시스템은 전체 페이지 새로고침 없이 해당 라우트로 전환해야 한다.
3. WHEN 현재 라우트가 특정 메뉴에 해당하면 THEN 시스템은 해당 메뉴를 활성 상태로 시각적으로 표시해야 한다.
4. WHEN 존재하지 않는 경로로 접근하면 THEN 시스템은 404 안내 화면을 표시해야 한다.

### Requirement 2 — 부서 관리

**User Story:** HR 담당자로서, 부서를 조회하고 등록/수정/삭제할 수 있기를 원한다.

#### Acceptance Criteria

1. WHEN 부서 페이지에 진입하면 THEN 시스템은 `GET /v1/departments`로 전체 부서 목록(이름, 설명)을 테이블로 표시해야 한다.
2. WHEN 사용자가 "부서 등록"을 제출하면 THEN 시스템은 `POST /v1/departments`를 호출하고 성공 시 목록을 갱신해야 한다.
3. WHEN 사용자가 기존 부서를 수정하면 THEN 시스템은 `PUT /v1/departments`를 호출하고 성공 시 목록을 갱신해야 한다.
4. WHEN 사용자가 부서 삭제를 확인하면 THEN 시스템은 `DELETE /v1/departments/{id}`를 호출하고 성공 시 목록에서 제거해야 한다.
5. IF 이름이 비어 있으면 THEN 시스템은 제출을 막고 검증 메시지를 표시해야 한다.
6. WHEN 삭제 버튼을 누르면 THEN 시스템은 실행 전 확인 절차(모달 또는 확인 창)를 거쳐야 한다.

### Requirement 3 — 직원 관리

**User Story:** HR 담당자로서, 직원을 부서 정보와 함께 조회하고 등록/수정/삭제할 수 있기를 원한다.

#### Acceptance Criteria

1. WHEN 직원 페이지에 진입하면 THEN 시스템은 `GET /v1/employees`로 직원 목록을 부서명과 함께 표시해야 한다.
2. WHEN 사용자가 부서 필터를 선택하면 THEN 시스템은 `GET /v1/employees/department/{departmentId}` 결과로 목록을 좁혀 표시해야 한다.
3. WHEN 사용자가 직원 행을 선택하면 THEN 시스템은 `GET /v1/employees/{id}` 상세 정보를 표시해야 한다.
4. WHEN 사용자가 "직원 등록"을 제출하면 THEN 시스템은 `POST /v1/employees`를 호출해야 하며, 이름/이메일/부서/직급/입사일은 필수이다.
5. IF 이메일 형식이 올바르지 않으면 THEN 시스템은 제출을 막고 검증 메시지를 표시해야 한다.
6. WHEN 사용자가 직원을 수정하면 THEN 시스템은 `PUT /v1/employees`를 호출하고 상태(ACTIVE/RESIGNED)를 선택할 수 있어야 한다.
7. WHEN 사용자가 직원 삭제를 확인하면 THEN 시스템은 `DELETE /v1/employees/{id}`를 호출해야 한다.
8. WHEN 직원 등록/수정 폼에서 부서를 선택할 때 THEN 시스템은 `GET /v1/departments` 결과로 부서 드롭다운을 채워야 한다.

### Requirement 4 — 출퇴근 관리

**User Story:** HR 담당자로서, 출퇴근 기록을 조회하고 출근/퇴근을 등록할 수 있기를 원한다.

#### Acceptance Criteria

1. WHEN 출퇴근 페이지에 진입하면 THEN 시스템은 `GET /v1/attendances`로 전체 기록을 직원명/부서명과 함께 표시해야 한다.
2. WHEN 사용자가 날짜를 선택하면 THEN 시스템은 `GET /v1/attendances/date/{workDate}`로 해당 날짜 기록을 표시해야 한다.
3. WHEN 사용자가 "출근 등록"을 제출하면 THEN 시스템은 `POST /v1/attendances/check-in`을 호출해야 하며 직원/근무일/출근시각은 필수이다.
4. WHEN 사용자가 특정 기록에 대해 "퇴근 등록"을 제출하면 THEN 시스템은 `PATCH /v1/attendances/{id}/check-out?checkOut=HH:mm` 형식으로 호출해야 한다.
5. WHEN 상태 값(NORMAL/LATE/EARLY_LEAVE/ABSENT)을 표시할 때 THEN 시스템은 상태별로 구분되는 뱃지로 표현해야 한다.

### Requirement 5 — 휴가 신청 관리

**User Story:** HR 담당자로서, 휴가 신청을 조회하고 새 휴가를 신청할 수 있기를 원한다.

#### Acceptance Criteria

1. WHEN 휴가 페이지에 진입하면 THEN 시스템은 `GET /v1/leaves`로 휴가 신청 목록을 표시해야 한다.
2. WHEN 사용자가 직원별 필터를 적용하면 THEN 시스템은 `GET /v1/leaves/employee/{employeeId}` 결과를 표시해야 한다.
3. WHEN 사용자가 "휴가 신청"을 제출하면 THEN 시스템은 `POST /v1/leaves`를 호출해야 하며 직원/휴가유형/시작일/종료일은 필수이다.
4. WHEN 휴가 유형을 입력할 때 THEN 시스템은 연차/반차/병가/경조사 중에서 선택하도록 해야 한다.
5. IF 종료일이 시작일보다 앞서면 THEN 시스템은 제출을 막고 검증 메시지를 표시해야 한다.
6. WHEN 상태 값(PENDING/APPROVED/REJECTED)을 표시할 때 THEN 시스템은 상태별 뱃지로 표현해야 한다.

### Requirement 6 — 대시보드 요약

**User Story:** HR 담당자로서, 접속 직후 주요 지표를 한눈에 보고 싶다.

#### Acceptance Criteria

1. WHEN 대시보드에 진입하면 THEN 시스템은 전체 부서 수, 직원 수, 오늘 출근 기록 수, 대기(PENDING) 휴가 수를 카드로 표시해야 한다.
2. WHEN 각 지표 데이터를 로딩하는 동안 THEN 시스템은 로딩 상태를 표시해야 한다.
3. WHEN 지표 카드를 클릭하면 THEN 시스템은 해당 도메인 페이지로 이동해야 한다.

### Requirement 7 — API 연동 및 공통 처리

**User Story:** 개발자로서, API 베이스 URL과 오류/로딩 처리를 일관되게 관리하고 싶다.

#### Acceptance Criteria

1. WHEN 프론트엔드가 API를 호출할 때 THEN 시스템은 환경변수로 설정된 베이스 URL(기본 `http://localhost:8080`)을 사용해야 한다.
2. WHEN API 호출이 진행 중이면 THEN 시스템은 해당 화면에 로딩 표시를 제공해야 한다.
3. WHEN API 호출이 실패하면 THEN 시스템은 사용자에게 오류 메시지를 보여주고 재시도 수단을 제공해야 한다.
4. WHEN 백엔드가 `{ success, message }` 형식의 에러 응답을 반환하면 THEN 시스템은 `message`를 사용자에게 표시해야 한다.
5. WHEN 로컬 개발에서 CORS가 필요하면 THEN 시스템은 dev 서버 프록시 또는 베이스 URL 설정으로 이를 처리해야 한다.

### Requirement 8 — 기술 스택 및 품질

**User Story:** 개발자로서, 유지보수가 쉬운 표준 스택과 타입 안정성을 원한다.

#### Acceptance Criteria

1. WHEN 프로젝트를 생성할 때 THEN 시스템은 Vite + React + TypeScript 구성을 사용해야 한다.
2. WHEN API 응답을 다룰 때 THEN 시스템은 백엔드 DTO에 대응하는 TypeScript 타입을 정의해야 한다.
3. WHEN 라우팅을 구성할 때 THEN 시스템은 React Router를 사용해야 한다.
4. WHEN 코드를 작성할 때 THEN 시스템은 도메인별 API 모듈/페이지/컴포넌트로 폴더를 분리해야 한다.
5. WHEN 프론트엔드 산출물을 배치할 때 THEN 시스템은 백엔드와 분리된 `frontend/` 디렉터리에 둬야 한다.
