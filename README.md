# AIND HR Project

인사/근태 관리 실습 프로젝트입니다. Copilot 핸즈온 실습에서 사용합니다.

## 기술 스택

- Java 17 + Spring Boot 3.2
- MyBatis (XML Mapper)
- MySQL 8.x
- Swagger (springdoc-openapi)
- Lombok

## 사전 준비

### 1. MySQL 설치 및 DB 생성

```bash
mysql -u root -p
```

MySQL 프롬프트에서 아래 명령을 순서대로 실행합니다.

```sql
source src/main/resources/schema.sql
source src/main/resources/data.sql
```

### 2. DB 접속 정보 확인

`src/main/resources/application.yml`에서 DB 접속 정보를 확인하고, 환경에 맞게 수정합니다.

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aind_sample_db
    username: root
    password: root
```

### 3. 빌드 및 실행

Windows (cmd / PowerShell):

```bash
.\mvnw.cmd spring-boot:run
```

macOS / Linux:

```bash
./mvnw spring-boot:run
```

### 4. API 문서 확인

http://localhost:8080/swagger-ui.html

## DB 구조

| 테이블 | 설명 |
|--------|------|
| `department` | 부서 (개발팀, 인사팀 등) |
| `employee` | 직원 (부서 소속, 직급, ACTIVE/RESIGNED 상태) |
| `attendance` | 출퇴근 기록 (출근/퇴근 시각, NORMAL/LATE/EARLY_LEAVE/ABSENT) |
| `leave_request` | 휴가 신청 (ANNUAL/HALF_DAY/SICK/FAMILY_EVENT, PENDING/APPROVED/REJECTED) |

### 테이블 관계

```
department 1──N employee 1──N attendance
                         1──N leave_request (신청자)
                         1──N leave_request (승인자)
```

## API 목록

### 부서 (`/v1/departments`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/v1/departments` | 부서 목록 조회 |
| GET | `/v1/departments/{id}` | 부서 상세 조회 |
| POST | `/v1/departments` | 부서 등록 |
| PUT | `/v1/departments` | 부서 수정 |
| DELETE | `/v1/departments/{id}` | 부서 삭제 |

### 직원 (`/v1/employees`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/v1/employees` | 직원 목록 (부서 정보 포함) |
| GET | `/v1/employees/{id}` | 직원 상세 (부서 정보 포함) |
| GET | `/v1/employees/department/{departmentId}` | 부서별 직원 |
| POST | `/v1/employees` | 직원 등록 |
| PUT | `/v1/employees` | 직원 수정 |
| DELETE | `/v1/employees/{id}` | 직원 삭제 |

### 출퇴근 (`/v1/attendances`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/v1/attendances` | 전체 출퇴근 (직원/부서 포함) |
| GET | `/v1/attendances/date/{workDate}` | 날짜별 출퇴근 |
| GET | `/v1/attendances/employee/{employeeId}` | 직원별 출퇴근 |
| POST | `/v1/attendances/check-in` | 출근 등록 |
| PATCH | `/v1/attendances/{id}/check-out` | 퇴근 등록 |

### 휴가 신청 (`/v1/leaves`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/v1/leaves` | 휴가 신청 목록 |
| GET | `/v1/leaves/{id}` | 휴가 신청 상세 |
| GET | `/v1/leaves/employee/{employeeId}` | 직원별 휴가 신청 |
| POST | `/v1/leaves` | 휴가 신청 |

## 초기 데이터

- 부서 5개 (개발팀, 인사팀, 기획팀, 디자인팀, 영업팀)
- 직원 15명 (각 부서에 2~4명 배치)
- 출퇴근 기록 약 50건 (최근 1주일)
- 휴가 신청 10건 (APPROVED/PENDING/REJECTED 혼합)
