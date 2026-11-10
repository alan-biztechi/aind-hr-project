# Implementation Plan

- [ ] 1. 집계 함수 구현
  - `frontend/src/components/dashboard/summarizeByDepartment.ts` 신규 작성
  - `DepartmentCount { departmentName, count }` 타입과 `summarizeByDepartment(employees: EmployeeResponse[])` 함수 구현
  - `departmentName` 기준 합산, 퇴사자 포함, `count` 내림차순 → 같으면 `departmentName` 오름차순(`localeCompare(b, "ko")`), 입력 배열 비변경
  - _Requirements: 1.1, 1.3, 3.2_

- [ ] 2. 요약 컴포넌트 구현
- [ ] 2.1 `DepartmentSummary.module.css` 작성
  - 반응형 그리드(`repeat(auto-fit, minmax(160px, 1fr))`), 카드 외형은 `DashboardPage.module.css`와 같은 CSS 변수 사용
  - 클릭 대상이 아니므로 `cursor: pointer`, hover 효과 없음
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 `DepartmentSummary.tsx` 작성
  - `useEmployees()` 호출, `useMemo`로 `summarizeByDepartment` 결과 계산
  - 로딩: `Spinner`, 오류: `ErrorState`(`onRetry={refetch}`), 빈 상태: "표시할 부서별 인원이 없습니다." 안내
  - 성공 시 `section`(제목 "부서별 인원") 안에 `ul > li` 카드로 부서명과 인원 수 표시
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3_

- [ ] 3. 대시보드 연결
  - `frontend/src/pages/DashboardPage.tsx`에서 `PageHeader` 아래, 기존 지표 카드 그리드 위에 `<DepartmentSummary />` 삽입
  - 기존 4개 지표 카드의 코드와 동작은 변경하지 않음
  - _Requirements: 1.1, 3.1_

- [ ] 4. 정적 검증
  - `frontend/`에서 `npm run typecheck` 실행
  - `frontend/`에서 `npm run build` 실행
  - `git status`로 백엔드(`src/`, `pom.xml`) 파일이 변경되지 않았음을 확인
  - _Requirements: 3.3, 3.4_

- [ ] 5. 수동 검증 (백엔드 기동 필요, 사용자가 `npm run dev`로 직접 확인)
  - 부서별 카드·인원 수·정렬 규칙 확인 (Req 1.1~1.3)
  - 직원 등록/삭제 후 대시보드 수치 갱신 확인 (Req 1.4)
  - 백엔드 중지 시 요약 영역에만 오류와 "다시 시도"가 표시되고 기존 카드는 유지되는지 확인 (Req 2.2, 3.1)
  - 직원이 없을 때 빈 상태 안내 확인 (Req 2.3)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1_
