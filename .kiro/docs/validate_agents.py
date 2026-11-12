#!/usr/bin/env python3
"""SA Orchestrator 멀티에이전트 정적 검증 스크립트 (Kiro CLI V3 스키마 기준).

실행 전(로딩 단계) 문제를 걸러낸다:
- JSON 문법
- 허용 필드 / 필수 필드
- name == 파일명
- V3 스키마 준수: permissions.rules 구조, tools 태그, 정규식(.*) 미사용
- 오케스트레이터가 tools 의 'subagent/<이름>' 과 permissions 의 subagent 규칙으로 참조하는 에이전트가 실제 존재하는지
- 오케스트레이터가 서브에이전트를 띄울 수 있는 tools 항목을 가지는지 (CLI V3 는 toolsSettings 를 무시함)

사용법:
    python3 .kiro/docs/validate_agents.py
"""
import glob
import json
import os
import re
import sys

# 이 스크립트는 .kiro/docs/ 에 있고, 에이전트는 ../agents/ 에 있다.
_HERE = os.path.dirname(os.path.abspath(__file__))
AGENT_DIR = os.path.normpath(os.path.join(_HERE, "..", "agents"))

VALID_FIELDS = {
    "name", "description", "prompt", "mcpServers", "tools", "excludedTools",
    "toolAliases", "resources", "hooks", "permissions", "toolsSettings",
    "includeMcpJson", "includePowers", "useLegacyMcpJson", "model",
    "keyboardShortcut", "welcomeMessage",
}
REQUIRED = {"name", "description", "prompt", "tools"}
VALID_CAPS = {
    "fs_read", "fs_write", "shell", "web_fetch", "web_search", "mcp",
    "subagent", "skill", "power", "context", "diagnostics", "sandbox_network",
    "all", "builtin", "filesystem",
}
VALID_EFFECTS = {"allow", "ask", "deny"}
# 서브에이전트로 스폰될 때 동작하지 않는 도구
SUBAGENT_BLOCKED = {"grep", "glob", "web", "web_search", "web_fetch", "introspect", "thinking", "todo", "use_aws"}


def main() -> int:
    agents = {}
    problems = []
    warnings = []

    for path in sorted(glob.glob(os.path.join(AGENT_DIR, "*.json"))):
        try:
            cfg = json.load(open(path))
        except json.JSONDecodeError as e:
            problems.append(f"{os.path.basename(path)}: JSON 파싱 실패 - {e}")
            continue
        name = cfg.get("name")
        fname = os.path.basename(path)[:-5]
        agents[name] = cfg

        if name != fname:
            problems.append(f"{fname}: name '{name}' != 파일명 '{fname}'")
        for r in REQUIRED:
            if r not in cfg:
                problems.append(f"{name}: 필수 필드 '{r}' 누락")
        for k in cfg:
            if k not in VALID_FIELDS:
                warnings.append(f"{name}: 알 수 없는 필드 '{k}'")

        # V3: toolsSettings/allowedTools 없이 permissions 필요
        if "allowedTools" in cfg:
            problems.append(f"{name}: 'allowedTools'는 V3에서 제거됨 (permissions 로 이전)")
        if "permissions" not in cfg and name == fname:
            problems.append(f"{name}: V3 'permissions' 블록 없음 -> V3에서 로드 안 됨")

        # permissions.rules 구조 검증
        rules = cfg.get("permissions", {}).get("rules", [])
        for i, rule in enumerate(rules):
            cap = rule.get("capability")
            eff = rule.get("effect")
            if cap not in VALID_CAPS:
                problems.append(f"{name}: rule#{i} capability '{cap}' 유효하지 않음")
            if eff not in VALID_EFFECTS:
                problems.append(f"{name}: rule#{i} effect '{eff}' 유효하지 않음")
            for pat in rule.get("match", []) + rule.get("exclude", []):
                if re.search(r"\.\*|\\\.|\$$|\^", pat):
                    warnings.append(f"{name}: rule#{i} 패턴 '{pat}' 가 정규식처럼 보임 (V3는 글롭만 지원)")

        for t in cfg.get("tools", []):
            if t in SUBAGENT_BLOCKED:
                warnings.append(f"{name}: 도구 '{t}' 는 서브에이전트로 실행 시 동작 안 함")

    # 오케스트레이터 검증 (CLI V3: 제한은 tools 의 subagent/<이름>, 무승인 시작은 permissions 의 subagent 규칙)
    orch = agents.get("sa-orchestrator", {})
    tools = orch.get("tools", [])
    spawnable = {t.split("/", 1)[1] for t in tools if t.startswith("subagent/")}
    trusted = set()
    for rule in orch.get("permissions", {}).get("rules", []):
        if rule.get("capability") == "subagent":
            trusted |= set(rule.get("match", []))

    if "toolsSettings" in orch:
        warnings.append("sa-orchestrator: 'toolsSettings'는 CLI V3에서 무시됨 (tools 의 subagent/<이름> + permissions 의 subagent 규칙으로 이전)")
    for r in sorted(spawnable | trusted):
        if r not in agents:
            problems.append(f"sa-orchestrator: 존재하지 않는 에이전트 '{r}' 참조")
    if "subagent" not in tools and not spawnable:
        problems.append("sa-orchestrator: tools 에 'subagent' 또는 'subagent/<이름>' 없음 (서브에이전트 스폰 불가)")
    if spawnable and ({"subagent", "@builtin", "*"} & set(tools)):
        warnings.append("sa-orchestrator: tools 에 'subagent'/'@builtin'/'*' 가 함께 있어 subagent/<이름> 제한이 무력화됨")
    missing_trust = sorted(spawnable - trusted)
    if missing_trust:
        warnings.append(f"sa-orchestrator: permissions 의 subagent 규칙에 없는 에이전트 {missing_trust} -> 시작할 때 승인 프롬프트가 뜰 수 있음")

    # 승인 대기 방지 (CLI V3: 서브에이전트의 도구 호출은 부모 정책에도 허용돼야 프롬프트 없이 실행됨)
    def allows(cfg, cap):
        out = []
        for rule in cfg.get("permissions", {}).get("rules", []):
            if rule.get("capability") == cap and rule.get("effect") == "allow":
                out += rule.get("match", ["*"])
        return set(out)
    parent_shell = allows(orch, "shell")
    parent_read = allows(orch, "fs_read")
    for sub in sorted(spawnable):
        cfg = agents.get(sub)
        if not cfg:
            continue
        missing = sorted(allows(cfg, "shell") - parent_shell)
        if missing:
            warnings.append(f"{sub}: shell 허용 {missing} 가 sa-orchestrator 에 없음 -> 실행 중 승인 대기로 멈출 수 있음")
        if allows(cfg, "fs_read") and not parent_read:
            warnings.append(f"{sub}: fs_read 허용이 sa-orchestrator 에 없음 -> 파일 읽을 때마다 승인 대기")

    print("=== 로드된 에이전트 ===")
    for n in agents:
        print(" -", n)
    print("\n=== PROBLEMS (반드시 수정) ===")
    print("\n".join(problems) if problems else "(none)")
    print("\n=== WARNINGS (검토) ===")
    print("\n".join(warnings) if warnings else "(none)")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
