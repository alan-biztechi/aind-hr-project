# 실습 ④. Skills — 버그 수정 및 회귀 테스트

> **과정**: 실무 활용
> **소요 시간**: 약 30분
> **AI 요청 횟수**: 약 3~4회
> **난이도**: ★★★☆☆
> **실습 목표**: 출퇴근 상태 처리 버그를 수정하고, 범용 회귀 검증 **Skill을 실행한 뒤 이 프로젝트에 맞게 개선**한다.

---

## 0. 이 실습에서 배우는 것

- 실제 버그를 **재현 → 원인 분석 → 수정 → 회귀 검증**하는 흐름
- 반복되는 검증 절차를 **Skill**(이름 붙인 재사용 절차)로 쓰고, 프로젝트에 맞게 고치기
- "수정했는데 다른 게 깨지지 않았는지"를 확인하는 습관

> 💡 **왜 Skill인가**: "이 기능 고치고 나면 꼭 이 순서로 확인해" 같은 절차는 매번 똑같습니다. 한 번 Skill로 만들어 두면 다음 수정 때 `/api-regression` 한 줄로 재사용됩니다.

---

## 1. 버그 — 조퇴 상태가 저장 안 됨 (실제 결함)

`AttendanceService.checkOut()`은 18시 이전 퇴근이면 `status="EARLY_LEAVE"`로 세팅합니다. **그런데 저장이 안 됩니다.**

실제 코드를 보면:

```java
// AttendanceService.checkOut()
if (checkOut.isBefore(LocalTime.of(18, 0))) {
    attendance.setStatus("EARLY_LEAVE");          // ← 객체에만 세팅
    attendanceRepository.updateCheckOut(id, checkOut);
} else {
    attendanceRepository.updateCheckOut(id, checkOut);
}
```

```xml
<!-- AttendanceMapper.xml -->
<update id="updateCheckOut">
    UPDATE attendance
    SET check_out = #{checkOut}   <!-- ← status를 UPDATE 안 함! -->
    WHERE id = #{id}
</update>
```

**문제**: `setStatus("EARLY_LEAVE")`로 자바 객체 필드만 바꾸고, 정작 UPDATE 쿼리는 `check_out`만 건드립니다. 그래서 **조퇴해도 DB의 status는 그대로**입니다. (게다가 if/else 양쪽이 같은 쿼리를 호출해 분기 의미도 없음)

### 재현 (그대로 복사해서 실행)

초기 데이터에는 `2026-03-16` 등 과거 날짜 기록이 있습니다. 새 기록으로 재현하기 위해 **초기 데이터에 없는 날짜**(`2026-12-01`)를 사용합니다.

> ⚠️ 출퇴근 테이블에는 `(employee_id, work_date)` **UNIQUE 제약**이 있습니다. 같은 직원·날짜로 출근을 두 번 등록하면 실패(중복 출근 오류)하므로, **재실행할 때는 날짜를 바꾸세요** (예: `2026-12-02`).

```bash
# 1) 출근 등록 — 응답의 id를 변수에 저장 (jq 필요)
ID=$(curl -s -X POST http://localhost:8080/v1/attendances/check-in \
  -H 'Content-Type: application/json' \
  -d '{"employeeId":1,"workDate":"2026-12-01","checkIn":"09:00:00"}' | jq -r '.id')
echo "생성된 출근 id = $ID"

# 2) 이른 퇴근 (17:00) → EARLY_LEAVE 기대
curl -s -X PATCH "http://localhost:8080/v1/attendances/$ID/check-out?checkOut=17:00:00" | jq .

# 3) 조회 → status가 EARLY_LEAVE 여야 하는데 그대로임(NORMAL)
curl -s http://localhost:8080/v1/attendances/date/2026-12-01 | jq '.[0] | {id, status, checkIn, checkOut}'
```

**버그가 있을 때의 출력 (이렇게 나오면 재현 성공):**

```jsonc
{
  "id": 51,                // 환경에 따라 다름
  "status": "NORMAL",      // ← 17:00 퇴근인데 EARLY_LEAVE가 아님 (버그!)
  "checkIn": "09:00:00",
  "checkOut": "17:00:00"   // ← 퇴근 시각은 저장됨 (status만 누락)
}
```

> 💡 **포인트**: `checkOut`은 저장되는데 `status`만 안 바뀝니다. "일부 필드만 조용히 유실"되는 버그는 에러가 나지 않아 발견이 어렵습니다.
>
> 💡 시간 형식은 `HH:mm:ss`로 넣으면 안전합니다. 출근 요청은 JSON 본문(`AttendanceCheckInRequest`), 퇴근은 쿼리 파라미터(`checkOut`)로 받습니다.
>
> ⚠️ 재현 후 **실습용 로컬 DB에만** 데이터가 남습니다. 공유 DB에서는 실행하지 마세요.

---

## 2. 원인 분석 (Kiro 활용)

```text
AttendanceService.checkOut에서 EARLY_LEAVE를 setStatus 하는데 조회하면 반영이 안 돼.
updateCheckOut 쿼리와 함께 원인을 분석하고, 근거를 파일:라인으로 짚어줘.
```

예상 결론: `updateCheckOut`이 `status` 컬럼을 UPDATE 목록에 포함하지 않음.

---

## 3. 수정

### 3-1. Mapper 쿼리에 status 포함

```xml
<update id="updateCheckOut">
    UPDATE attendance
    SET check_out = #{checkOut},
        status    = #{status}
    WHERE id = #{id}
</update>
```

### 3-2. 인터페이스 시그니처에 status 추가

```java
int updateCheckOut(@Param("id") Integer id,
                   @Param("checkOut") java.time.LocalTime checkOut,
                   @Param("status") String status);
```

> ⚠️ 이 파일은 `LocalTime`을 import하지 않고 `java.time.LocalTime`으로 씁니다. `LocalTime`만 쓰면 컴파일 에러가 납니다.

### 3-3. Service에서 status 전달 + 정상 퇴근도 상태 일관화

```java
public UpdateResponse checkOut(Integer id, LocalTime checkOut) {
    Attendance attendance = Optional.ofNullable(attendanceRepository.selectById(id))
            .orElseThrow(() -> new CustomException(ErrorCode.ATTENDANCE_NOT_FOUND));

    String status = checkOut.isBefore(LocalTime.of(18, 0)) ? "EARLY_LEAVE" : attendance.getStatus();
    attendanceRepository.updateCheckOut(id, checkOut, status);
    return new UpdateResponse(SuccessFlag.YES, "퇴근 등록 성공", id);
}
```

> 💡 **실무 팁 — "객체만 바꾸고 저장 안 함"은 흔한 버그**: 특히 MyBatis처럼 명시적 UPDATE를 쓸 때, 세터로 바꾼 필드가 쿼리 SET 목록에 없으면 조용히 유실됩니다. "세터로 바꾼 필드 = UPDATE SET 목록"인지 항상 대조하세요.

---

## 4. 회귀 검증 — 샘플 Skill 쓰고 개선하기

버그를 고친 뒤 확인하는 절차는 매번 비슷합니다. 이런 **반복되는 절차**를 Skill로 저장해 두고 씁니다. 저장소에 범용 샘플 Skill이 있습니다. 먼저 써 보고, 이 프로젝트에 맞게 고칩니다.

### 4-1. 샘플 열어 보기 (AI 사용 없음)

`.kiro/skills/api-regression/SKILL.md`를 엽니다. 특정 버그가 아니라 **백엔드를 고친 뒤 언제나** 쓰는 회귀 검증 절차입니다.

| 부분 | 내용 |
|------|------|
| 맨 위 `---` 사이 (frontmatter) | `name`(슬래시 명령 이름)과 `description`(언제 쓰는지). Kiro는 평소에 이 두 줄만 읽고, 요청이 `description`과 맞을 때 본문을 불러옵니다. |
| 절차 | 1. 컴파일 → 2. 변경 범위(`src/`의 `git diff`) → 3. 고친 기능 → 4. 인접 기능 스모크(직원 15·부서 5·휴가 10) |
| 보고 형식 | 단계별 통과/실패와 근거를 표로 |

> 💡 Skill은 JSON이 아니라 **폴더 + `SKILL.md`** 형식입니다. 위치는 `.kiro/skills/<이름>/SKILL.md`이고, 폴더 이름과 `name`을 같게 둡니다.

> 💡 **좋은 Skill은 범용입니다**: "조퇴 버그 검증"처럼 버그 하나에 묶으면 그 버그를 고친 뒤엔 다시 쓸 일이 없습니다. 이 샘플은 어떤 백엔드 수정에도 쓸 수 있게 만들고, 무엇을 고쳤는지는 **실행할 때 알려 주는** 구조입니다.

### 4-2. 실행해 보기 (AI 1회)

3절에서 수정한 뒤 **백엔드를 재시작**(`Ctrl+C` 후 `./mvnw spring-boot:run`)하고, 기본 에이전트 채팅에 입력합니다.

```text
/api-regression 출퇴근 퇴근 처리를 고쳤어. 18시 전에 퇴근하면 status가 EARLY_LEAVE로 저장돼야 해. 테스트 날짜는 2026-12-02를 써줘.
```

Kiro가 명령 실행이나 데이터 생성(출근 등록) 승인을 물으면 허용합니다. **기대 결과**: 4단계 보고 표가 나오고 모두 통과입니다.

| 단계 | 기대 |
|------|------|
| 1. 컴파일 | 통과 |
| 2. 변경 범위 | `AttendanceService.java`, `AttendanceRepository.java`, `AttendanceMapper.xml` 3개 |
| 3. 고친 기능 | 17:00 퇴근 → `EARLY_LEAVE` |
| 4. 인접 기능 | 직원 15, 부서 5, 휴가 10 |

> 💡 슬래시 명령 대신 "회귀 검증해줘"라고 해도, 요청이 `description`과 맞으면 Kiro가 이 Skill을 불러옵니다.

### 4-3. 프로젝트에 맞게 개선하기 (AI 1회)

범용 샘플이라 **이 프로젝트의 출퇴근 기능만의 규칙**은 모릅니다. 이번 수정에서 놓치기 쉬운 두 가지를 Skill에 넣습니다.

- **같은 날짜로 다시 출근하면 실패합니다.** `attendance` 테이블은 `(employee_id, work_date)`가 UNIQUE입니다. 날짜를 정하지 않으면 두 번째 실행부터 출근 등록이 실패합니다.
- **고치다 지각이 덮어써질 수 있습니다.** 3-3에서 정상 퇴근이면 기존 상태(`attendance.getStatus()`)를 그대로 저장하도록 했습니다. 이걸 잘못 고치면 지각(`LATE`)이 `NORMAL`로 바뀌는데, 샘플의 "고친 기능" 확인(조퇴)으로는 잡히지 않습니다.

`SKILL.md`의 `## 실패 시` **바로 위**에 아래 절을 추가합니다.

```markdown
### 5. 프로젝트 규칙 — 출퇴근을 고쳤을 때
- `attendance`는 `(employee_id, work_date)`가 UNIQUE다. 출근을 등록하기 전에 **아직 쓰지 않은 날짜**를 사용자에게 확인한다.
- 조퇴 확인과 함께 **지각 후 정상 퇴근**도 확인한다. 출근 09:30 → 퇴근 18:30이면 `status`가 `LATE`로 남아야 한다.
- 같은 날짜에 두 건을 만들 때는 **서로 다른 직원**을 쓴다. 같은 직원이면 UNIQUE 제약으로 두 번째 출근이 실패한다.
- 결과는 `GET /v1/attendances/date/<날짜>`로 확인한다.
```

보고 형식 표에도 한 줄을 추가합니다.

```markdown
| 5. 프로젝트 규칙 | 통과 / 실패 / 해당 없음 | 실제 값 |
```

저장한 뒤 **새 대화**에서 다시 실행합니다. 이번에는 날짜를 알려 주지 않습니다.

```text
/api-regression 출퇴근 퇴근 처리를 고쳤어. 18시 전에 퇴근하면 status가 EARLY_LEAVE로 저장돼야 해.
```

**기대 결과**:
- 출근을 등록하기 전에 Kiro가 **쓸 날짜를 확인합니다**. 아직 쓰지 않은 날짜(예: `2026-12-03`)를 알려 줍니다. Kiro가 날짜를 먼저 제안하며 확인을 구할 수도 있는데, 그것도 정상입니다.
- 보고 표에 **5. 프로젝트 규칙** 행이 생기고, 조퇴 `EARLY_LEAVE`와 지각 후 정상 퇴근 `LATE`가 **서로 다른 직원으로** 확인됩니다.
- 2단계 변경 범위는 이번에도 3개 파일입니다. 방금 고친 `SKILL.md`는 `src/` 밖이라 대상이 아닙니다.

> 💡 범용 절차(1~4)는 그대로 두고, 프로젝트 고유의 규칙만 덧붙였습니다. 다른 프로젝트에 가져갈 때는 5절만 그 프로젝트의 규칙으로 바꾸면 됩니다.

**되돌리기** (샘플로 돌아가려면)

```bash
git checkout -- .kiro/skills/api-regression/SKILL.md
```

---

## 5. 완료 체크리스트

- [ ] 버그를 재현했다 (조퇴 status 미반영)
- [ ] 원인을 코드 근거(`updateCheckOut`에 status 누락)로 찾았다
- [ ] 쿼리/인터페이스/서비스 3곳을 수정했다
- [ ] 조퇴 시 status가 EARLY_LEAVE로 저장된다
- [ ] 인접 기능에 회귀가 없다
- [ ] 샘플 Skill을 `/api-regression`으로 실행해 4단계가 모두 통과했다
- [ ] 프로젝트 규칙(5절)을 추가했고, Kiro가 날짜를 확인한 뒤 지각 `LATE` 유지까지 확인했다

---

## 6. 흔한 에러 & 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `Parameter 'status' not found` | 인터페이스에 `@Param("status")` 누락 | 3개 파라미터 모두 `@Param` 부여 |
| status가 여전히 안 바뀜 | XML SET 목록에 `status` 안 넣음 | `SET check_out=..., status=...` 확인 |
| 정상 퇴근인데 status가 null | else 분기에서 status 미전달 | 기존 status 유지하도록 전달 |
| `/api-regression`이 목록에 없음 | 폴더 이름과 `name` 불일치, frontmatter(`---`) 누락 | `.kiro/skills/api-regression/SKILL.md` 경로와 첫 줄 `---` 확인 |
| 스모크 건수가 15·5·10이 아님 | 실습 중 데이터를 추가함 | 건수가 아니라 "수정 전과 같은지"로 판단 |
| 출근 등록 실패 (중복 출근) | 같은 직원·같은 날짜를 다시 씀 (UNIQUE 제약) | 날짜를 바꾸거나 다른 직원으로 실행 |

---

## 7. 돌아보기

- 버그 수정의 진짜 완성은 **회귀 검증**입니다. 그리고 그 절차를 **Skill로 자산화**하면 팀 전체가 같은 품질로 재사용합니다.
- **다른 프로젝트 적용**: "재현 → 원인(파일:라인) → 수정 → 회귀 검증" 4단계와 그 Skill화는 어떤 스택에서도 동일하게 통합니다.
- [실습 ⑤ Hooks](./05-hooks.md)에서는 컴파일·타입 체크 같은 **가벼운 검증**을 이벤트에 묶어 자동 실행합니다. 이 실습의 회귀 검증은 서버 기동과 데이터가 필요해서 Hook 대신 Skill로 수동 호출하고, 필요하면 Spec 작업 완료 시점(`PostTaskExec`)에 연결할 수 있습니다.

---

이전 실습 ← [실습 ③ SA Orchestrator](./03-sa-orchestrator.md) · 다음 실습 → [실습 ⑤ Hooks](./05-hooks.md)
