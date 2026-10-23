# SA Orchestrator — 테스트/검증 가이드

이 문서는 `.kiro/agents/`의 오케스트레이터 파이프라인이 **제대로 동작하는지** 단계별로 검증하는 방법입니다.
"값싼 검증 → 비싼 검증" 순서로 구성했습니다. 각 단계는 **실행 / 기대 결과 / 실패 시 의미**로 나눠져 있습니다.

> 핵심 원칙: "에러 없이 끝남"은 성공이 아닙니다. 아래 **정답지(Expected Findings)** 가 리포트에 나와야
> 비로소 "제대로 동작"한 것으로 판정합니다.

---

## Level 0 — 정적 검증 (실행 전, 자동)

가장 값싼 단계. 에이전트가 로딩조차 안 되는 문제를 먼저 거릅니다.

```bash
python3 .kiro/docs/validate_agents.py
```

**기대 결과**: `PROBLEMS: (none)`, `WARNINGS: (none)`, 로드된 에이전트 6개 출력.

**실패 시 의미**
- `JSON 파싱 실패` → 문법 오류. 해당 파일 수정.
- `permissions 블록 없음` → V2 형식. `/upgrade-agent` 또는 재작성 필요.
- `존재하지 않는 에이전트 참조` → 오케스트레이터가 부르는 이름과 파일명 불일치.
- `tools 에 subagent 없음` → 오케스트레이터가 서브에이전트를 못 띄움.

---

## Level 1 — 에이전트 로딩 확인 (CLI)

Kiro가 6개 에이전트를 실제로 인식하는지 확인합니다.

```bash
kiro-cli agent list
```

**기대 결과**: `sa-orchestrator` + 리뷰어 5개가 모두 목록에 보임.

**실패 시 의미**
- 일부만 보이거나 안 보임 → 로딩 스킵됨. 보통 스키마(permissions 누락) 문제.
  `kiro-cli agent upgrade .kiro/agents --dry-run` 으로 변환 필요 여부 확인.
- 전혀 안 보임 → 워크스페이스 신뢰(trust) 문제이거나 경로 문제. 프로젝트 루트에서 실행했는지 확인.

---

## Level 2 — 오케스트레이터 전환 + 단일 리뷰어 스모크 테스트

전체 파이프라인을 돌리기 전에, "스폰 자체가 되는지"만 싸게 확인합니다.

```bash
kiro-cli --agent sa-orchestrator
```

세션 안에서 (파이프라인 전체 말고 한 단계만):
```
architecture-reviewer 서브에이전트만 호출해서 구조/설계/SPOF 관점으로
src/main/java/com/aind/hr 를 리뷰하게 하고, 결과를 그대로 보여줘.
```

**기대 결과**
- `subagent/architecture-reviewer`(또는 유사 표기)로 서브에이전트가 스폰됨
- 그 서브에이전트가 `fs_read`/`shell`로 실제 파일을 읽음
- `[ARCH-n]` 형식의 findings가 돌아옴

**실패 시 의미**
- "서브에이전트를 스폰할 수 없음" → 오케스트레이터 `tools`에 `subagent` 누락 또는 permissions deny.
- 리뷰어 호출마다 승인 프롬프트가 반복 → `trustedAgents`가 적용 안 된 것 (아래 Level 2.5 참고).

---

## Level 2.5 — trustedAgents 가 실제로 먹히는지 검증

`trustedAgents`에 등록된 에이전트는 **승인 프롬프트 없이 즉시 실행**됩니다. 공식 문서상 "적용됐는지"를
직접 출력해주는 단일 명령은 없고, **관찰 가능한 신호**로 확인합니다.

### 신호 1 — 승인 프롬프트의 유무 (가장 직접적)

Level 2의 스모크 테스트에서 리뷰어를 스폰할 때:
- **트러스트 적용됨**: 프롬프트 없이 바로 리뷰어가 실행됨
- **적용 안 됨**: "이 서브에이전트를 실행할까요?" 류의 승인 프롬프트가 뜸
  - (비대화형/headless 실행에서는 프롬프트 대신 **즉시 실패(fail fast)** 로 나타남 — 이것도 "미적용" 신호)

### 신호 2 — 실행 모니터로 관찰 (CLI)

리뷰 실행 중 **`Ctrl+G`** 로 서브에이전트 실행 모니터를 연다. 각 서브에이전트가 바로 진행되는지,
아니면 승인 대기로 멈춰 있는지 보인다. `Ctrl+D`/`Ctrl+U` 로 서브에이전트 간 이동, `q` 로 종료.
(IDE는 Workflows 뷰에서 동일하게 관찰)

### 신호 3 — 설정이 파싱됐는지 / 변환 필요 여부

```bash
kiro-cli agent list                 # sa-orchestrator 가 그대로 뜨는지 (폴백 아님)
/upgrade-agent                      # sa-orchestrator 가 '변환 필요' 목록에 뜨면 → 트러스트 미적용
/upgrade-agent diagnostics          # 변환 경고 확인
```
- `sa-orchestrator`가 `/upgrade-agent` 목록에 **나타나면** 설정이 아직 구형으로 간주돼 트러스트가
  적용되지 않는 상태입니다. 나타나지 않으면 변환 불필요(정상).

### 적용 안 됐을 때 조치

- 이 프로젝트의 `sa-orchestrator.json`은 이미 `permissions` 블록 + `toolsSettings.subagent`를
  **함께** 두어(공식 권장 패턴) V3에서 스킵되지 않도록 했습니다.
- 그래도 프롬프트가 반복되면: `/upgrade-agent`로 공식 변환을 수행하고, 변환 결과에서
  `toolsSettings.subagent`가 어떻게 바뀌는지 확인하세요. (문서에 permissions 쪽 subagent 이름매칭
  리터럴 예시가 없어, 변환기 출력이 가장 확실한 기준입니다.)
- 임시로 전부 자동승인하려면 세션에서 `/tools trust-all` (비대화형은 `--trust-all-tools`).
  단 이건 트러스트를 넓게 여는 것이라 검증 후 원복 권장.

---

## Level 3 — 전체 파이프라인 실행 (핵심 검증)

```bash
kiro-cli --agent sa-orchestrator
```

세션 안에서:
```
HR 시스템 전체 아키텍처 리뷰해줘
```

### 3-1. 실행 흐름 체크리스트

- [ ] architecture-reviewer가 **먼저** 실행된다
- [ ] 그 다음 infra-reviewer와 api-reviewer가 **병렬**로 스폰된다
- [ ] 그 다음 db-reviewer가 실행된다
- [ ] risk-aggregator가 네 리뷰어 findings를 받아 통합한다
- [ ] 최종 판정이 **GO / CONDITIONAL GO / NO-GO** 중 하나로 나온다
- [ ] 리포트가 `.kiro/reports/architecture-review-<timestamp>.md` 로 저장된다

리포트 생성 확인:
```bash
ls -la .kiro/reports/
```

### 3-2. 정답지 (Expected Findings) — 실제 코드 근거로 확정

아래는 이 코드베이스를 직접 조사해 확인한 **실존 리스크**입니다. 리포트에 이게 나오면 리뷰어들이
"실제 코드를 읽고 제대로 분석"한 것입니다. (grep으로 사전 확인한 사실 기반)

| # | 영역 | 리스크 | 근거(확인됨) | 어느 리뷰어가 잡아야 하나 |
|---|---|---|---|---|
| 1 | 보안/인프라 | DB 비밀번호 평문 하드코딩 | `application.yml`에 `username: root / password: root` | infra-reviewer, api-reviewer |
| 2 | 트랜잭션 | `@Transactional` 전무 | `grep -rn Transactional src/main/java` → 결과 0건 | db-reviewer |
| 3 | 계약/설계 | 예외 처리 비일관 | `EmployeeService.createEmployee`만 try-catch, update/delete는 없음 | api-reviewer, architecture-reviewer |
| 4 | 설계 | 엔티티를 응답에 직접 사용 가능성 | 일부 서비스가 `Employee`(엔티티)를 그대로 반환 | architecture-reviewer, api-reviewer |

> 참고(오탐 방지): 이 코드베이스에는 매퍼 XML에 `${}` **SQL 인젝션 패턴이 없습니다**(확인됨).
> 또한 컨트롤러의 생성/수정 요청에는 이미 `@Valid`가 적용돼 있습니다. 따라서 이 둘이 "리스크로
> 보고되지 않는 것"이 정상입니다. 만약 리뷰어가 `${}` 인젝션을 리스크로 올리면 **환각(hallucination)**
> 이므로 프롬프트 조정이 필요합니다.

### 3-3. 합격 기준

- 위 표의 1~3번이 리포트에 **최소 3개 이상** 등장
- risk-aggregator 섹션에 심각도 분류(Critical/High/Medium/Low)와 집계 요약이 있음
- 없는 리스크(위 "오탐 방지" 항목)를 지어내지 않음
- 리포트 파일이 실제로 생성됨

---

## Level 4 — 품질/회귀 검증 (반복 실행)

오케스트레이터는 LLM 기반이라 매 실행 결과가 조금씩 다릅니다. 신뢰도를 보려면 2~3회 반복합니다.

- 같은 요청을 2~3회 실행
- 정답지 1~3번이 **매번** 나오는지 (안정적으로 잡히면 프롬프트가 견고)
- 매번 엉뚱한 리스크(오탐)가 섞이는지
- 판정(GO/CONDITIONAL GO/NO-GO)이 비슷하게 유지되는지

변동이 심하면 해당 리뷰어 프롬프트의 "검토 범위/관점"을 더 구체화합니다.

---

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| `agent list`에 일부 누락 | V2 스키마 / 문법 오류 | `validate_agents.py` 실행 → `/upgrade-agent` |
| 리뷰어 호출마다 승인 프롬프트 | `trustedAgents` V3 미적용 | 수동 승인으로 진행 가능. 또는 `agent upgrade`로 permissions 변환 확인 |
| "서브에이전트 스폰 불가" | `subagent` 도구 누락 | `sa-orchestrator.json`의 `tools`에 `subagent` 포함 확인 |
| 리뷰어가 파일을 못 읽음 | shell/read 권한 deny | 해당 리뷰어 `permissions`의 `fs_read`/`shell` allow 확인 |
| 리포트 저장 실패 | `fs_write` 경로 제한 | `.kiro/reports/` 경로가 allow인지, 디렉터리 생성 가능한지 확인 |
| 없는 리스크를 보고함(오탐) | 프롬프트 과잉 일반화 | 해당 리뷰어 프롬프트의 "기술 전제"를 더 좁힘 |

---

## 빠른 참조 — 사전 사실 확인 명령

리뷰 결과를 사람이 교차검증할 때 쓰는 명령들:

```bash
# DB 비밀번호 하드코딩 확인
grep -n "password" src/main/resources/application.yml

# @Transactional 부재 확인 (결과 0건이면 정답지 2번 성립)
grep -rn "Transactional" src/main/java || echo "없음 (정답지 성립)"

# SQL 인젝션(${}) 패턴 — 결과 없어야 정상
grep -rn '\${' src/main/resources/mapper || echo "없음 (오탐 방지 항목)"

# @Valid 적용 지점
grep -rn "@Valid" src/main/java
```
