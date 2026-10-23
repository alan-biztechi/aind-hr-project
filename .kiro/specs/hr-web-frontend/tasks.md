# Implementation Plan

- [x] 1. 프로젝트 초기화 및 기반 설정
  - `frontend/`에 Vite + React + TypeScript 프로젝트 생성 (package.json, tsconfig, index.html, src/main.tsx)
  - 의존성 추가: react-router-dom, @tanstack/react-query, axios, react-hook-form
  - `vite.config.ts`에 `/v1` → `http://localhost:8080` dev 프록시 설정
  - `.env.example`에 `VITE_API_BASE_URL` 추가
  - _Requirements: 7.1, 7.5, 8.1, 8.3, 8.5_

- [x] 2. API 타입 정의
  - `src/types/api.ts`에 백엔드 DTO 대응 타입 작성 (Department, EmployeeResponse, AttendanceResponse, LeaveRequest, 각 Request/Response, enum 상태 타입)
  - requestDate/필드명 불일치 등 백엔드 계약 주석 반영
  - _Requirements: 8.2, 8.4_

- [x] 3. axios 클라이언트 및 공통 에러 처리
  - `src/api/client.ts`에 axios 인스턴스 작성 (baseURL from env)
  - 응답 인터셉터로 `{ success, message }` 에러 메시지 정규화 → Error(message)
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 4. 도메인 API 모듈 구현
- [x] 4.1 `src/api/departments.ts` — 목록/상세/등록/수정/삭제
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
- [x] 4.2 `src/api/employees.ts` — 목록/상세/부서별/등록/수정/삭제
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_
- [x] 4.3 `src/api/attendances.ts` — 전체/날짜별/출근/퇴근(쿼리파라미터)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
- [x] 4.4 `src/api/leaves.ts` — 목록/직원별/신청
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. TanStack Query 훅 구현
  - `src/hooks/`에 도메인별 useQuery/useMutation 훅 작성, query key 및 성공 시 invalidation 규칙 적용
  - 로딩/에러 상태를 페이지에서 소비할 수 있도록 노출
  - _Requirements: 7.2, 7.3, 2.2, 2.3, 2.4, 3.4, 3.6, 3.7, 4.3, 4.4, 5.3_

- [x] 6. 공통 UI 컴포넌트
- [x] 6.1 Spinner, ErrorState(재시도 버튼), DataTable(빈 상태 포함)
  - _Requirements: 7.2, 7.3_
- [x] 6.2 StatusBadge — 출퇴근/휴가/직원 상태 색상 매핑
  - _Requirements: 4.5, 5.6_
- [x] 6.3 Modal, ConfirmDialog — 폼 모달 및 삭제 확인
  - _Requirements: 2.6, 3.7_

- [x] 7. 앱 셸: 레이아웃 · 라우팅 · 404
  - `AppLayout`(사이드바 + Outlet), `NavLink` 활성 표시, 라우트 등록, `NotFoundPage`
  - `main.tsx`에 QueryClientProvider + Router 구성
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. 부서 페이지 구현
  - 목록 테이블 + 등록/수정 폼 모달(react-hook-form, 이름 필수 검증) + 삭제 확인 다이얼로그
  - 뮤테이션 성공 시 목록 갱신, 실패 시 인라인 오류
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 9. 직원 페이지 구현
  - 부서 필터 드롭다운 + 목록(부서명 포함) + 상세 보기
  - 등록/수정 폼 모달(이름/이메일/부서/직급/입사일 필수, 이메일 형식, 상태 선택), 부서 드롭다운은 부서 쿼리로 채움
  - 삭제 확인 다이얼로그, 성공 시 갱신
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 10. 출퇴근 페이지 구현
  - 전체/날짜 선택 조회 + 목록(직원명/부서명, 상태 뱃지)
  - 출근 등록 폼(직원/근무일/출근시각 필수)
  - 행별 퇴근 등록(checkOut 미기입 행만, HH:mm 쿼리 파라미터)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. 휴가 페이지 구현
  - 직원 필터 + 목록(직원명은 직원 쿼리로 조인, 상태 뱃지)
  - 휴가 신청 폼(직원/유형 셀렉트 연차·반차·병가·경조사/시작일/종료일 필수, 종료일≥시작일 검증)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 12. 대시보드 페이지 구현
  - 부서 수 / 직원 수 / 오늘 출근 수 / 대기(PENDING) 휴가 수 카드
  - 로딩 표시, 카드 클릭 시 해당 라우트 이동
  - _Requirements: 6.1, 6.2, 6.3_

- [~] 13. 빌드 검증 및 문서화
  - `frontend/README.md`에 실행 방법(백엔드 먼저 기동 → `npm install` → `npm run dev`)과 환경변수 설명 추가 — 완료
  - `tsc --noEmit` 및 `vite build`로 타입/빌드 확인 — **보류: 현재 환경에 Node/npm 미설치. Node 20.19+ 환경에서 `npm install && npm run build`로 검증 필요**
  - _Requirements: 8.1, 8.2_
