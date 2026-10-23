# SA Orchestrator — 아키텍처 리뷰 멀티에이전트

Kiro 커스텀 에이전트(`.kiro/agents/*.json`)로 구성한 소프트웨어 아키텍처(SA) 리뷰 파이프라인입니다.
`sa-orchestrator`가 전문 리뷰어들을 서브에이전트로 조율하여, 최종적으로 GO / CONDITIONAL GO / NO-GO 판정과
Architecture Review Report를 생성합니다.

## 대상 프로젝트 스택

리뷰어 프롬프트는 이 프로젝트의 실제 스택에 맞춰 작성되었습니다:
**Spring Boot 3.2.5 + MyBatis + MySQL** (JPA 아님).
- 영속성: `@Mapper` 인터페이스(`repository/`) + 매퍼 XML(`src/main/resources/mapper/*.xml`)
- 엔티티: JPA 애너테이션 없는 순수 POJO(Lombok)
- 스키마/초기데이터: `schema.sql`, `data.sql`
- 설정: `src/main/resources/application.yml`

## 파이프라인

```
🗣 사용자 요청
      │
      ▼
🎯 SA Orchestrator (sa-orchestrator)
      │
      ▼
🏛 Architecture Reviewer (architecture-reviewer)  — 구조 / 설계 / SPOF
      │  findings
      ├───────────────┬───────────────┐
      ▼               ▼               
🖥 Infra Reviewer   🔌 API Reviewer      (병렬)
  배포/스케일/장애    계약/보안/성능
      └───────────────┴───────────────┘
             │ findings
             ▼
🗄 DB Reviewer (db-reviewer)  — 스키마 / 쿼리 / 트랜잭션
             │
             ▼
⚠️ Risk Aggregator (risk-aggregator)  — 중복 제거 + 레벨 분류 + 인과관계
             │
             ▼
📝 Final SA Opinion  — GO / CONDITIONAL GO / NO-GO
             │
             ▼
📄 Architecture Review Report  → .kiro/reports/architecture-review-<timestamp>.md
```

## 에이전트 구성

| 에이전트 | 역할 | 관점 |
|---|---|---|
| `sa-orchestrator` | 전체 조율, 서브에이전트 호출, 최종 판정 및 리포트 작성 | 오케스트레이션 |
| `architecture-reviewer` | 계층/모듈 구조 검토 | 구조 · 설계 · SPOF |
| `infra-reviewer` | 배포·실행 환경 검토 | 배포 · 스케일 · 장애 |
| `api-reviewer` | REST 엔드포인트·DTO 검토 | 계약 · 보안 · 성능 |
| `db-reviewer` | 엔티티·레포지토리·트랜잭션 검토 | 스키마 · 쿼리 · 트랜잭션 |
| `risk-aggregator` | findings 통합 | 중복 제거 · 레벨 분류 · 인과관계 |

## 사용법

1. Kiro에서 에이전트를 `sa-orchestrator`로 전환합니다.
2. 리뷰 범위를 요청합니다. 예:
   - "HR 시스템 전체 아키텍처 리뷰해줘"
   - "LeaveRequest 기능에 대해 아키텍처 리뷰 진행해줘"
3. 오케스트레이터가 리뷰어들을 순서대로(infra/api는 병렬) 호출하고 Risk Aggregator로 통합한 뒤,
   최종 판정과 리포트를 `.kiro/reports/`에 저장합니다.

## 최종 판정 기준

- **NO-GO**: 미해결 Critical 리스크 1개 이상
- **CONDITIONAL GO**: High 리스크가 있으나 선행 조건 충족 시 진행 가능
- **GO**: Critical/High 없음 (Medium 이하만 존재)

## 설정 메모 (Kiro CLI V3 스키마 기준)

- **V3 스키마로 작성**되었습니다. `tools`(가시성)와 `permissions`(동작 허용/거부)를 분리합니다.
  - `tools`: 태그 표기 (`read`, `write`, `shell`, `subagent`)
  - `permissions.rules`: `{ capability, match, exclude, effect }` 형식.
    capability는 `fs_read`/`fs_write`/`shell`/`subagent` 등. effect는 `allow`/`ask`/`deny` (deny 우선).
  - 패턴은 **글롭만** 지원합니다(정규식 불가). 예: `rm *`, `src/**`, `*.ts`
- V2의 `toolsSettings`/`allowedTools`는 제거되었습니다. (단, `subagent.availableAgents`/`trustedAgents`는
  공식 permissions 리터럴 예시가 없어 `toolsSettings.subagent`에 병기해 두었습니다.)
- **서브에이전트는 사용 가능한 도구가 제한됩니다**: `read`/`write`/`shell`/MCP만 동작하고,
  전용 검색 도구(`grep`/`glob` 류)는 쓸 수 없습니다. 그래서 리뷰어들은 파일 탐색을
  `shell`의 `ls`/`grep`/`find`로 하도록 프롬프트에 명시했습니다.
- 리뷰어들은 읽기 전용(`fs_read` allow + 쓰기 deny + 읽기 전용 `shell`)이라 코드를 수정하지 않습니다.
- `sa-orchestrator`만 쓰기 권한이 있고, `fs_write`는 `.kiro/reports/**`만 allow, 그 외는 deny입니다.
- 오케스트레이터는 `tools`에 `subagent`를 포함하고 `permissions`에서 `subagent: allow`로 두어 리뷰어를 스폰합니다.

## 요구 버전 / 주의

- 이 설정은 **Kiro CLI V3 / IDE 1.0** 스키마입니다.
- 구버전(2.x) 설정(`toolsSettings`+`allowedTools`, `permissions` 없음)은 V3에서 **로드되지 않고 스킵**됩니다.
  만약 구버전 형식으로 되돌아간 파일이 있으면 CLI에서 `/upgrade-agent`로 변환하세요.
- IDE에서 서브에이전트/병렬 실행은 Autopilot 모드에서 동작합니다.

## 검증 방법

상세한 단계별 테스트/검증 가이드는 **[TESTING.md](./TESTING.md)** 를 참고하세요. 요약하면:

**1) 정적 검증 (실행 전, 자동)**
```bash
python3 .kiro/docs/validate_agents.py   # PROBLEMS/WARNINGS 가 (none) 이면 OK
```

**2) 로딩 확인**
```bash
kiro-cli agent list   # 6개 에이전트가 모두 보여야 함
```

**3) 전체 실행**
```bash
kiro-cli --agent sa-orchestrator
# 세션에서: "HR 시스템 전체 아키텍처 리뷰해줘"
```

**정답지 (리포트에 나와야 "제대로 동작"):** 코드 조사로 확인한 실존 리스크
- 보안: `application.yml`에 DB 비밀번호 평문 하드코딩(`root/root`) — 확인됨
- 트랜잭션: 서비스에 `@Transactional` **전무** — `grep -rn Transactional src/main/java` 결과 0건
- 계약/설계: `EmployeeService`에서 createEmployee만 try-catch, update/delete는 없음 — 비일관

**오탐 방지(없어야 정상):** 매퍼 XML에 `${}` SQL 인젝션 패턴 **없음**(확인됨), 생성/수정 요청엔 `@Valid` 이미 적용.
리뷰어가 이것들을 리스크로 보고하면 환각이므로 프롬프트 조정이 필요합니다.

## 참고 문서

- [Kiro Custom agents](https://kiro.dev/docs/custom-agents/)
- [Invoking as sub-agents](https://kiro.dev/docs/custom-agents/subagents/)
- [Configuration reference](https://kiro.dev/docs/custom-agents/configuration-reference/)
