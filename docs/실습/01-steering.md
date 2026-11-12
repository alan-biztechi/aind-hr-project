# 실습 ①. Steering — 개발 표준 설정

> **과정**: 기본
> **소요 시간**: 약 25분
> **난이도**: ★★☆☆☆
> **실습 목표**: 기존 백엔드 구조를 Kiro로 분석해 프로젝트 맥락을 파악하고, 앞으로의 개발 규칙(스택/컨벤션/보안)을 **Steering**으로 고정한다.

---

## 0. 이 실습에서 배우는 것

- Steering이 무엇이고 왜 쓰는지 (모든 대화에 자동으로 깔리는 공통 규칙)
- 기존 백엔드(Spring Boot + MyBatis)를 Kiro에게 분석시키는 법
- 개발 규칙을 `.kiro/steering/*.md`로 정의해 **모든 대화에 자동 적용**되게 만드는 법

> 💡 **왜 Steering인가**: "매번 같은 규칙을 프롬프트에 복붙"하는 대신, 한 번 적어두면 Kiro가 모든 대화에서 알아서 따릅니다. 팀 공통 컨벤션·보안 규칙·기술 스택을 고정하는 데 가장 효과적입니다.

---

## 1. Steering이란

Steering은 **모든(또는 일부) 대화에 자동으로 포함되는 규칙 문서**입니다. 위치는 `.kiro/steering/*.md`.

포함 방식(파일 상단 front-matter로 지정):

| 방식 | front-matter | 언제 포함되나 |
|------|--------------|----------------|
| 항상 | `inclusion: always` (기본값) | 모든 대화 |
| 조건부 | `inclusion: fileMatch` + `fileMatchPattern: 'README*'` | 해당 패턴 파일이 대화에 들어올 때 |
| 수동 | `inclusion: manual` | 사용자가 `#파일명`으로 직접 넣을 때 |
| 자동 | `inclusion: auto` + `description` | 사용자 요청이 description과 맞을 때 |

> 💡 이 저장소에는 **이미 3개의 Steering이 적용**되어 있습니다. 직접 확인해 보세요.

이 프로젝트의 기존 Steering (`.kiro/steering/`):

| 파일 | 역할 |
|------|------|
| `engineering-rules.md` | 기술 스택 고정(Java 17/Spring Boot 3.2.5/MyBatis, React 19/TS/Vite), 빌드·테스트 명령, 코딩 규율 |
| `architecture-rules.md` | 아키텍처 리뷰 기준 — 모듈 경계, 트랜잭션/일관성, 심각도 정의 |
| `security-rules.md` | 보안 규칙 — 비밀정보 노출 금지, "프로덕션" 정의, 파괴적 명령 통제 (**우선순위 최상위**) |

> ⚠️ **규칙 간 우선순위**: 이 프로젝트는 `security-rules.md` → `architecture-rules.md` → `engineering-rules.md` 순으로 우선합니다. 규칙이 서로 충돌하면 보안 규칙이 이깁니다. (각 파일 상단에 명시돼 있음)

---

## 2. 기존 백엔드 분석 (Kiro 활용)

Steering을 잘 쓰려면 먼저 "지금 코드가 어떤 패턴인지"를 알아야 합니다. Kiro에게 분석을 시켜봅니다.

Kiro 채팅에 그대로 입력:

```text
이 백엔드(src/main/java/com/aind/hr)의 구조를 분석해줘.
- 레이어 구성(controller / service / repository / mapper XML)과 호출 흐름
- 응답 DTO 패턴 (엔티티 vs *Response)
- 에러 처리 규약 (ErrorCode, CustomException, GlobalExceptionHandler)
각 항목을 실제 파일 경로와 함께 근거로 짚어줘.
```

실제로 이 프로젝트는 아래 패턴을 따릅니다 (Kiro 답변과 대조해 보세요):

| 레이어 | 위치 | 예시 |
|--------|------|------|
| Controller | `controller/*.java` | `EmployeeController` → `GET /v1/employees` |
| Service | `service/*.java` | `EmployeeService.getEmployeeList()` |
| Mapper 인터페이스 | `repository/*.java` (`@Mapper`) | `EmployeeRepository.selectAllWithDepartment()` |
| Mapper XML | `resources/mapper/*.xml` | `EmployeeMapper.xml` |
| 응답 DTO | `model/response/*.java` | 조인 조회는 `EmployeeResponse`(부서명 포함) |
| 에러 규약 | `exception/`, `constant/ErrorCode.java` | `CustomException` → `GlobalExceptionHandler`가 `{success, message}`로 변환 |

> 💡 **실무 팁 — 먼저 코드를 "읽히고" 규칙을 만들어라**: 규칙을 추측으로 쓰면 코드와 어긋납니다. 실제 코드를 Kiro에게 분석시킨 결과를 바탕으로 규칙을 적으면, 규칙이 "이 프로젝트의 진짜 컨벤션"이 됩니다.

---

## 3. Steering 규칙 작성

### 3-1. 기존 규칙 열어보기

먼저 이미 있는 규칙을 읽어 형식을 익힙니다.

```text
.kiro/steering/engineering-rules.md 를 열어서 어떤 규칙이 있는지 요약해줘.
```

### 3-2. 새 규칙 추가해 보기 (연습)

예를 들어 "프론트엔드 API 호출 규칙"을 새 Steering으로 만들어 봅니다. `.kiro/steering/frontend-api.md`:

```markdown
---
inclusion: fileMatch
fileMatchPattern: 'frontend/**'
---

# 프론트엔드 API 호출 규칙

- 모든 HTTP 요청은 `src/api/client.ts`의 `apiClient`(axios 인스턴스)만 사용한다.
- 서버 상태는 TanStack Query 훅(`src/hooks/*.ts`)으로 관리하고,
  컴포넌트에서 직접 axios를 호출하지 않는다.
- 백엔드 DTO 타입은 `src/types/api.ts`에 정의된 타입을 재사용한다(중복 선언 금지).
- 에러 메시지는 client.ts 인터셉터가 정규화한 Error.message 를 그대로 노출한다.
```

> 💡 위 규칙은 이 프로젝트의 실제 프론트엔드 구조(`api/client.ts`, `hooks/`, `types/api.ts`)에 맞춘 것입니다. `fileMatch`로 지정해 `frontend/` 작업 때만 자동 포함되게 했습니다.

> ⚠️ **always를 남발하지 마라**: 모든 규칙을 `inclusion: always`로 두면 대화 컨텍스트가 규칙으로 가득 차고, 프론트 전용 규칙이 백엔드 작업에도 끼어듭니다. **범위가 좁은 규칙은 `fileMatch`로** 거세요.

---

## 4. 적용 확인

규칙이 실제로 반영되는지 확인합니다.

```text
#frontend/src/api/employees.ts 에 새 API 함수를 추가하려면 어떤 규칙을 지켜야 해?
```

Kiro가 "apiClient 사용", "types/api.ts 타입 재사용" 등 **Steering에 적은 규칙을 근거로 답하면** 적용된 것입니다.

- [ ] 기존 Steering 3개의 역할을 파악했다
- [ ] 새 규칙 파일을 만들거나 기존 규칙을 수정했다
- [ ] 새 대화에서 규칙이 실제로 반영되는 것을 확인했다

---

## 5. 완료 체크리스트

- [ ] 백엔드 레이어 구조를 Kiro로 분석했다
- [ ] `.kiro/steering/`의 기존 규칙과 우선순위를 이해했다
- [ ] 개발 규칙을 Steering으로 정의(또는 수정)했다
- [ ] 규칙이 대화에 자동 적용되는 것을 확인했다

---

## 6. 흔한 에러 & 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 규칙을 적었는데 대화에 반영 안 됨 | front-matter `inclusion`을 잘못 지정 | `always`로 두거나, `fileMatch`면 해당 파일을 대화에 포함했는지 확인 |
| 규칙이 서로 모순 | 우선순위 미정의 | 이 프로젝트 규칙대로 security → architecture → engineering 순서 적용 |
| 컨텍스트가 규칙으로 과포화 | 전부 `always` | 범위가 좁은 규칙은 `fileMatch`/`manual`로 전환 |

---

## 7. 돌아보기

- Steering은 **"프로젝트 전체에 깔리는 규칙"**입니다. 특정 역할(리뷰어 등)을 **독립 실행**시키려면 Steering이 아니라 **Agent**가 필요합니다 — 이는 실습 ③(SA Orchestrator)에서 다룹니다.
- 다음 실습(②)에서는 이 규칙들이 깔린 상태에서 **Spec**으로 React 화면을 명세 주도로 설계·구현합니다.

---

이전 실습 ← [실습 ⓪ 시작하기](./00-시작하기.md) · 다음 실습 → [실습 ② Specs](./02-specs.md)
