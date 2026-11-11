# 실습 ⑥. Skills — 버그 수정 및 회귀 테스트

> **과정**: 실무 활용
> **소요 시간**: 약 35분
> **난이도**: ★★★☆☆
> **실습 목표**: 출퇴근 상태 처리 버그를 수정하고, "버그 수정 → 회귀 검증" 절차를 **Skill로 자산화**해 재사용한다.

---

## 0. 이 실습에서 배우는 것

- 실제 버그를 **재현 → 원인 분석 → 수정 → 회귀 검증**하는 흐름
- 반복되는 검증 절차를 **Skill**(이름 붙인 재사용 절차)로 만들기
- "수정했는데 다른 게 깨지지 않았는지"를 확인하는 습관

> 💡 **왜 Skill인가**: "이 기능 고치고 나면 꼭 이 순서로 확인해" 같은 절차는 매번 똑같습니다. 한 번 Skill로 만들어 두면 다음 버그 때 "회귀 검증 Skill 돌려줘" 한마디로 재사용됩니다.

---

## 1. 버그 ① — 조퇴 상태가 저장 안 됨 (실제 결함)

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
                   @Param("checkOut") LocalTime checkOut,
                   @Param("status") String status);
```

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

## 3-보너스. 버그 ② — 모든 예외를 "중복"으로 뭉갬 (함께 보기)

`checkIn()`의 `catch(Exception e)`가 **NPE·커넥션 오류까지 전부** "중복 출근"으로 오분류합니다.

```java
try {
    cnt = attendanceRepository.insert(attendance);
} catch (Exception e) {                 // ← 너무 광범위
    throw new CustomException(ErrorCode.DUPLICATE_ATTENDANCE);
}
```

> ⚠️ **광범위 catch는 장애를 숨깁니다.** 중복 키만 잡으려면 `org.springframework.dao.DuplicateKeyException`만 중복으로 매핑하고, 나머지는 원인을 보존해 재던지고 로깅하세요. (이 수정은 선택 과제로 남겨둡니다 — 실습 ⑤ 리뷰에서 지적된 항목과 연결됩니다.)

---

## 4. 회귀 검증 + Skill로 자산화

수정 후, 깨진 게 없는지 **같은 절차로** 확인합니다. **백엔드를 재시작**(`Ctrl+C` 후 `./mvnw spring-boot:run`)한 뒤 진행하세요. 수정 사항은 재시작해야 반영됩니다.

아래는 3가지 경우를 한 번에 검증합니다. 직원 2·3번, 날짜 `2026-12-02`를 사용합니다 (앞 재현에서 쓰지 않은 값).

```bash
BASE=http://localhost:8080/v1/attendances

# [A] 조퇴 → EARLY_LEAVE 로 저장되는가 (버그 수정 확인)
A=$(curl -s -X POST $BASE/check-in -H 'Content-Type: application/json' \
  -d '{"employeeId":2,"workDate":"2026-12-02","checkIn":"08:50:00"}' | jq -r '.id')
curl -s -X PATCH "$BASE/$A/check-out?checkOut=17:00:00" > /dev/null

# [B] 지각 후 정상 퇴근 → LATE 가 유지되는가 (회귀 확인: 기존 status를 덮어쓰지 않아야 함)
B=$(curl -s -X POST $BASE/check-in -H 'Content-Type: application/json' \
  -d '{"employeeId":3,"workDate":"2026-12-02","checkIn":"09:30:00"}' | jq -r '.id')
curl -s -X PATCH "$BASE/$B/check-out?checkOut=18:30:00" > /dev/null

# 결과 확인
curl -s $BASE/date/2026-12-02 | jq '.[] | {employeeId, status, checkIn, checkOut}'

# [C] 인접 기능 — 직원 목록이 그대로 15명인가
curl -s http://localhost:8080/v1/employees | jq 'length'
```

**수정이 올바를 때의 기대 출력:**

```jsonc
{ "employeeId": 2, "status": "EARLY_LEAVE", "checkIn": "08:50:00", "checkOut": "17:00:00" }  // [A] 수정됨
{ "employeeId": 3, "status": "LATE",        "checkIn": "09:30:00", "checkOut": "18:30:00" }  // [B] 유지됨
15                                                                                            // [C] 회귀 없음
```

| 결과 | 의미 |
|------|------|
| [A]가 `NORMAL` | 수정이 반영 안 됨 → 백엔드 재시작 여부, 매퍼 `SET status` 확인 |
| [B]가 `NORMAL`/`null` | 정상 퇴근이 기존 status를 덮어씀 → 서비스에서 `attendance.getStatus()`를 전달했는지 확인 |
| [C]가 15가 아님 | 인접 기능 회귀 → 변경 범위를 되짚기 |

### 이 절차를 Skill로 저장

위 [A][B][C] 절차를 Skill로 만들어 두면, 다음에 출퇴근 관련 수정 때 "회귀 검증 Skill 실행해줘" 한마디로 재사용됩니다. Kiro 채팅에 입력:

```text
방금 한 출퇴근 회귀 검증 절차([A] 조퇴, [B] 지각 후 정상 퇴근, [C] 직원 목록)를
Skill로 만들어줘. 이름은 attendance-regression.
- 언제 쓰는지(출퇴근 로직 수정 후), 절차, 기대 결과를 포함해줘.
- 날짜는 실행할 때마다 겹치지 않게 바꾸도록 안내해줘 (UNIQUE 제약 때문).
```

Skill 파일은 보통 `.kiro/skills/attendance-regression/SKILL.md`에 만들어지며, 대략 이런 모양입니다.

```markdown
---
name: attendance-regression
description: 출퇴근(AttendanceService/Mapper) 수정 후 조퇴·지각·인접 기능 회귀를 검증한다. 출퇴근 로직을 고친 직후에 사용.
---

# 출퇴근 회귀 검증

## 전제
- 로컬 백엔드 기동 (`./mvnw spring-boot:run`), 수정 반영을 위해 재시작 완료
- (employee_id, work_date) UNIQUE → 실행마다 새 날짜 사용

## 절차
1. 직원 A 출근(08:50) → 17:00 퇴근 → 기대 status = EARLY_LEAVE
2. 직원 B 출근(09:30) → 18:30 퇴근 → 기대 status = LATE (유지)
3. GET /v1/employees 건수 = 15 (인접 기능 무회귀)

## 실패 시
- A 실패: updateCheckOut SET 절에 status 포함 여부 확인
- B 실패: 서비스가 기존 status를 전달하는지 확인
```

> ⚠️ Skill 파일 위치·형식은 Kiro 버전에 따라 다를 수 있으니, Kiro가 생성한 결과를 우선하세요. 위 예시는 "무엇을 담아야 하는지" 기준입니다.

> 💡 **실무 팁 — 회귀 테스트는 "수정한 것 + 인접한 것" 둘 다**: 버그가 고쳐졌는지(조퇴 반영)만 보지 말고, **건드린 코드 주변**(출퇴근 조회, 목록)이 멀쩡한지도 확인해야 진짜 회귀 검증입니다.

---

## 5. 완료 체크리스트

- [ ] 버그 ①을 재현했다 (조퇴 status 미반영)
- [ ] 원인을 코드 근거(`updateCheckOut`에 status 누락)로 찾았다
- [ ] 쿼리/인터페이스/서비스 3곳을 수정했다
- [ ] 조퇴 시 status가 EARLY_LEAVE로 저장된다
- [ ] 인접 기능에 회귀가 없다
- [ ] 회귀 검증 절차를 Skill로 저장했다

---

## 6. 흔한 에러 & 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `Parameter 'status' not found` | 인터페이스에 `@Param("status")` 누락 | 3개 파라미터 모두 `@Param` 부여 |
| status가 여전히 안 바뀜 | XML SET 목록에 `status` 안 넣음 | `SET check_out=..., status=...` 확인 |
| 정상 퇴근인데 status가 null | else 분기에서 status 미전달 | 기존 status 유지하도록 전달 |

---

## 7. 돌아보기

- 버그 수정의 진짜 완성은 **회귀 검증**입니다. 그리고 그 절차를 **Skill로 자산화**하면 팀 전체가 같은 품질로 재사용합니다.
- **다른 프로젝트 적용**: "재현 → 원인(파일:라인) → 수정 → 회귀 검증" 4단계와 그 Skill화는 어떤 스택에서도 동일하게 통합니다.
- [실습 ⑧ Hooks](./08-hooks.md)에서는 컴파일·타입 체크 같은 **가벼운 검증**을 이벤트에 묶어 자동 실행합니다. 이 실습의 회귀 검증은 서버 기동과 데이터가 필요해서 Hook 대신 Skill로 수동 호출하고, 필요하면 Spec 작업 완료 시점(`PostTaskExec`)에 연결할 수 있습니다.

---

이전 실습 ← [실습 ⑤ Reviewer](./05-reviewer.md) · 다음 실습 → [실습 ⑦ SA Orchestrator](./07-sa-orchestrator.md)
