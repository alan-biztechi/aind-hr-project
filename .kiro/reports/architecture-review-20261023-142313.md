# Architecture Review Report
- 대상: aind-hr-project 전체 시스템 (Spring Boot 3.2.5 + MyBatis 3.0.3 + MySQL, HR/근태 관리). 소스 루트 `src/main/java/com/aind/hr/`, 설정/스키마/매퍼 `src/main/resources/`
- 일시: 2026-10-23 14:23:13 (KST)
- 최종 판정: **NO-GO**

---

## 1. 요약 (Executive Summary)

Department / Employee / Attendance / LeaveRequest 4개 도메인의 Controller → Service → Repository(MyBatis @Mapper) → MySQL 레이어드 구조는 깔끔하게 유지되어 있고, 매퍼는 전부 `#{}` 파라미터 바인딩을 사용해 SQL 인젝션 위험이 없는 점은 양호하다. 그러나 **운영 배포를 전제로 한 전체 시스템 관점에서는 미해결 Critical 리스크 5건**이 존재하여 현 상태로는 진행할 수 없다.

핵심 블로커:
- **인증/인가 레이어 전무** → HR 개인정보(PII)와 근태·휴가 데이터가 무인증으로 조회·수정·삭제 가능
- **전 Service `@Transactional` 전무** → read-then-write 원자성·격리 없음, TOCTOU
- **배포 파이프라인 전무**(Dockerfile/k8s/CI 없음) → 재현 배포·롤백·수평확장 불가
- **단일 MySQL SPOF** → DB 장애 시 전체 다운, 읽기 분산/failover 불가
- **테스트 설정이 운영 DB를 평문 자격증명으로 지시** → 테스트 실행이 운영 데이터를 파괴할 수 있는 즉각적 위험

리뷰는 architecture → (infra ∥ api) → db → risk-aggregator 순으로 진행했으며, 원본 findings 59건을 통합 리스크 25건(Critical 5 / High 9 / Medium 8 / Low 3)으로 병합했다.

> 비고: 코드 주석상 N+1(getAttendanceByDate), LeaveRequest.requestDate↔created_at 불일치, checkOut status 미반영은 "Copilot Lab 실습용 의도적 결함"으로 표기되어 있다. 본 리뷰는 학습 의도를 인지하되, 아키텍처 리스크로는 동일하게 평가하여 기록했다.

---

## 2. 리뷰어별 findings

### 2.1 Architecture (구조/설계/SPOF)
- [ARCH-1] Critical · SPOF — 단일 MySQL(localhost) 단일 엔드포인트. DB 장애 시 전체 다운, 읽기 분산 불가.
- [ARCH-2] High · SPOF/설계 — HikariCP 풀 미튜닝(기본값). 풀 고갈 연쇄장애.
- [ARCH-3] Medium · 설계 — 앱은 stateless에 가까움(양호). 동시성 보장이 DB 유니크 제약 1곳에 집중.
- [ARCH-4] High · 설계 — 전 Service `@Transactional` 전무. read-then-write 원자성 없음, TOCTOU.
- [ARCH-5] High · 설계 — AttendanceService.getAttendanceByDate N+1 쿼리.
- [ARCH-6] Medium · 설계 — GlobalExceptionHandler가 `e.getMessage()` 노출 + `@Valid` 실패 전용 핸들러 부재(500 가능).
- [ARCH-7] Medium · 동시성 — checkIn 중복방지가 `catch(Exception)` 광범위 → 모든 DB오류를 '중복'으로 오분류.
- [ARCH-8] Low · 설계 — 광범위 catch로 예외 원인 소실 + 로깅 없음.
- [ARCH-9] High · 구조 — 엔티티를 응답 DTO로 직노출, DTO 경계 불일치.
- [ARCH-10] Medium · 구조 — Request→엔티티 매핑이 Controller에 분산.
- [ARCH-11] Medium · 구조/설계 — LeaveRequest.requestDate가 DB created_at과 불일치 → 항상 null.
- [ARCH-12] Low · 구조 — @Mapper를 repository 패키지로 명명, 매퍼가 response 타입에 역의존.
- [ARCH-13] Low · 보안 — DB 자격증명 평문 root/root, Spring Security 없어 인증/인가 레이어 부재.

### 2.2 Infra (배포/스케일/장애)
- [INFRA-1] Critical · 배포 — Dockerfile/k8s/CI 전무 → 재현가능 배포·롤백·수평확장 불가.
- [INFRA-2] Critical · 배포 — DB 자격증명 평문·환경 외부화 없음·test가 운영 DB를 지시(격리 안 됨).
- [INFRA-3] High · 배포 — spring.profiles 분리 없음(단일 설정).
- [INFRA-4] High · 장애 — actuator/헬스체크(liveness·readiness) 없음 → LB·롤링배포 불가.
- [INFRA-5] High · 장애 — HikariCP(pool size/timeout/max-lifetime) 미설정.
- [INFRA-6] High · 장애 — JDBC connect/socket timeout·재시도·서킷브레이커 없음 → 스레드 고갈.
- [INFRA-7] Critical · 스케일/장애 — 단일 MySQL SPOF(ARCH-1 심화).
- [INFRA-8] Medium · 스케일 — 분산 캐시/세션/락 없음 → 동시성 DB제약 집중.
- [INFRA-9] Medium · 장애/스케일 — getAttendanceByDate N+1 풀고갈 가속.
- [INFRA-10] Medium · 장애 — graceful shutdown 미설정 → 롤링배포 시 요청 강제중단.
- [INFRA-11] Medium · 관측성 — 구조화 로깅/상관ID/메트릭/트레이싱 없음.
- [INFRA-12] Low · 배포/스케일 — 컨테이너 리소스/JVM heap/Tomcat 스레드 한계 미정의.

### 2.3 API (계약/보안/성능)
- [API-1] Critical · 보안 — 전 엔드포인트 무인증 공개 → HR PII 무방비 조회·생성·수정·삭제.
- [API-2] High · 보안 — GlobalExceptionHandler가 `e.getMessage()` 그대로 노출(내부정보 유출).
- [API-3] High · 보안/계약 — MethodArgumentNotValidException 전용 핸들러 부재 → 검증 실패가 500.
- [API-4] Medium · 보안 — EmployeeUpdate.status 자유문자열 → 상태 위조 mass assignment.
- [API-5] Medium · 보안/계약 — position/leaveType/status/phone enum·화이트리스트·포맷 검증 부재.
- [API-6] High · 계약 — 엔티티 직노출로 응답 스키마 비일관·하위호환 위험.
- [API-7] Medium · 계약 — PUT이 경로 id 없이 body로 id 수신(조회·삭제는 /{id} 사용, 비일관).
- [API-8] Medium · 계약 — 201 응답에 Location 헤더 없음.
- [API-9] Medium · 계약 — 성공/에러 응답 포맷 비일관, errorCode 식별자 없음(message만).
- [API-10] Medium · 계약 — checkOut이 @RequestParam으로 데이터 수신·검증 누락(checkIn은 body).
- [API-11] Low · 계약 — 버저닝 전략 문서화 미흡.
- [API-12] High · 성능 — 전 목록조회 페이지네이션·필터 전무(전건 반환).
- [API-13] High · 성능 — getAttendanceByDate N+1의 API 증폭.
- [API-14] Medium · 성능 — HTTP 캐시(ETag/Cache-Control) 없음.
- [API-15] Low · 성능 — 엔티티 직노출로 불필요 메타필드 payload 과다.

### 2.4 DB (스키마/쿼리/트랜잭션)
- [DB-1] Critical · 트랜잭션 — 전 Service `@Transactional` 전무 → 원자성·격리 없음, TOCTOU.
- [DB-2] High · 트랜잭션/스키마 — checkIn 중복방지가 UNIQUE 제약+`catch(Exception)`에 의존 → 무관 예외까지 '중복' 오분류.
- [DB-3] High · 스키마 — department/employee 물리 DELETE + 하위 FK ON DELETE 미지정(RESTRICT) → 자식 있으면 삭제 실패, 감사 이력 보존 부적절.
- [DB-4] High · 쿼리 — getAttendanceByDate N+1(루프 내 selectById).
- [DB-5] High · 스키마/쿼리 — work_date 단독 인덱스 없음(복합 UNIQUE 선두가 employee_id) → selectByWorkDate 풀스캔.
- [DB-6] High · 쿼리/정합성 — LeaveRequest.requestDate ↔ created_at 불일치로 항상 null.
- [DB-7] High · 쿼리 — 전 조회 LIMIT/페이지네이션 전무, 근태/휴가는 무한 증가 테이블.
- [DB-8] Medium · 스키마 — status/leave_type/position이 ENUM/CHECK 없는 VARCHAR.
- [DB-9] Medium · 쿼리/정합성 — EmployeeMapper.update가 hire_date 누락, status mass-assignment 소지.
- [DB-10] Medium · 트랜잭션/정합성 — insert가 status/approver_id를 DB default에 의존, 삽입 후 재조회 없어 반환객체 상태 불일치.
- [DB-11] Medium · 트랜잭션 — 격리수준/statement·transaction timeout 미설정, 전부 autocommit.
- [DB-12] Medium · 스키마 — leave_request에 end_date>=start_date CHECK·기간겹침 방지 제약 없음.
- [DB-13] Medium · 스키마 — attendance에 updated_at 없음(타 테이블은 존재), 근태 정정 감사 불가.
- [DB-14] Low · 쿼리 — getAttendanceByDate 경로가 department_name 누락(동일 DTO 충족도 비일관).
- [DB-15] Low · 기능결함 — checkOut이 setStatus("EARLY_LEAVE") 계산하나 updateCheckOut이 status를 UPDATE하지 않아 조퇴 상태가 DB에 반영 안 됨.
- [DB-16] Low · 운영 — spring.sql.init.mode=never + 마이그레이션 도구(Flyway/Liquibase) 부재 → 스키마 드리프트, DROP 스크립트 사고 위험.

> 긍정 확인: 전 매퍼 `${}` 사용 0건(모두 `#{}` 바인딩) — SQL 인젝션 위험 없음. FK 컬럼은 InnoDB 자동 보조 인덱스 사용. selectAllWithEmployee/selectAllWithDepartment/selectWithDepartmentById는 INNER JOIN으로 올바르게 작성.

---

## 3. 통합 리스크 (심각도순, Risk Aggregator 결과)

| ID | 심각도 | 영역 | 설명 | 근본 원인 | 권고 조치 |
|----|--------|------|------|-----------|-----------|
| RISK-1 | Critical | 보안 | 전 엔드포인트 무인증 공개로 HR PII·근태·휴가가 무방비 조회/수정/삭제. status 임의 변경 등 mass assignment까지 실현 가능 | 인증/인가 레이어(Spring Security) 자체 부재 | Spring Security 도입, JWT/세션 인증 + 역할기반 인가(ADMIN/HR/EMPLOYEE), PII·개인자원은 본인/관리자만. swagger-ui/api-docs 환경별 제어 (ARCH-13, API-1, API-4 실현경로) |
| RISK-2 | Critical | 트랜잭션 | 전 Service `@Transactional` 전무 → read-then-write 원자성·격리 없음, TOCTOU, 부분커밋 | 트랜잭션 경계 설계 부재 | 쓰기 메서드 `@Transactional`(+timeout), 조회 `readOnly=true`. 존재확인+변경을 한 트랜잭션으로. (ARCH-4, DB-1, DB-11) |
| RISK-3 | Critical | 배포 | Dockerfile/k8s/CI 전무 → 재현가능 배포·롤백·수평확장 불가(로컬 mvnw 실행 수준) | 컨테이너화·CI/CD 파이프라인 부재 | 멀티스테이지 Dockerfile(JRE17 slim)+.dockerignore, k8s Deployment/Service(또는 compose), CI(빌드→이미지→배포) 구성 (INFRA-1) |
| RISK-4 | Critical | SPOF/스케일 | 단일 MySQL·단일 엔드포인트. DB 장애 시 전체 다운, 읽기 분산/failover 불가 | DB 가용성 설계 부재 | Managed DB(Multi-AZ/replication), read/write 분리, JDBC failover 또는 프록시(RDS Proxy/ProxySQL) (ARCH-1, INFRA-7) |
| RISK-5 | Critical | 배포/운영 | 테스트 설정(application-test.yml)이 운영과 동일 DB를 평문 root/root로 지시 → 테스트 실행이 운영 데이터 파괴 가능. schema.sql의 DROP TABLE 포함 | 환경 분리·자격증명 외부화 부재 | 자격증명 환경변수/시크릿 외부화, 프로파일(dev/stage/prod) 분리, 테스트는 Testcontainers/H2로 격리 (INFRA-2, ARCH-13) |
| RISK-6 | High | 성능/장애 | getAttendanceByDate N+1(1+N 쿼리) → 응답 지연·커넥션 점유로 풀고갈 가속 | 조회 전략 비일관(JOIN 매퍼 존재하나 미사용) | work_date JOIN 쿼리(selectByWorkDateWithEmployee)로 단일화, department_name 포함 (ARCH-5, INFRA-9, API-13, DB-4, DB-14) |
| RISK-7 | High | 성능 | 전 목록조회 LIMIT/페이지네이션 전무(전건 반환). 근태·휴가는 무한 증가 테이블 | 조회 계약에 페이징 미설계 | page/size(또는 keyset) + 기간·직원 필터, total count, 최대 size 상한 (API-12, DB-7) |
| RISK-8 | High | 동시성/오류처리 | checkIn 중복방지가 UNIQUE 제약+`catch(Exception)`에 의존 → NPE·커넥션장애 등 무관 예외도 '중복'으로 오분류, 장애 은폐 | 예외 타입 미구분 + 과도한 광범위 catch | DuplicateKeyException만 중복 매핑, 그 외 원인 보존 재던짐+로깅. UNIQUE는 최종 방어선 유지 (ARCH-7, DB-2) |
| RISK-9 | High | 보안/계약 | GlobalExceptionHandler가 `e.getMessage()` 노출 + `@Valid` 실패 전용 핸들러 부재로 검증오류가 500 | 표준 예외처리 전략 미흡 | 일반 예외는 고정문구+서버로그(traceId), MethodArgumentNotValidException/TypeMismatch/MessageNotReadable→400, ErrorCode 식별자 포함 (ARCH-6, API-2, API-3) |
| RISK-10 | High | 구조/계약 | 영속 엔티티를 응답 DTO로 직노출(도메인마다 혼재) → 스키마 변경이 API 계약에 직접 전파, 하위호환 위험 | DTO 경계 일관성 부재 | 전 조회 응답을 전용 Response DTO로 통일, 엔티티는 API 경계 밖으로 격리 (ARCH-9, API-6) |
| RISK-11 | High | 스키마/데이터 | department/employee 물리삭제 + 하위 FK RESTRICT → 운영 데이터에서 삭제 거의 항상 실패, 감사 이력 소실 위험 | 논리삭제·FK 정책 미설계 | 논리삭제(status='RESIGNED'/soft-delete 플래그) 전환, 또는 삭제 전 자식 검증+명시적 FK 정책+트랜잭션 (DB-3) |
| RISK-12 | High | 성능/스키마 | work_date 단독 인덱스 없음(복합 UNIQUE 선두가 employee_id) → 날짜별 근태 조회 풀스캔 | 조회 패턴 대비 인덱스 설계 누락 | `idx_attendance_work_date` 추가, 범위조회면 (work_date, employee_id) 복합 인덱스 (DB-5) |
| RISK-13 | High | 장애/스케일 | HikariCP 미튜닝 + JDBC connect/socket timeout·재시도 없음 → 풀고갈·스레드 무한대기 연쇄장애 | 커넥션/타임아웃 리소스 설계 부재 | hikari pool-size/connection-timeout/max-lifetime 명시, JDBC connectTimeout/socketTimeout, Resilience4j 타임아웃/서킷브레이커 (ARCH-2, INFRA-5, INFRA-6) |
| RISK-14 | High | 운영/배포 | actuator/헬스체크 부재 + 프로파일 분리 없음 + graceful shutdown 미설정 → LB 판정·무중단 롤링배포 불가 | 운영 가용성 설정 미비 | actuator liveness/readiness + k8s probe, 프로파일 분리, `server.shutdown: graceful` + preStop/terminationGracePeriod (INFRA-3, INFRA-4, INFRA-10) |
| RISK-15 | Medium | 데이터 정합성 | LeaveRequest.requestDate가 DB created_at과 매핑 불일치로 항상 null(신청일 유실) | 엔티티 명명 ↔ 컬럼 불일치 + camel 매핑 | 엔티티 필드 createdAt으로 통일 또는 매퍼 `created_at AS request_date` 별칭/resultMap (ARCH-11, DB-6) |
| RISK-16 | Medium | 보안/데이터 | status/leave_type/position/phone enum·화이트리스트·포맷 검증 부재 + DB에도 ENUM/CHECK 없음 → 무효값 저장 | 입력 도메인 제약 이중 부재(앱+DB) | enum 바인딩/@Pattern 화이트리스트 + DB CHECK/ENUM, phone @Pattern/@Size (API-5, DB-8) |
| RISK-17 | Medium | 계약 | 응답 포맷 비일관(조회=raw, 변경=UpdateResponse, 에러=ResultResponse), errorCode 미포함, 201 Location 없음 | 공통 응답/에러 표준 부재 | 공통 응답 포맷 또는 RFC 7807, 에러에 errorCode, 생성은 `ResponseEntity.created(uri)` (API-8, API-9) |
| RISK-18 | Medium | 계약 | 수정/퇴근 엔드포인트 비일관: PUT이 body로 id, checkOut이 @RequestParam+검증누락 | URI/요청 모델 규약 비일관 | `PUT /{id}`로 통일, checkOut도 body DTO+검증, 부분수정은 PATCH (API-7, API-10) |
| RISK-19 | Medium | 구조 | Request→엔티티 매핑이 Controller에 분산·중복, 매핑 누락 위험 | 매핑 책임 위치 부적절 | toEntity()/MapStruct로 매핑 이관, Controller는 위임만 (ARCH-10, DB-9의 매핑측면) |
| RISK-20 | Medium | 스케일/동시성 | 분산 캐시/세션/락 없어 동시성 보장이 DB 제약 1곳 집중(현재 수평확장 자체는 가능) | 공유 상태 외부화 수단 부재 | 무상태 유지 원칙 명문화, 필요 시 Redis(캐시/분산락) (ARCH-3, INFRA-8) |
| RISK-21 | Medium | 데이터 정합성 | insert가 status/approver_id를 DB default에 의존+삽입후 재조회 없음 → 반환객체 상태 불일치(신청 직후 null) | 영속 상태 재조회 부재 | 초기값 앱에서 명시 설정 또는 insert 후 selectById 재조회 반환 (DB-10) |
| RISK-22 | Medium | 스키마/무결성 | leave_request 기간 유효성(end>=start)·겹침 방지 DB 제약 없음, 서비스 단건검증만 | DB 무결성 제약 미설계 | CHECK(end_date>=start_date), 겹침은 트랜잭션+잠금/배타 제약 (DB-12) |
| RISK-23 | Medium | 관측성 | 구조화 로깅/상관ID/메트릭/트레이싱 없음(기본 STDOUT) | 관측성 설계 부재 | logback-spring.xml(JSON/프로파일별 레벨), MDC 상관ID, micrometer, (선택)OpenTelemetry (ARCH-8, INFRA-11) |
| RISK-24 | Low | 기능결함 | checkOut이 EARLY_LEAVE 계산하나 updateCheckOut이 status를 UPDATE 안 함 → 조퇴 상태 DB 미반영 | 쿼리에 status 갱신 누락 | updateCheckOut에 status 함께 UPDATE하거나 상태 재계산 일관화 (DB-15) |
| RISK-25 | Low | 운영/기타 | 스키마 마이그레이션 도구 부재(드리프트·DROP 사고 위험), 감사컬럼 비일관(attendance updated_at 없음), 매퍼의 response 역의존, 버저닝 전략 미흡, payload 과다 | 운영 성숙도/부수 품질 | Flyway/Liquibase 도입+DROP 분리, attendance updated_at 추가, 경량 목록 DTO, 버저닝 정책 문서화 (DB-16, DB-13, ARCH-12, API-11, API-15) |

최종 심각도 집계: **Critical 5 · High 9 · Medium 8 · Low 3 (총 25건)**

인과관계(근본원인 → 파생):
- 단일 DB SPOF(RISK-4) + 풀/타임아웃 미튜닝(RISK-13) + N+1(RISK-6) + 페이징 부재(RISK-7) → 커넥션 풀 고갈·연쇄 장애
- 트랜잭션 부재(RISK-2) → checkIn 예외 의존(RISK-8) → 삽입 상태 불일치(RISK-21) → read-then-write 갱신손실
- 인증 부재(RISK-1) → status mass assignment·입력검증 부재(RISK-16)가 실제 권한상승으로 실현
- 환경 미분리+자격증명 노출(RISK-5) → 테스트가 운영 DB 파괴라는 즉각적·비가역적 위험

---

## 4. 조건부 진행 시 선행 조건 (CONDITIONAL GO 전환 조건)

현재는 NO-GO이나, 아래를 충족하면 CONDITIONAL GO로 전환 가능하다.

### 4.1 CONDITIONAL GO 1차 조건 — Critical 5건 전부 해소 (필수)
1. (RISK-5) 테스트 설정을 운영 DB에서 분리하고, 자격증명을 환경변수/시크릿으로 외부화 — **가장 먼저, 즉시**. 운영 데이터 파괴 위험 차단.
2. (RISK-1) Spring Security 기반 인증 + 역할기반 인가 도입, PII/개인자원 접근 제한.
3. (RISK-2) 전 쓰기 Service `@Transactional`, 조회 `readOnly=true` 적용.
4. (RISK-4) DB 가용성 확보(Managed Multi-AZ/replication, failover 경로).
5. (RISK-3) 컨테이너화 + 배포 파이프라인(Dockerfile, k8s/compose, CI) 구성.

### 4.2 CONDITIONAL GO 유지 조건 — High 9건에 대한 기한부 완화 계획
- RISK-6(N+1), RISK-7(페이지네이션), RISK-12(work_date 인덱스): 성능/부하 블로커 — 운영 데이터 규모 전 반드시 해소.
- RISK-8(checkIn 예외), RISK-9(예외처리/검증), RISK-11(물리삭제/FK): 데이터 정합성·오류은폐 — 해소 또는 명시적 보상책.
- RISK-10(엔티티 직노출), RISK-13(풀/타임아웃), RISK-14(헬스체크/프로파일/셧다운): 계약 안정성·운영 가용성 — 기한부 로드맵 합의.
- 각 High 항목에 담당자·기한·검증방법을 명시한 완화 계획이 승인되어야 CONDITIONAL GO를 유지한다.

---

## 5. 최종 SA 의견 및 근거

**판정: NO-GO.**

판정 기준상 미해결 Critical이 1건만 있어도 NO-GO이며, 본 리뷰에서는 Critical 5건(RISK-1~5)이 확인되었다.

- 가장 즉각적이고 비가역적인 위험은 **RISK-5**다. `application-test.yml`이 운영과 동일한 `jdbc:mysql://localhost:3306/aind_sample_db`를 `root/root`로 가리키고, `schema.sql`에 `DROP TABLE`이 포함되어 있어, 테스트/초기화 스크립트 오실행이 운영 데이터를 삭제할 수 있다. 이 한 건만으로도 운영 진행은 불가하다.
- 보안 최상위 블로커는 **RISK-1**이다. 인증/인가 레이어가 전혀 없어 직원 이메일·전화 등 PII와 전체 근태·휴가 기록이 무인증으로 노출·변조·삭제 가능하며, 입력검증 부재와 결합해 상태 위조(mass assignment)까지 실현된다. 개인정보보호 규제 위반 소지가 크다.
- RISK-2(트랜잭션 부재), RISK-4(단일 DB SPOF), RISK-3(배포 파이프라인 전무)는 각각 데이터 정합성·가용성·운영 성립성의 토대가 비어 있음을 의미한다.

반면 레이어 분리, 파라미터 바인딩(인젝션 안전), 일부 JOIN 매퍼 등 **기반 구조 자체는 건전**하여, Critical 5건을 해소하면 CONDITIONAL GO로의 전환은 현실적으로 가능하다. 다만 그 이후에도 High 9건(특히 성능 3종 RISK-6/7/12, 정합성 RISK-8/9/11)에 대한 기한부 완화 계획 승인이 CONDITIONAL GO 유지의 전제다.

리뷰어 간 상충 지적은 없었다. 조정 메모: `INFRA-2`의 자격증명 측면은 테스트→운영 DB 지시라는 비가역 위험 때문에 risk-aggregator가 High→Critical로 승격(RISK-5)했으며, 이는 타당하다. '인증 부재(RISK-1)'와 'DB 자격증명 외부화(RISK-5)'는 성격이 달라 별도 리스크로 분리 유지했다. 코드 주석상 "의도적 실습 결함"으로 표기된 항목(N+1=RISK-6, requestDate=RISK-15, checkOut status=RISK-24)은 학습 맥락을 인지하되 리스크로는 동일하게 평가해 기록했다.
