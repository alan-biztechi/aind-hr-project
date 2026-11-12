---
inclusion: fileMatch
fileMatchPattern: 'src/main/**'
---

# Backend Code Conventions

`src/main/` 아래 백엔드 코드를 작성·수정할 때 따르는 규칙입니다. 아래 규칙은 현재 코드 전체가 예외 없이 지키고 있습니다.
코드를 점검할 때는 이 표의 규칙 번호(C1, C2, …)로 위반을 보고합니다.

| # | 규칙 |
|---|------|
| C1 | 의존성은 생성자 주입만 쓴다. 클래스에 `@RequiredArgsConstructor` + `private final` 필드. `@Autowired` 금지 |
| C2 | 콘솔 출력 금지: `System.out`, `System.err`, `printStackTrace()` |
| C3 | MyBatis 매퍼는 `#{}`만 쓴다. `${}` 금지 (SQL 인젝션) |
| C4 | Mapper XML의 `namespace`는 대응하는 Repository의 전체 클래스명 |
| C5 | Repository 인터페이스에는 `@Mapper` |
| C6 | Service 클래스에는 `@Service`와 `@RequiredArgsConstructor` |
| C7 | Controller는 `@RequestMapping("/v1/...")`와 `@Tag`를 단다 |
| C8 | Controller의 모든 매핑(`@GetMapping` 등)에 `@Operation`과 `produces = MediaType.APPLICATION_JSON_VALUE` |
| C9 | Controller의 public 메서드는 `ResponseEntity<...>`를 반환한다 |
| C10 | 비즈니스 예외는 `CustomException(ErrorCode.XXX)`로 던진다. `new RuntimeException` 금지 |

## 작성 시 참고
- 새 엔드포인트는 같은 Controller의 기존 메서드를 본보기로 삼아 어노테이션 구성을 그대로 따른다.
- 새 에러 상황은 `constant/ErrorCode.java`에 코드를 추가하고 `CustomException`으로 던진다.
