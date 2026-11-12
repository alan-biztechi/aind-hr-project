# 실습 ⑥. 실무 적용 가이드 및 FAQ

> **과정**: 참고
> **실습 목표**: 실습에서 익힌 기능(Steering/Spec/Agent/Skill/Hook)을 내 실제 프로젝트에 이식하는 절차를 정리하고, 막혔을 때 어디를 보면 되는지 찾아갈 수 있게 한다.

---

## 0. 목표

- 실습 내용을 내 프로젝트에 **이식하는 절차**를 안다.
- 이 저장소의 `.kiro/` 구성을 **Starter Kit**으로 재사용한다.
- 막혔을 때 **어느 실습의 어느 절**을 보면 되는지 안다.

---

## 1. 이 저장소의 `.kiro/` 구성 (재사용 가능한 자산)

실습에서 쓴 것들은 전부 `.kiro/` 아래에 있습니다.

```text
.kiro/
├── steering/          # 공통 규칙 (실습 ①)
│   ├── engineering-rules.md     # 스택/빌드·테스트/코딩 규율
│   ├── architecture-rules.md    # 아키텍처 리뷰 기준·심각도 정의
│   └── security-rules.md        # 보안 규칙 (우선순위 최상위)
├── specs/             # 기능 명세 (실습 ②)
│   ├── hr-web-frontend/             # requirements/design/tasks 완성 예시
│   └── dashboard-department-summary/ # 작은 Spec 예시 (문서만, 구현 없음)
├── agents/            # 커스텀 에이전트와 리뷰 오케스트레이션 (실습 ③)
│   ├── code-reviewer.json       # 실습 ③에서 직접 만듦 (단일 리뷰어)
│   ├── sa-orchestrator.json     # 메인(조율자)
│   ├── architecture-reviewer.json
│   ├── infra-reviewer.json
│   ├── api-reviewer.json
│   ├── db-reviewer.json
│   ├── risk-aggregator.json
├── docs/              # 검증 가이드·스크립트
│   ├── TESTING.md               # 오케스트레이터 검증 + 정답지
│   └── validate_agents.py       # 에이전트 정적 검증
└── hooks/             # 자동화 (실습 ⑤에서 생성)
```

> 💡 `docs/실습/`(이 문서들)은 **실습 교재**이고, `.kiro/`는 **실제로 Kiro가 읽는 설정**입니다. 둘을 혼동하지 마세요.

> 💡 `.kiro/agents/`에는 **에이전트 정의 파일**(JSON, 또는 frontmatter가 있는 Markdown)만 둡니다. 설명 문서는 `.kiro/docs/`로 옮기세요.

---

## 2. 내 프로젝트에 적용하기

### 2-1. Steering부터 (가장 쉬움, 효과 큼)

1. 내 프로젝트에 `.kiro/steering/` 폴더를 만든다.
2. `engineering-rules.md`를 복사해 **내 스택으로 교체**한다 (언어/프레임워크/빌드·테스트 명령).
3. `security-rules.md`는 거의 그대로 재사용 가능 — "프로덕션" 정의와 파괴적 명령 통제는 범용적이다.
4. 규칙이 많으면 범위 좁은 것은 `inclusion: fileMatch`로 건다.

### 2-2. 리뷰 오케스트레이터 이식 (실습 ③)

1. `.kiro/agents/`의 JSON 6개 파일(`sa-orchestrator` + 서브에이전트 5개)을 복사한다.
2. 각 리뷰어 프롬프트의 **"기술 전제"만** 내 스택에 맞게 바꾼다. (이 저장소는 MyBatis/MySQL 기준 — JPA/PostgreSQL 등이면 그 부분만 수정)
3. `.kiro/docs/validate_agents.py`로 정적 검증: `python3 .kiro/docs/validate_agents.py`
4. **정답지(Expected Findings)를 내 코드 기준으로 새로 작성**한다. (`TESTING.md` 형식 참고) — 정답지 없는 리뷰는 신뢰하기 어렵다.

### 2-3. Hook 자동화 (실습 ⑤)

- `frontend-conventions.md`의 규칙을 내 프로젝트 것으로 바꾼다. 훅(`pre-commit-check.json`)은 그대로 쓸 수 있습니다.
- `pr-workflow.md`의 빌드 명령과 기준 브랜치를 내 프로젝트에 맞게 바꾼다.
- 반드시 지켜야 하는 규칙은 린터를 빌드에 넣고, 훅의 `command` 액션으로 실행한다.

> ⚠️ **보안 규칙은 먼저 이식하라**: 비밀정보 하드코딩 금지, 공유 DB 직접 변경 금지, 파괴적 명령 승인 같은 규칙은 다른 어떤 규칙보다 먼저 깔아두는 것이 안전합니다.

---

## 3. Starter Kit — 복사해 바로 쓰기

| 자산 | 위치 | 그대로 재사용 | 내 프로젝트에 맞게 수정 |
|------|------|---------------|--------------------------|
| 보안 규칙 | `.kiro/steering/security-rules.md` | 대부분 그대로 | "프로덕션" 범위를 내 환경 기준으로 |
| 엔지니어링 규칙 | `.kiro/steering/engineering-rules.md` | 구조만 | 스택·빌드·테스트 명령 전부 |
| 아키텍처 규칙 | `.kiro/steering/architecture-rules.md` | 심각도 정의·리포트 형식 | 리뷰 대상 스택 설명 |
| 리뷰 파이프라인 | `.kiro/agents/*.json` | 오케스트레이션 구조 | 리뷰어 프롬프트의 "기술 전제" |
| 검증 스크립트 | `.kiro/docs/validate_agents.py` | 그대로 | (불필요) |
| 검증 가이드 | `.kiro/docs/TESTING.md` | 형식 | 정답지(Expected Findings) 전부 |

---

## 4. 막혔을 때 — 문제 해결 찾아가기

증상별 해결법은 각 실습의 "흔한 에러" 절에 있습니다. 같은 내용을 여기서 반복하지 않으니, 아래에서 해당 절로 이동하세요.

| 막힌 지점 | 이동할 곳 |
|-----------|-----------|
| 백엔드 기동 실패, DB 접속 오류, 포트 충돌, Node 버전 | [실습 ⓪ 7절](./00-시작하기.md) |
| Steering 규칙이 반영되지 않음, 규칙 충돌 | [실습 ① 6절](./01-steering.md) |
| 화면이 비어 있음, 404, 타입 에러 | [실습 ② 8절](./02-specs.md) |
| 리뷰가 없는 문제를 지어냄(환각) | [실습 ③ 4절](./03-sa-orchestrator.md) |
| 수정했는데 status가 안 바뀜 | [실습 ④ 6절](./04-skills.md) |
| 에이전트가 안 보임, 서브에이전트가 안 뜸, 승인창이 반복됨 | [실습 ③ 7절](./03-sa-orchestrator.md), `.kiro/docs/TESTING.md` |
| 훅이 안 돎, 너무 느림, matcher 불일치 | [실습 ⑤ 6절](./05-hooks.md) |

> 💡 **Spec을 한 번에 다 만들게 해도 되나?** 가능하지만 권장하지 않습니다. requirements/design/tasks를 단계별로 승인해야 Spec의 가치가 살아납니다. ([실습 ② 4절](./02-specs.md))

---

## 5. 체크리스트

- [ ] `.kiro/steering/`(특히 보안)을 내 프로젝트로 이식했다
- [ ] 리뷰 파이프라인을 내 스택에 맞게 수정하고 정적 검증했다
- [ ] 내 코드 기준 정답지(Expected Findings)를 작성했다
- [ ] 막혔을 때 볼 위치(4절)를 알고 있다

---

## 6. 돌아보기 — 전체 과정 요약

- **기본 (⓪~②)**: 환경 준비 → Steering으로 규칙 고정 → Spec으로 명세 주도 개발
- **핵심 (③)**: 커스텀 에이전트와 멀티에이전트 아키텍처 검토(정답지로 환각 거르기)
- **실무 활용 (④~⑤)**: 버그 수정 & 회귀 검증(Skill화) → Hook으로 검증 자동화

이 흐름을 내 프로젝트에 옮기면, **규칙이 깔리고 · 명세로 합의하고 · 자동으로 검증·리뷰되는** 개발 환경을 만들 수 있습니다.

---

이전 실습 ← [실습 ⑤ Hooks](./05-hooks.md) · 목차 → [실습 목록](./README.md)
