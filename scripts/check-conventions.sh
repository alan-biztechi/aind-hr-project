#!/usr/bin/env bash
# .kiro/steering/code-conventions.md 의 C1~C10 을 검사한다.
# 사용법 (프로젝트 루트에서): bash scripts/check-conventions.sh
# 위반이 없으면 종료 코드 0, 있으면 1.
set -u

J=src/main/java/com/aind/hr
M=src/main/resources/mapper
fail=0

report() { # $1=규칙 $2=위치 $3=설명
  echo "[$1] $2 — $3"
  fail=1
}

# C1 @Autowired 금지
while IFS= read -r l; do report C1 "$l" "@Autowired 대신 @RequiredArgsConstructor + private final"; done \
  < <(grep -rn '@Autowired' src/main/java | cut -d: -f1,2)

# C2 콘솔 출력 금지
while IFS= read -r l; do report C2 "$l" "System.out / System.err / printStackTrace 금지"; done \
  < <(grep -rnE 'System\.(out|err)|printStackTrace\(' src/main/java | cut -d: -f1,2)

# C3 ${} 금지
while IFS= read -r l; do report C3 "$l" "\${} 대신 #{} 바인딩"; done \
  < <(grep -rn '\${' "$M" | cut -d: -f1,2)

# C4 namespace = Repository FQCN (파일이 실제로 존재해야 함)
for x in "$M"/*.xml; do
  ns=$(grep -o 'namespace="[^"]*"' "$x" | head -1 | sed 's/namespace="//;s/"//')
  f="src/main/java/$(echo "$ns" | tr . /).java"
  [ -n "$ns" ] && [ -f "$f" ] || report C4 "$x" "namespace '$ns' 에 해당하는 Repository가 없음"
done

# C5 Repository 에 @Mapper
for f in "$J"/repository/*.java; do
  grep -q '@Mapper' "$f" || report C5 "$f" "@Mapper 누락"
done

# C6 Service 에 @Service + @RequiredArgsConstructor
for f in "$J"/service/*.java; do
  grep -q '@Service' "$f" || report C6 "$f" "@Service 누락"
  grep -q '@RequiredArgsConstructor' "$f" || report C6 "$f" "@RequiredArgsConstructor 누락"
done

# C7~C9 Controller
for f in "$J"/controller/*.java; do
  grep -q '@RequestMapping("/v1/' "$f" || report C7 "$f" '@RequestMapping("/v1/...") 누락'
  grep -q '@Tag(' "$f" || report C7 "$f" "@Tag 누락"

  maps=$(grep -cE '@(Get|Post|Put|Patch|Delete)Mapping' "$f")
  ops=$(grep -c '@Operation' "$f")
  [ "$maps" -eq "$ops" ] || report C8 "$f" "매핑 $maps 개, @Operation $ops 개 (모든 매핑에 @Operation 필요)"
  while IFS= read -r l; do report C8 "$f:$l" "produces = MediaType.APPLICATION_JSON_VALUE 누락"; done \
    < <(grep -nE '@(Get|Post|Put|Patch|Delete)Mapping' "$f" | grep -v produces | cut -d: -f1)

  while IFS= read -r l; do report C9 "$f:$l" "public 메서드는 ResponseEntity<...> 반환"; done \
    < <(grep -nE '^\s+public ' "$f" | grep -v ResponseEntity | cut -d: -f1)
done

# C10 new RuntimeException 금지
while IFS= read -r l; do report C10 "$l" "CustomException(ErrorCode.XXX) 사용"; done \
  < <(grep -rn 'new RuntimeException' src/main/java | cut -d: -f1,2)

if [ "$fail" -eq 0 ]; then
  echo "컨벤션 검사 통과 (C1~C10)"
fi
exit "$fail"
