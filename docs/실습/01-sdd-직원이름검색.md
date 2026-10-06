# 실습 ①. SDD로 "직원 이름 검색" 기능 추가하기

> **이론 선행**: [03. SDD: 명세 주도 개발](../이론/03-sdd-명세주도개발.md)
>
> 이 실습에서는 Kiro의 **Spec(SDD) 모드**를 사용해, 실제 프로젝트 `aind-hr-project`에
> **직원을 이름으로 검색하는 기능**을 처음부터(요구사항 → 설계 → 작업 → 구현) 추가합니다.

---

## 0. 실습 목표

- Kiro **Spec 세션**을 직접 생성하고 요구사항 → 설계 → 작업 → 구현 흐름을 경험한다.
- 각 단계에서 **사람이 검토·승인**하는 지점을 몸으로 익힌다.
- 생성된 코드가 기존 프로젝트의 **코드 패턴(레이어드 구조·응답 포맷·Swagger·테스트)**을 따르는지 확인한다.

**구현할 기능 한 줄 정의**

> 직원 이름의 일부로 직원 목록을 검색하는 API `GET /v1/employees/search?name={키워드}`

---

## 사전 설정: MySQL MCP 연결 (선택)

Spec의 **설계 단계에서 실제 DB 스키마를 확인**하면 더 정확한 설계를 만들 수 있습니다.
Kiro가 MySQL에 직접 질의하도록 MCP 서버를 붙여둡니다. 설정은 이미 아래 파일에 들어 있습니다.

- 파일: `.kiro/settings/mcp.json` (프로젝트 루트 = `aind-hr-project/`)
- 접속 정보: `application.yml`과 동일 (`aind_sample_db` / `localhost:3306`)
- 안전장치: **읽기 전용**(INSERT/UPDATE/DELETE 차단)

연결 확인:

1. Kiro의 **MCP Server 뷰**에서 `mysql` 서버가 연결됐는지 본다. (안 되면 재연결)
2. 다음처럼 물어 스키마를 확인한다.
   ```text
   mysql mcp 통해서 employee 테이블 컬럼 알려줘.
   ```

> ℹ️ MCP 없이도 실습은 가능합니다. 그 경우 설계 단계에서 `EmployeeMapper.xml`을 직접 열어 컬럼을 확인하세요.
> 이 설정 파일은 실습용으로 미리 제공됩니다. (실무에서는 DB 비밀번호가 평문으로 들어가므로 저장소에 커밋하지 않는 것이 원칙입니다.)

---

## 1. Spec 세션 시작

1. Kiro에서 **새 Spec 세션**을 엽니다. (Vibe가 아니라 Spec)
2. 작업 폴더는 `aind-hr-project` 루트로 둡니다. (Kiro가 기존 코드를 맥락으로 읽을 수 있게)
3. 아래 요청으로 시작합니다.

```text
직원을 이름으로 검색하는 기능을 추가하고 싶어.
```

> 💡 여기서는 **실습을 위해 일부러 짧게** 던집니다. Spec 모드가 부족한 정보를 어떻게 **되묻는지** 체험하기 위해서입니다.
> "부분 일치인가?", "퇴사자도 포함하나?", "응답 형태는?" 같은 질문이 돌아오면,
> 그때 다음 절(요구사항 검토)의 기준을 참고해 하나씩 답하면 됩니다.
>
> ⚠️ **실전에서는 반대입니다.** 프롬프트는 처음부터 **자세히 적을수록 좋습니다.**
> 요구사항·제약·기대 결과를 구체적으로 줄수록 되묻는 횟수가 줄고, Spec의 품질과 정확도가 올라갑니다.
> (예: "이름 부분 일치, 퇴사자 제외, 응답은 기존 `/v1/employees`와 동일한 형태로" 처럼 명시)

Kiro는 이 요청과 되물음에 대한 답을 바탕으로 `.kiro/specs/employee-name-search/` 아래에
`requirements.md` → `design.md` → `tasks.md`를 순서대로 생성합니다.

---

## 2. 단계 ① 요구사항 검토 (`requirements.md`)

Kiro가 만든 요구사항을 **그대로 승인하지 말고** 다음을 확인하고 보완합니다.

### 검토 포인트 (체크리스트)

- [ ] **부분 일치 검색**인가? ("김"으로 "김민수", "김영희"가 모두 검색되는가)
- [ ] **대소문자/공백 처리** 기준이 정해졌는가? (앞뒤 공백 trim 등)
- [ ] 검색어가 **비었을 때** 동작은? (전체 반환 vs 400 에러 — 하나로 정한다)
- [ ] **퇴사자(RESIGNED) 포함 여부** — 포함할지 뺄지 명시한다.
- [ ] 응답 형태는 기존 **`EmployeeResponse`** (부서 이름 포함)와 동일한가?
- [ ] 결과 **정렬 기준**은? (기존 목록과 동일하게 `id` 순 등)

### 예시로 넣을 수용 기준(acceptance criteria)

> - 이름 일부(`name`)를 쿼리 파라미터로 받아 **부분 일치**로 검색한다.
> - 검색 결과는 `EmployeeResponse` 리스트(부서명 포함)로 반환한다.
> - 일치하는 직원이 없으면 **빈 배열**과 200을 반환한다.
> - `name`이 비어 있으면 `INVALID_INPUT`(400)을 반환한다. *(팀 정책에 맞게 결정)*

보완이 끝나면 **승인**합니다.

---

## 3. 단계 ② 설계 검토 (`design.md`)

이 프로젝트의 레이어드 구조에 맞는 설계가 나왔는지 확인합니다.

> 💡 MCP를 붙였다면, 설계 전에 `employee` 테이블의 실제 컬럼(`name`, `status` 등)을 Kiro에게 확인시키면 쿼리 설계가 정확해집니다.

### 기대하는 설계 (기존 패턴 기준)

```
Controller            Service                 Repository            Mapper(XML)
EmployeeController →  EmployeeService      →  EmployeeRepository →  EmployeeMapper.xml
 GET /search          searchByName(name)      searchByName(...)     <select> ... LIKE
```

### 검토 포인트

- [ ] **엔드포인트**: `GET /v1/employees/search?name=` 형태인가? (경로 충돌 없음 — `/{id}`, `/department/{id}`와 겹치지 않는지)
- [ ] **Controller**: `@GetMapping("/search")` + `@RequestParam String name`, `@Operation` 문서화 포함?
- [ ] **Service**: 기존처럼 간결하게 Repository 호출. (검색은 보통 예외 없이 빈 리스트 허용)
- [ ] **Repository**: `List<EmployeeResponse> searchByName(@Param("name") String name)` 시그니처
- [ ] **Mapper**: `department` INNER JOIN + `WHERE e.name LIKE CONCAT('%', #{name}, '%')` (기존 `selectAllWithDepartment`와 동일한 컬럼/조인)
- [ ] 응답은 **`EmployeeResponse`** 재사용 (새 DTO를 만들지 않는다)

> ⚠️ 자주 틀리는 지점: Kiro가 `Employee` 엔티티를 그대로 반환하거나 새 응답 DTO를 만들려 할 수 있습니다.
> **"기존 `selectAllWithDepartment`와 똑같이 부서명 포함 `EmployeeResponse`로 맞춰줘"**라고 설계 단계에서 바로잡으세요.

설계가 프로젝트와 맞으면 **승인**합니다.

---

## 4. 단계 ③ 작업 검토 (`tasks.md`)

작업이 **작고 순서가 맞는지** 확인합니다. 예상 작업 목록:

1. `EmployeeMapper.xml`에 `searchByName` `<select>` 추가 (LIKE, 부서 조인)
2. `EmployeeRepository`에 `searchByName` 메서드 추가
3. `EmployeeService`에 `searchByName` 메서드 추가
4. `EmployeeController`에 `GET /v1/employees/search` 추가 (`@RequestParam`, `@Operation`)
5. `EmployeeServiceTest`에 검색 성공/빈 결과 테스트 추가
6. 빌드·테스트로 검증 (`./mvnw test`)

작업 단위가 적절하면 **승인**합니다.

---

## 5. 단계 ④ 구현 실행

Kiro가 작업을 하나씩 실행합니다. 각 작업이 끝날 때마다 다음을 확인합니다.

- 추가된 코드가 **기존 네이밍/구조**를 따르는가 (`selectAllWithDepartment` 스타일)
- `@RequiredArgsConstructor` 생성자 주입, `@Tag`/`@Operation` 문서화가 유지되는가
- `EmployeeResponse`를 재사용하는가 (불필요한 새 DTO를 만들지 않았는가)

### 검증

```bash
# aind-hr-project 폴더에서
./mvnw -q test
./mvnw spring-boot:run   # 별도 터미널
```

서버를 띄운 뒤 실제로 호출해 봅니다.

```bash
# 이름에 "김"이 들어가는 직원 검색
curl "http://localhost:8080/v1/employees/search?name=김"
```

Swagger UI(http://localhost:8080/swagger-ui.html)의 **employee** 태그에 새 API가 보이는지도 확인합니다.

---

## 6. 완료 체크리스트

- [ ] `GET /v1/employees/search?name=` 가 **부분 일치**로 동작한다.
- [ ] 응답이 기존 목록과 같은 **`EmployeeResponse`(부서명 포함)** 형태다.
- [ ] 결과 없음일 때 **빈 배열 + 200** (요구사항에서 정한 정책대로).
- [ ] 기존 테스트가 깨지지 않고, 검색 테스트가 추가되어 **통과**한다.
- [ ] Swagger에 새 API가 문서화되어 있다.

---

## 7. 돌아보기: Spec을 쓰니 뭐가 달랐나

- 요구사항 단계에서 **"빈 검색어/퇴사자/부분 일치"** 같은 모호함을 미리 잡았다. → 구현 후 재작업이 줄었다.
- 설계 단계에서 **응답 DTO를 기존 패턴으로 고정**했다. → "A를 원했는데 B가 나오는" 왕복이 사라졌다.
- 작업이 추적 가능하게 쪼개져 **리뷰가 쉬웠다.**

이것이 [03장](../이론/03-sdd-명세주도개발.md)에서 말한 **"명확함이 구현에 앞선다"**의 실제 효과입니다.

---

이론 ← [03. SDD](../이론/03-sdd-명세주도개발.md) · 다음 이론 → [04. Kiro의 부가 기능](../이론/04-부가기능.md)
