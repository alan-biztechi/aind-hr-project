# 실습 ②. Steering으로 프로젝트 규칙 가르치기

> **이론 선행**: [04. Kiro의 부가 기능](../이론/04-부가기능.md) (Steering 파트)
>
> 실습 ①에서 Spec으로 기능을 추가하며 느꼈을 겁니다 — "응답은 `EmployeeResponse`로", "에러는 `CustomException`으로" 같은 걸 **매번 설명**해야 했습니다.
> Steering은 이런 **프로젝트 고유 규칙을 한 번 적어두고 모든 대화에 자동 적용**하는 기능입니다.

---

## 0. 실습 목표

- 이 프로젝트에서 **"AI가 모르면 제각각으로 만들 규칙"**이 무엇인지 식별한다.
- `.kiro/steering/`에 규칙 파일을 직접 작성한다.
- Steering 적용 전/후로 **같은 요청의 결과가 어떻게 달라지는지** 비교한다.

---

## 1. 왜 이 프로젝트에 Steering이 필요한가

Kiro는 Java·Spring Boot 기본은 이미 압니다. 적을 필요가 없습니다.
문제는 **이 프로젝트만의 결정**입니다. 예를 들어 "직원 등록 기능 만들어줘"라고만 하면 AI는 다음을 제멋대로 고를 수 있습니다.

- 데이터 접근을 JPA로 할까, MyBatis로 할까? → 이 프로젝트는 **MyBatis XML 전용**
- 성공 응답을 뭘로 돌려줄까? → 이 프로젝트는 **`UpdateResponse` 패턴**
- 에러를 어떻게 던질까? → 이 프로젝트는 **`CustomException` + `ErrorCode`**
- 에러 메시지는 영어? 한국어? → 이 프로젝트는 **한국어**

이렇게 **판단이 갈리는 지점**을 Steering에 못 박아두면, 매번 설명하지 않아도 일관된 코드가 나옵니다.

> 💡 핵심 원칙: **"기본 상식은 적지 않는다. 판단이 갈리는 프로젝트 고유 결정만 적는다."**
> (TypeScript 들여쓰기 같은 일반 규칙을 잔뜩 적으면 맥락만 잡아먹고 느려집니다.)

---

## 2. 이 프로젝트에서 Steering으로 담을 규칙

실제 코드를 보고 뽑은 "이 프로젝트 고유 결정"입니다.

| 분류      | 규칙                                                                                    | 근거 (코드)                                       |
| --------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 아키텍처  | `Controller → Service → Repository(@Mapper) → XML Mapper`. JPA 금지, MyBatis XML만 | `EmployeeRepository` + `EmployeeMapper.xml`   |
| 응답 포맷 | 생성/수정/삭제는`UpdateResponse(SuccessFlag.YES, "...성공", id)`                      | `EmployeeService.createEmployee`                |
| 응답 포맷 | 조인이 필요한 조회는 엔티티 대신`*Response` DTO                                       | `EmployeeResponse`                              |
| 에러 처리 | 비즈니스 오류는`throw new CustomException(ErrorCode.XXX)` 만. 컨트롤러 try-catch 금지 | `GlobalExceptionHandler`                        |
| 에러 처리 | 새 오류는`ErrorCode` enum에 `(HttpStatus, "한국어 메시지")`로 추가                  | `ErrorCode`                                     |
| 언어      | 에러·성공·검증 메시지는**한국어**                                               | `ErrorCode`, `@NotBlank(message=...)`         |
| API 규약  | 경로`/v1/<복수형>`, 생성 `201`, 수정 `PUT`, 부분변경 `PATCH`                    | 각 Controller                                     |
| 문서화    | 모든 엔드포인트`@Tag`+`@Operation`, 요청 DTO 필드 `@Schema(description, example)` | `EmployeeController`, `EmployeeCreateRequest` |
| 검증      | 입력 검증은`*Request` DTO의 Bean Validation, 컨트롤러는 `@Valid`만                  | `EmployeeCreateRequest`                         |
| DI        | 필드 주입 금지,`@RequiredArgsConstructor` + `final` 생성자 주입                     | 모든 Controller/Service                           |
| 네이밍    | Mapper`selectXxx/insert/update/delete`, Service `getXxx/createXxx/...`              | Repository, Service                               |

---

## 3. Steering 파일 작성

`.kiro/steering/` 폴더에 Markdown으로 규칙을 둡니다. 하나의 긴 파일보다 **주제별로 쪼개는 것**이 관리하기 좋습니다. 여기서는 2개로 나눕니다.

### 3-1. 프로젝트 구조/기술 규칙 — `.kiro/steering/project.md`

```markdown
---
inclusion: always
---
# AIND HR 프로젝트 규칙

## 기술 스택 (고정)
- Java 17 + Spring Boot 3.2
- 데이터 접근: **MyBatis XML Mapper만 사용** (JPA/Hibernate 금지)
- DB: MySQL 8.x, 컬럼은 snake_case ↔ 자바는 camelCase (map-underscore-to-camel-case 사용)

## 레이어드 구조 (고정)
Controller → Service → Repository(@Mapper 인터페이스) → resources/mapper/*.xml
- Repository는 `@Mapper` 인터페이스, SQL은 XML에만 작성한다.
- MyBatis 매퍼 네임스페이스 = Repository 인터페이스의 FQN.

## 의존성 주입
- 필드 주입(@Autowired) 금지.
- `@RequiredArgsConstructor` + `private final` 생성자 주입만 사용한다.

## 네이밍
- Mapper 메서드: `selectXxx` / `insert` / `update` / `delete`
- Service 메서드: `getXxx` / `createXxx` / `updateXxx` / `deleteXxx`
```

### 3-2. API/응답/에러 규칙 — `.kiro/steering/api-convention.md`

```markdown
---
inclusion: always
---
# API · 응답 · 에러 규약

## 모든 메시지는 한국어
- 에러 메시지, 성공 메시지, 검증 메시지(@NotBlank 등) 전부 한국어로 작성한다.

## REST 규약
- 경로는 `/v1/<복수형 리소스>` (예: `/v1/employees`).
- 생성 성공은 **201 Created**, 전체 수정은 **PUT + 200**, 부분 변경은 **PATCH**.
- 모든 엔드포인트에 `@Tag`(컨트롤러) + `@Operation`(메서드)로 Swagger 문서화한다.

## 요청(Request) DTO
- 입력 검증은 `*Request` DTO의 Bean Validation 애너테이션으로 한다.
- 컨트롤러에서는 `@Valid`만 붙이고, 검증 로직을 직접 작성하지 않는다.
- 요청 필드에는 `@Schema(description = "...", example = "...")`를 단다.

## 응답(Response)
- 생성/수정/삭제 결과는 `UpdateResponse(SuccessFlag.YES, "...성공", id)`를 반환한다.
- 단순 성공/실패 메시지는 `ResultResponse`를 사용한다.
- 조회 중 부서명 등 **조인 결과가 필요하면 엔티티 대신 `*Response` DTO**를 반환한다.

## 에러 처리
- 비즈니스 오류는 `throw new CustomException(ErrorCode.XXX)`로만 발생시킨다.
- 컨트롤러/서비스에서 try-catch로 직접 응답을 만들지 않는다 (전역 `GlobalExceptionHandler`가 처리).
- 새 오류 유형은 `ErrorCode` enum에 `(HttpStatus, "한국어 메시지")` 형태로 추가한다.
```

> 두 파일 모두 `inclusion: always`라 모든 대화에 자동 적용됩니다.
> 특정 파일을 열 때만 적용하고 싶다면 `inclusion: fileMatch` + `fileMatchPattern`을 쓸 수 있습니다. (이론 04장 참고)

---

## 4. Steering이 적용되는지 확인하기

> ℹ️ **왜 "적용 전/후 비교"를 하지 않나?**
> Kiro는 요청을 처리하기 전에 **주변 코드를 먼저 읽고 패턴을 모방**합니다. 그래서 기존 패턴이 뚜렷한 수정 작업은 Steering이 없어도 비슷한 결과가 나와, 전/후 차이가 잘 드러나지 않습니다.
> Steering의 진짜 가치는 **참고할 코드가 없는 신규 영역**이나 **팀이 커졌을 때 일관성을 보장**하는 데 있습니다.
> 그래서 이 실습은 "효과 대조" 대신 **"규칙이 실제로 깔리는지 확인"**에 집중합니다.

### 테스트: 규칙과 충돌하는 요청 던지기

위 3절의 steering 파일 2개를 `.kiro/steering/`에 만든 상태로 **새 세션**을 열고, 일부러 **규칙과 충돌하는 요청**을 하나 던집니다.

```text
직원 삭제 기능 만들어줘 에러 메시지는 영어로
```

- `api-convention.md`에 **"모든 메시지는 한국어"**가 있는데, 요청은 "에러 메시지는 영어로"입니다. → **직접 충돌**

### 무엇을 보나

응답 상단에 **`Included Steering`** 표시가 뜨고, Kiro는 바로 코드를 만들지 않고 **충돌을 먼저 짚으며 되묻습니다.** 실제 반응 예:

> 요청에 모순이 하나 있어서 먼저 짚고 갈게요.
> 프로젝트 규칙(api-convention 스티어링)에 따르면 모든 메시지는 한국어로 작성하도록 되어 있습니다.
> 그런데 이번 요청은 "에러 메시지는 영어로"라고 하셨어요. 스티어링 규칙과 직접 충돌합니다.
>
> 어느 쪽으로 진행할지 결정해 주세요:
> 1. 규칙대로 전부 한국어 (스티어링 준수) — 권장
> 2. 이번 직원 삭제 기능의 에러 메시지만 예외적으로 영어로 (요청 그대로)
> 3. 스티어링 규칙 자체를 "에러 메시지는 영어"로 바꾸고 진행

여기서 세 가지를 동시에 확인할 수 있습니다.

- **`Included Steering` 배지** → steering이 **자동으로 맥락에 깔렸다**는 증거 (매번 설명 안 함)
- **충돌 감지** → Kiro가 멋대로 진행하지 않고 **규칙과 요청의 모순을 먼저 알려줌**
- **선택지 제시** → Steering은 강제 규칙이 아니라 **기본 지침**이라, 더 구체적인 지시를 주면 그 요청이 우선됨

> 💡 포인트: Steering은 "매 대화에 깔리는 기본값"입니다. 특정 요청이 규칙과 부딪히면 Kiro가 짚어주고, 사용자가 명시적으로 선택하면 그대로 진행합니다.

---

## 5. 완료 체크리스트

- [ ] `.kiro/steering/project.md`, `.kiro/steering/api-convention.md` 2개를 만들었다.
- [ ] 두 파일 모두 `inclusion: always` front-matter가 있다.
- [ ] 충돌 요청을 던졌을 때 응답에 **`Included Steering`** 표시가 떴다.
- [ ] Kiro가 규칙과 요청의 **충돌을 먼저 짚고 선택지를 제시**하는 것을 확인했다.

---

## 6. 돌아보기

- Steering은 **"AI를 위한 인수인계 문서"** 입니다. 새 팀원에게 "우리 프로젝트는 이렇게 합니다"라고 알려주는 것과 같습니다.
- **판단이 갈리는 지점만** 적는 것이 핵심입니다. 일반 상식을 적으면 오히려 방해가 됩니다.
- Kiro는 기존 코드를 모방하므로, 패턴이 뚜렷한 곳에서는 Steering 없이도 비슷하게 나옵니다. Steering이 **진짜 힘을 발휘하는 건 참고할 코드가 없는 신규 영역, 그리고 팀 전체의 일관성**이 필요할 때입니다.
- Spec(실습 ①)과 함께 쓰면 더 강력합니다 — 설계·구현이 매번 프로젝트 규칙을 따르니까요.

---

이론 ← [04. Kiro의 부가 기능](../이론/04-부가기능.md) · 다음 실습 → [실습 ③ Agent로 테스트 케이스 엑셀 정리](./03-agent.md)
