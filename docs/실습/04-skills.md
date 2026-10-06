# 실습 ④. Skills로 "보안 감사" 전문 능력 꺼내 쓰기

> **이론 선행**: [04. Kiro의 부가 기능](../이론/04-부가기능.md) (Skills 파트)
>
> 실습 ③에서 **Agent**로 "역할·권한이 고정된 담당자"를 만들었습니다.
> **Skills**는 다른 축입니다 — 담당자가 **필요할 때 꺼내 쓰는 "전문 매뉴얼"**이에요.
> 이번 실습에서는 외부 스킬(**Cloudflare `security-audit-skill`**)을 **프로젝트에 직접 등록**하고, 이 프로젝트를 **보안 감사**해봅니다.

---

## 0. 실습 목표

- Skills가 **무엇이고 Agent와 어떻게 다른지** 체감한다.
- 외부에 공개된 스킬을 **`.kiro/skills/`에 직접 두는 방식**으로 프로젝트에 등록한다.
- 등록한 스킬을 **호출(활성화)**해 이 프로젝트의 보안 감사를 실행한다.
- 이 방식을 그대로 적용해 **원하는 다른 스킬**도 등록·활용할 수 있게 된다.

---

## 1. Skills란 — Agent와 뭐가 다른가

- **Agent**: "누가(어떤 역할·권한으로) 일하는가" → **세션 단위 설정** (실습 ③)
- **Skills**: "어떤 전문 지식/절차를 꺼내 쓰는가" → **요청에 맞으면 자동 활성화되는 능력 묶음**

> 비유: Agent가 **"담당자"**라면, Skills는 그 담당자가 필요할 때 펼쳐 보는 **"전문 매뉴얼"**입니다. (이론 04장)

Skills는 요청이 스킬 설명과 맞으면 **Kiro가 알아서 활성화**합니다. 매번 긴 절차를 설명하지 않아도, 그 전문 지식·절차를 로드해 적용합니다.

---

## 2. 스킬을 "프로젝트 레벨"에 직접 등록하는 법

스킬은 **폴더 하나** 입니다. 그 안의 **`SKILL.md`** 가 핵심(설명 + 절차)이고, 필요한 보조 파일(스크립트·추가 지침 문서 등)이 함께 들어갑니다. 이 폴더를 정해진 위치에 두면 Kiro가 스킬로 인식합니다.

### 등록 위치

| 범위                    | 위치                           | 특징                                            |
| ----------------------- | ------------------------------ | ----------------------------------------------- |
| **프로젝트 레벨** | `.kiro/skills/<스킬이름>/`   | 이 저장소에만 적용,**커밋하면 팀과 공유** |
| 사용자(전역)            | `~/.kiro/skills/<스킬이름>/` | 내 모든 프로젝트에 적용                         |

> 이번 실습은 **프로젝트 레벨**(`.kiro/skills/`)에 둡니다. 팀 전체가 같은 보안 감사 스킬을 쓰게 하기 위해서입니다.

### 스킬 폴더의 구조 (예시)

```text
.kiro/skills/
└─ security-audit/
   ├─ SKILL.md                 ← 핵심: front matter(설명) + 절차
   ├─ RECONNAISSANCE.md        ← 보조 지침 문서들
   ├─ HUNTING.md
   ├─ VALIDATION-AND-REPORTING.md
   ├─ report-schema.json       ← 결과 스키마
   ├─ validate-findings.cjs    ← 검증 스크립트(Node)
   └─ ...                      ← 그 외 공격 분류/검증 파일
```

`SKILL.md` 상단은 이런 **front matter**로 시작합니다. 여기 `description`이 **"언제 이 스킬을 자동 활성화할지"**를 결정합니다.

```markdown
---
name: security-audit
description: 코드베이스를 다단계로 보안 감사하고, 독립 검증된 결과를 구조화해 리포트로 낸다. "보안 감사", "취약점 찾기", "pen-test" 같은 요청에서 사용.
---
# (이하 본문: 감사 절차·원칙·안티패턴 ...)
```

---

## 3. 실습 — Cloudflare `security-audit-skill` 등록하고 보안 감사하기

이번에 쓸 스킬: [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)
코딩 에이전트를 **보안 감사자**로 만들어, 정찰 → 취약점 헌팅 → 후보 검증 → 구조화 출력 → 독립 검증 → 리포트까지 **6단계**로 수행합니다. (라이선스: MIT)

### 3-1. 스킬 폴더 받아서 `.kiro/skills/`에 두기

저장소 내용을 받아 `.kiro/skills/security-audit/` 폴더로 넣습니다.

> ⚠️ **주의:** 이 저장소는 루트 안에 `skills/security-audit/`로 **한 겹 더 중첩**되어 있습니다.
> 그래서 저장소를 그대로 clone만 하면 `SKILL.md`가
> `.kiro/skills/security-audit/skills/security-audit/SKILL.md`에 놓여 **Kiro가 인식하지 못합니다.**
> Kiro는 `.kiro/skills/<스킬이름>/SKILL.md` 위치여야 인식하므로, clone 후 **본체를 한 단계 위로 올려야** 합니다.

```bash
# 프로젝트 루트에서
mkdir -p .kiro/skills

# 1) 임시 폴더로 clone (중첩 구조라 바로 넣지 않습니다)
git clone https://github.com/cloudflare/security-audit-skill /tmp/security-audit-skill

# 2) 실제 스킬 본체(skills/security-audit)만 .kiro/skills/security-audit 로 복사
cp -R /tmp/security-audit-skill/skills/security-audit .kiro/skills/security-audit

# 3) 임시 clone 정리
rm -rf /tmp/security-audit-skill
```

복사 후 구조가 아래처럼 되어 있으면 정상입니다 (`SKILL.md`가 바로 보여야 함).

```text
.kiro/skills/security-audit/
├─ SKILL.md
├─ RECONNAISSANCE.md
├─ HUNTING.md
└─ ...
```

> 폴더를 둔 뒤 **새 세션(새 채팅)**을 엽니다. `SKILL.md`의 `description`을 보고 Kiro가 스킬을 인식합니다.

### 3-2. 실행 — 이 프로젝트를 보안 감사

새 세션에서 아래처럼 요청하면, 요청이 스킬 트리거(보안 감사 / 취약점 찾기 등)와 맞아 **자동 활성화**됩니다.

```text
이 프로젝트(aind-hr) 코드베이스를 보안 감사해줘. 결과 리포트도 만들어줘.
```

이 프로젝트 특성상 특히 이런 지점을 봐달라고 덧붙이면 좋습니다.

```text
MyBatis XML Mapper의 SQL 조립(동적 쿼리)에서 SQL 인젝션 위험,
입력 검증(@Valid / *Request DTO) 누락, 에러 응답에 민감정보 노출 여부를 중점으로 봐줘.
```

### 3-3. 스킬이 하는 일 / 결과물

- 아키텍처·신뢰 경계·입력 표면을 정찰하고 **커버리지 원장**을 만든 뒤
- 취약점 후보를 찾고 → **별도 검증자**가 반증을 시도 → 확정/추가검증필요/기각으로 분류
- `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md` 등으로 정리

> ℹ️ 출력 위치: 디렉터리를 따로 지정하지 않으면 기본적으로 저장소 **바깥**(`~/security-audit-skill/<repo>/...`)에 씁니다. 저장소 안에 두려면 **버전관리에서 무시되는 경로를 명시**해야 합니다. 또한 검증 스크립트 실행에 **Node.js**가 필요합니다.

생성된 `REPORT.md`를 열어, 지적된 항목이 실제 코드(예: Mapper XML, Controller 검증)와 맞는지 확인합니다.

---

## 4. 원하는 다른 스킬도 똑같이 적용해보기

핵심은 **"스킬 = 폴더 하나(SKILL.md 포함)를 `.kiro/skills/`에 두는 것"** 이라는 점입니다. 이 방식만 익히면 어떤 스킬이든 동일하게 붙일 수 있습니다.

1. 쓰고 싶은 스킬의 폴더를 구한다. (공개 저장소 clone, 또는 직접 `SKILL.md` 작성)
2. `.kiro/skills/<이름>/` 아래에 둔다. (팀 공유하려면 커밋)
3. 새 세션에서 그 스킬 설명과 맞는 요청을 던진다 → 자동 활성화.

### 적용 아이디어 (택 1)

- **직접 만들기**: `.kiro/skills/<이름>/SKILL.md` 를 손수 작성해, 우리 팀 전용 절차(예: 릴리스 체크리스트)를 스킬로 패키징
- **다른 공개 스킬**: 문서 생성(docx/xlsx/pdf), 코드 리뷰, 커밋 메시지 같은 범용 스킬을 같은 방식으로 등록
  ([Anthropic 공식 Skills 저장소](https://github.com/anthropics/skills), [awesome-claude-skills 모음](https://github.com/ComposioHQ/awesome-claude-skills) 참고 — *출처 내용은 라이선스 준수를 위해 요약·재구성했습니다.*)

---

## 5. 완료 체크리스트

- [ ] `security-audit` 스킬 폴더를 `.kiro/skills/` 아래에 두었다. (`.kiro/skills/security-audit/SKILL.md`가 **바로** 보인다 — `skills/`가 한 겹 더 들어가 있지 않다)
- [ ] 새 세션에서 "보안 감사" 요청으로 스킬이 **활성화**되는 것을 확인했다.
- [ ] 이 프로젝트에 대한 보안 감사 **리포트(REPORT.md 등)**를 생성했다.
- [ ] 지적된 항목이 실제 코드 근거와 맞는지 확인했다.
- [ ] 같은 방식으로 **다른 스킬 하나**를 추가로 등록/활용해봤다.

---

## 6. 돌아보기

- **Skills는 "꺼내 쓰는 전문 능력"** 입니다. Agent가 "역할·권한을 묶은 담당자"라면, Skills는 그 담당자가 상황에 맞게 펼치는 전문 매뉴얼입니다.
- 설치는 특별할 게 없습니다 — **폴더 하나(SKILL.md 포함)를 `.kiro/skills/`에 두면 끝**이고, 커밋하면 팀 전체가 같은 능력을 공유합니다.
- `security-audit` 같은 스킬 하나면, "보안 감사해줘" 한마디로 **정해진 절차의 전문 작업**이 돌아갑니다. 매번 방법을 설명할 필요가 없습니다.
- **Steering(규칙) + Agent(역할) + Skills(전문 능력) + Hooks(자동화) + MCP(외부 연동)** 를 상황에 맞게 조합하는 것이 Kiro를 가장 강력하게 쓰는 길입니다.

---

이론 ← [04. Kiro의 부가 기능](../이론/04-부가기능.md) · 이전 실습 ← [실습 ③ Agent로 테스트 케이스 엑셀 정리](./03-agent.md)
