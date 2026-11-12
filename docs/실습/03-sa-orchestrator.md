# 실습 ③. SA Orchestrator — 아키텍처 검토

> **과정**: 핵심
> **소요 시간**: 기본 약 35분 (+ 선택 약 15분)
> **AI 요청 횟수**: 기본 1회 / 선택 +1회
> **난이도**: ★★★★☆
> **실습 목표**: 커스텀 에이전트 하나(`code-reviewer`)를 직접 만들어 보고, 멀티에이전트가 만든 아키텍처 검토 리포트를 **정답지로 검증**한다. 원하면 범위를 좁혀 직접 실행해 본다.

---

## 0. 이 실습에서 배우는 것

- **커스텀 에이전트**를 직접 만들고 전환하는 법 (이 과정에서 처음 다룹니다)
- 메인 에이전트가 전문 에이전트들을 **서브에이전트로 조율**하는 구조
- 리포트가 "진짜인지" **정답지로 검증**하는 법
- 멀티에이전트를 **짧은 시간, 적은 사용량으로** 돌리는 법

---

## 1. 커스텀 에이전트 하나 만들기 (code-reviewer)

커스텀 에이전트는 역할에 맞는 **프롬프트와 권한을 묶어 둔 설정 파일**입니다. 위치는 `.kiro/agents/`. 기본 에이전트에게 "코드는 바꾸지 마"라고 하는 건 부탁이지만, 커스텀 에이전트는 **권한으로** 막습니다.

SA 오케스트레이터는 이런 커스텀 에이전트 여러 개를 묶은 것입니다. 먼저 하나를 직접 만들어 봅니다.

### 1-1. 파일 만들기 (AI 사용 없음)

프로젝트 루트에 `.kiro/agents/code-reviewer.json` 파일을 만들고 아래 내용을 그대로 붙여 넣습니다.

```json
{
  "name": "code-reviewer",
  "description": "코드 리뷰어. 지정한 파일을 프로젝트 표준 12개 항목으로 점검하고, 위반을 필수 수정·권장·참고 3단계로 분류한다. 읽기 전용.",
  "prompt": "당신은 aind-hr-project의 코드 리뷰어입니다. 사용자가 지정한 파일(지정이 없으면 git diff의 변경 파일)만 점검합니다. 코드는 수정하지 않습니다.\n\n## 점검 항목 (12개)\n1. MyBatis는 #{}만 사용, ${} 없음\n2. XML id = Repository 메서드명\n3. 레이어 책임: Controller는 위임만\n4. 엔티티 대신 *Response DTO로 응답\n5. 요청 DTO 검증과 @Valid\n6. CustomException + ErrorCode 사용, 광범위한 catch (Exception e) 없음\n7. 여러 번 쓰는 작업은 @Transactional 안에 있음\n8. 목록 조회 결과 없음은 200 + 빈 배열\n9. 반복문 안 DB 호출(N+1) 없음\n10. 새 엔드포인트에 @Operation 있음\n11. 비밀정보 하드코딩 없음 (값은 쓰지 말고 키 이름과 위치만)\n12. 기존 동작 변경·새 의존성 없음\n\n## 분류\n- 필수 수정: 보안 위험, 런타임 오류, 데이터 손상 가능성\n- 권장: 동작은 하지만 표준·유지보수성을 해침\n- 참고: 현재 규모에서는 영향이 작은 개선점\n\n## 반환 형식\n| 분류 | 항목 번호 | 파일:라인 | 문제 | 권고 |\n표 아래에 12개 항목 결과를 한 줄씩(통과 / 위반 / 해당 없음) 적는다.\n\n## 규칙\n- 실제 코드에서 확인한 것만 지적한다.\n- 파일 탐색은 shell의 git diff, ls, grep, cat만 사용한다.\n- 한국어로 답한다.",
  "tools": [
    "read",
    "shell"
  ],
  "resources": [
    "file://.kiro/steering/**/*.md"
  ],
  "permissions": {
    "rules": [
      {
        "capability": "fs_read",
        "effect": "allow"
      },
      {
        "capability": "shell",
        "match": [
          "git diff*",
          "git status*",
          "ls *",
          "grep *",
          "cat *"
        ],
        "effect": "allow"
      },
      {
        "capability": "fs_write",
        "effect": "deny"
      }
    ]
  }
}
```

| 필드 | 뜻 |
|------|-----|
| `description` | 무슨 일을 하는 에이전트인지 |
| `prompt` | 역할, 점검 항목, 반환 형식, 규칙 |
| `tools` | **어떤 도구가 보이는가** (`read`, `write`, `shell`, `subagent/<이름>`) |
| `resources` | 시작할 때 함께 읽는 파일. 여기서는 실습 ①의 Steering 규칙 |
| `permissions` | **그 도구로 무엇을 해도 되는가**. 읽기 명령만 허용하고 파일 쓰기는 거부 |

### 1-2. 확인하기 (AI 사용 없음)

```bash
kiro-cli agent validate --path .kiro/agents/code-reviewer.json   # 아무것도 출력되지 않으면 정상
kiro-cli agent list                                              # code-reviewer 가 (v3 format) 으로 보이면 성공
```

### 1-3. 전환해서 써 보기 (AI 1회)

**에이전트 전환**
- IDE: 채팅 입력창 하단의 에이전트 드롭다운 → `code-reviewer`
- CLI: `kiro-cli chat --v3 --agent code-reviewer` (이 저장소의 에이전트는 V3 전용이라 `--v3`가 없으면 권한 설정이 적용되지 않습니다)

`code-reviewer`로 전환하고 입력:

```text
src/main/java/com/aind/hr/service/EmployeeService.java 파일만 점검해줘.
```

**기대 결과**: 6번 항목(광범위한 `catch (Exception e)`) 위반이 나옵니다. `createEmployee`의 `catch (Exception e)`가 모든 예외를 "등록 실패"로 뭉갭니다. 7번(`@Transactional` 없음)도 지적될 수 있습니다.

> 💡 "그럼 바로 고쳐줘"라고 해 보세요. `fs_write`가 `deny`라서 `code-reviewer`는 파일을 고칠 수 없습니다. 역할이 **권한으로** 강제되는 것을 확인할 수 있습니다.

### 1-4. 하나에서 여럿으로

이 저장소의 SA 오케스트레이터는 방금 만든 것과 같은 구조의 커스텀 에이전트 6개로 되어 있습니다.
- **리뷰어 4개**(`architecture-` `infra-` `api-` `db-reviewer`)와 **`risk-aggregator`**: `code-reviewer`처럼 한 가지 관점만 보는 읽기 전용 에이전트
- **`sa-orchestrator`**: 위 5개를 서브에이전트로 묶은 에이전트. `code-reviewer`와 비교해 두 가지가 다릅니다.
  - `tools`에 `subagent/architecture-reviewer` 등 5개가 있어 **이 5개만** 서브에이전트로 띄울 수 있습니다.
  - `permissions`의 `fs_write`가 `.kiro/reports/**`에만 허용돼 리포트만 쓸 수 있습니다.

> 💡 `.kiro/agents/api-reviewer.json`을 열어 방금 만든 `code-reviewer.json`과 비교해 보세요. 필드 구성이 같고 `prompt`의 관점만 다릅니다.

---

## 2. 구조

리뷰어 4명(구조·인프라·API·DB) → `risk-aggregator`(중복 제거 + 레벨 분류 + 인과관계) → 오케스트레이터의 최종 판정 → 리포트 순서입니다. 리뷰어를 **어떤 순서로 돌리느냐**에 따라 모드가 둘입니다.

**빠른 모드 (기본)** — 리뷰어 4명이 동시에 돕니다. 서로를 기다리지 않습니다.

```
sa-orchestrator
  → architecture ∥ infra ∥ api ∥ db   (4명 동시)
    → risk-aggregator
      → 최종 판정 → .kiro/reports/architecture-review-<timestamp>.md
```

**순차 모드** — 요청에 "순차 모드"를 넣으면 앞 리뷰어의 결과를 다음 리뷰어가 이어받습니다.

```
sa-orchestrator
  → architecture                       구조 / 설계 / SPOF
    → infra ∥ api                      배포·스케일·장애 ∥ 계약·보안·성능
      → db                             스키마 / 쿼리 / 트랜잭션
        → risk-aggregator
          → 최종 판정 → 리포트
```

| | 빠른 모드 | 순차 모드 |
|---|-----------|-----------|
| 서브에이전트 차례 | 2번 (리뷰어 4명 → aggregator) | 4번 |
| 관점 간 교차 참조 | aggregator가 통합할 때 | 리뷰 중에도 앞 결과를 참고 |
| 쓰임 | 실습, 일상 점검 | 큰 설계 변경처럼 깊게 볼 때 |

- 서브에이전트 5개(리뷰어 4 + `risk-aggregator`)는 **읽기 전용**입니다. 쓰기는 오케스트레이터가 `.kiro/reports/`에만 합니다.
- 판정 기준: Critical이 1개라도 있으면 NO-GO, High가 있으면 CONDITIONAL GO, 그 외 GO

---

## 3. 설정 확인 (AI 사용 없음)

프로젝트 루트에서:

```bash
python3 .kiro/docs/validate_agents.py   # PROBLEMS: (none) 이면 정상
kiro-cli agent list                     # sa-orchestrator 와 서브에이전트 5개가 (v3 format) 으로 보여야 함
```

---

## 4. 샘플 리포트로 검증하기 (기본)

저장소에 이미 만들어진 리포트를 엽니다.

```text
.kiro/reports/architecture-review-20261023-142313.md
```

전체 시스템을 대상으로 만든 리포트입니다. 판정은 **NO-GO**, 통합 리스크는 25건입니다. 개수 제한이 없던 이전 설정에서 순차 방식으로 만든 것이라, 지금 기본값(빠른 모드, 통합 최대 10개)으로 실행하면 더 짧은 리포트가 나옵니다.

### 정답지

이 코드베이스를 직접 조사해 확인한 사실입니다. 리포트를 이것과 대조하세요.

**나와야 함** (실제 코드에 있는 리스크)

| # | 리스크 | 코드에서 확인하는 방법 |
|---|--------|------------------------|
| 1 | DB 비밀번호 평문 하드코딩 (키: `spring.datasource.password`) | `application.yml`에 값이 그대로 있음 (값은 문서에 옮겨 적지 않음) |
| 2 | 전 Service에 `@Transactional` 없음 | `grep -rn "Transactional" src/main/java` → 0건 |
| 3 | `AttendanceService.getAttendanceByDate`의 N+1 쿼리 | 반복문 안에서 `employeeRepository.selectById` 호출 |
| 4 | 광범위한 `catch (Exception e)` | `grep -rn "catch (Exception" src/main/java` → 3곳 |

**나오면 안 됨** (나오면 환각)

| 지적 | 왜 틀렸나 |
|------|-----------|
| 매퍼 XML의 `${}` SQL 인젝션 | 전 매퍼가 `#{}`만 사용. `${}` 없음 |
| 입력 검증 전무 | 생성·수정 컨트롤러 4곳에 `@Valid` 적용됨 |

### 대조 명령

```bash
R=.kiro/reports/architecture-review-20261023-142313.md
grep -n "최종 판정" $R
grep -n "Transactional" $R | head -3
grep -n "N+1" $R | head -3
grep -n "catch" $R | head -3
grep -n '\${' $R        # '사용 0건' 확인 문장이어야 함 (지적이면 환각)
```

> ⚠️ **비밀번호 항목은 `grep`하지 마세요**: 리포트에 값이 그대로 적혀 있어 화면에 출력됩니다. 통합 리스크 표의 RISK-5 행에서 눈으로 확인하세요.

### 직접 판단해 보기 (1문제)

리포트는 RISK-5를 "테스트 설정이 **운영 DB**를 가리킨다"는 이유로 Critical로 분류합니다. 설정의 접속 주소는 `localhost`입니다. `.kiro/steering/security-rules.md`의 "프로덕션" 정의와 대조하면, 이 전제는 맞을까요?

> 💡 정답지에 없는 지적은 **근거를 직접 확인**하세요. 리포트가 그럴듯해도 확인되지 않은 전제가 섞일 수 있습니다.

---

## 5. 직접 실행하기 (선택)

### 시간과 사용량을 줄이는 장치

멀티에이전트는 서브에이전트마다 코드를 따로 읽고, 차례를 기다리는 만큼 오래 걸립니다. 이 저장소의 에이전트는 기본으로 아래처럼 동작합니다.

| 장치 | 줄어드는 것 |
|------|-------------|
| **빠른 모드**: 리뷰어 4명 동시 실행 | 기다리는 시간 (차례 4번 → 2번) |
| 범위를 주면 리뷰어가 **그 파일만** 읽음, 대상이 없으면 `해당 없음`으로 바로 끝남 | 읽는 양과 시간 |
| 오케스트레이터는 소스를 직접 읽지 않음 | 중복 읽기 |
| 리뷰어당 findings **최대 5개**, 통합 리스크 **최대 10개**, 리포트 **간결 형식** | 생성하는 글의 양 |
| 앞 단계 결과는 **요약**으로만 전달 (순차 모드) | 입력이 불어나는 것 |
| 서브에이전트가 쓰는 명령이 모두 미리 허용돼 있음 | 승인 대기 |

여기에 **요청 범위를 좁히면** 효과가 가장 큽니다.

### 실행

1. 메인 에이전트를 `sa-orchestrator`로 전환합니다.
   - IDE: 에이전트 드롭다운 → `sa-orchestrator` (Autopilot 모드)
   - CLI: `kiro-cli chat --v3 --agent sa-orchestrator`
2. **범위를 좁혀** 요청합니다.
   ```text
   AttendanceService.java와 AttendanceMapper.xml만 범위로 아키텍처 리뷰해줘.
   ```
3. 새 리포트가 생겼는지 확인합니다. 폴더에 샘플이 이미 있으니 **새 타임스탬프 파일**인지 보세요.
   ```bash
   ls -lt .kiro/reports/ | head -3
   ```
4. 4절과 같은 방법으로 정답지와 대조합니다. 범위를 좁혔으므로 정답지 2·3·4번(트랜잭션, N+1, 광범위 catch)이 나오면 충분합니다. 1번(설정 파일)은 범위 밖이라 안 나와도 정상입니다.

> 💡 위 범위에는 설정 파일이 없어서 `infra-reviewer`는 `해당 없음`으로 바로 끝나는 것이 정상입니다.

> ⚠️ **오래 걸리는 요청**: `HR 시스템 전체 아키텍처 리뷰해줘`(리뷰어마다 백엔드 전체를 읽음), 요청에 "순차 모드"(차례 4번), "전체 모드"(개수 제한과 요약 전달 해제)를 넣는 경우입니다. 꼭 필요할 때만 쓰세요.

---

## 6. 완료 체크리스트

**기본**
- [ ] `code-reviewer`를 만들고 `agent list`에서 확인했다
- [ ] `code-reviewer`가 `EmployeeService`의 광범위한 catch를 지적했다
- [ ] 에이전트 파일에서 `tools`와 `permissions`의 차이를 설명할 수 있다
- [ ] `validate_agents.py`가 PROBLEMS none
- [ ] 샘플 리포트에서 "나와야 함" 4개를 찾았다
- [ ] "나오면 안 됨" 2개가 지적으로 나오지 않았음을 확인했다
- [ ] RISK-5의 전제를 근거로 판단했다

**선택**
- [ ] 범위를 좁혀 직접 실행했고, 새 리포트를 정답지와 대조했다

---

## 7. 흔한 문제 & 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `code-reviewer`가 목록에 없음 | 파일 위치가 `.kiro/agents/`가 아님, JSON 문법 오류, 프로젝트 루트 밖에서 실행 | `kiro-cli agent validate --path .kiro/agents/code-reviewer.json`의 오류 메시지 확인 |
| 서브에이전트가 안 뜸 | 메인 전환 안 함, IDE가 Supervised 모드, CLI를 `--v3` 없이 실행 | `sa-orchestrator`로 전환, Autopilot, `--v3` |
| 호출마다 승인창 반복 | `permissions`의 `subagent` 규칙 미적용 (V2 하네스) | `--v3`로 실행. 급하면 수동 승인 |
| 새 리포트가 안 보임 | 실행 실패했는데 샘플 파일을 보고 있음 | `ls -lt`로 타임스탬프 확인 |
| `agent list`에 일부 누락 | 설정 문법 오류 | `validate_agents.py`의 PROBLEMS 확인 |

자세한 진단은 `.kiro/docs/TESTING.md`를 참고하세요.

---

## 8. 돌아보기

- 멀티에이전트는 관점 분리와 리스크 통합을 자동화하지만, **최종 판단은 사람**이 정답지와 근거로 내립니다.
- 사용량은 **범위**와 **전달량**이 좌우합니다. 범위를 좁히고 요약만 넘기는 것이 기본입니다.
- 다른 프로젝트에 적용할 때는 리뷰어 프롬프트의 "기술 전제"만 바꾸면 됩니다.

---

이전 실습 ← [실습 ② Specs](./02-specs.md) · 다음 실습 → [실습 ④ Skills](./04-skills.md)
