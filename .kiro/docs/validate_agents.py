#!/usr/bin/env python3
"""SA Orchestrator 멀티에이전트 정적 검증 스크립트 (Kiro CLI V3 스키마 기준).

실행 전(로딩 단계) 문제를 걸러낸다:
- JSON 문법
- 허용 필드 / 필수 필드
- name == 파일명
- V3 스키마 준수: permissions.rules 구조, tools 태그, 정규식(.*) 미사용
- 오케스트레이터의 subagent 참조가 실제 존재하는 에이전트인지
- 오케스트레이터가 subagent 도구를 가지는지

사용법:
    python3 .kiro/agents/validate_agents.py
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

    # 오케스트레이터 참조 검증
    orch = agents.get("sa-orchestrator", {})
    sub = orch.get("toolsSettings", {}).get("subagent", {})
    referenced = set(sub.get("availableAgents", [])) | set(sub.get("trustedAgents", []))
    for r in referenced:
        if r != "default" and "*" not in r and r not in agents:
            problems.append(f"sa-orchestrator: 존재하지 않는 에이전트 '{r}' 참조")
    if "subagent" not in orch.get("tools", []):
        problems.append("sa-orchestrator: tools 에 'subagent' 없음 (서브에이전트 스폰 불가)")

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
