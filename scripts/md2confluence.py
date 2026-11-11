#!/usr/bin/env python3
"""실습 Markdown -> Confluence Wiki Markup 변환기 (표준 라이브러리만 사용).

사용법 (프로젝트 루트에서):
    python3 scripts/md2confluence.py docs/실습 docs/confluence

변환 규칙
- '> 💡' 인용 -> {tip} 패널, '> ⚠️' -> {warning} 패널, 그 외 인용 -> {info} 패널
- ``` 코드 블록 -> {code:language=...} 매크로
- 표 -> ||헤더|| / |셀| 형식
- 실습 문서 간 링크 -> Confluence 페이지 링크 [라벨|페이지 제목]
- 문서 첫 H1 -> 페이지 제목으로 사용하므로 본문에서는 제거
- 구버전 DB 호환을 위해 BMP 밖 이모지는 제거
"""
import re
import sys
from pathlib import Path

LANG = {
    "bash": "bash", "sh": "bash", "shell": "bash",
    "java": "java", "xml": "xml", "sql": "sql", "html": "html",
    "json": "javascript", "jsonc": "javascript",
    "javascript": "javascript", "js": "javascript",
    "ts": "javascript", "tsx": "javascript", "typescript": "javascript",
    "python": "python", "py": "python",
}

LIST_RE = re.compile(r"^(\s*)([-*+]|\d+\.)\s+(.*)$")
SPECIAL = re.compile(r"([{}\[\]|^~*])")
TITLES = {}  # 파일명 -> 페이지 제목


def esc(s):
    return SPECIAL.sub(r"\\\1", s)


def plain(s):
    return re.sub(r"[*`]", "", s).strip()


def inline(text):
    codes, links = [], []

    def stash_code(m):
        codes.append("{{" + esc(m.group(1)) + "}}")
        return "\x00C%d\x00" % (len(codes) - 1)

    text = re.sub(r"`([^`]+)`", stash_code, text)

    def stash_link(m):
        label, url = m.group(1), m.group(2).strip()
        if url.startswith(("http://", "https://")):
            links.append("[%s|%s]" % (esc(label), url))
        else:
            title = TITLES.get(Path(url.split("#")[0]).name)
            links.append("[%s|%s]" % (esc(label), title) if title else esc(label))
        return "\x00L%d\x00" % (len(links) - 1)

    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", stash_link, text)

    def stash_auto(m):
        links.append("[%s]" % m.group(1))
        return "\x00L%d\x00" % (len(links) - 1)

    text = re.sub(r"<(https?://[^>\s]+)>", stash_auto, text)
    text = re.sub(r"\*\*(.+?)\*\*", "\x01\\1\x01", text)
    text = esc(text).replace("\x01", "*")
    text = re.sub(r"\x00L(\d+)\x00", lambda m: links[int(m.group(1))], text)
    text = re.sub(r"\x00C(\d+)\x00", lambda m: codes[int(m.group(1))], text)
    return text


def panel_kind(first_line):
    t = first_line.lstrip()
    for em, kind in (("\U0001F4A1", "tip"), ("\u26A0", "warning"), ("\U0001F4CE", "info")):
        if t.startswith(em):
            return kind, t[len(em):].lstrip("\ufe0f").lstrip()
    return "info", first_line


def cells(row):
    row = row.strip()
    if row.startswith("|"):
        row = row[1:]
    if row.endswith("|") and not row.endswith("\\|"):
        row = row[:-1]
    return [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", row)]


def blocks(lines, hard=False):
    out, para, stack = [], [], []
    n, i = len(lines), 0
    run_end, ord_para = 0, False

    def flush():
        nonlocal para
        if para:
            sep = " \\\\\n" if hard else " "
            out.append(sep.join(inline(p.strip()) for p in para))
            para = []

    def run_info(start):
        j, fence = start, False
        while j < n:
            l = lines[j]
            t = l.strip()
            if t == "":
                j += 1
                continue
            if t.startswith("```"):
                if l[0] in " \t":
                    fence = True
                    j += 1
                    while j < n and not lines[j].strip().startswith("```"):
                        j += 1
                    j += 1
                    continue
                return fence, j
            if l[0] in " \t" or LIST_RE.match(l):
                j += 1
                continue
            return fence, j
        return fence, n

    while i < n:
        line = lines[i]
        s = line.strip()

        if s.startswith("```"):  # 코드 블록
            flush()
            stack.clear()
            indent = len(line) - len(line.lstrip())
            lang = s[3:].strip().lower()
            code, i = [], i + 1
            while i < n and not lines[i].strip().startswith("```"):
                l = lines[i]
                code.append(l[indent:] if l[:indent].strip() == "" else l)
                i += 1
            i += 1
            m = LANG.get(lang)
            out.append("{code:language=%s}" % m if m else "{code}")
            out.extend(code)
            out.append("{code}")
            continue

        if s == "":
            flush()
            out.append("")
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:  # 제목
            flush()
            stack.clear()
            level = len(m.group(1))
            if level == 1 and "__title__" not in TITLES:
                TITLES["__title__"] = plain(m.group(2))
            else:
                out.append("h%d. %s" % (level, inline(m.group(2))))
            i += 1
            continue

        if re.match(r"^\s*-{3,}\s*$", line):  # 구분선
            flush()
            stack.clear()
            out.append("----")
            i += 1
            continue

        if s.startswith(">"):  # 인용 -> 패널
            flush()
            stack.clear()
            raw = []
            while i < n and lines[i].strip().startswith(">"):
                raw.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            chunks, cur = [], []
            for l in raw:
                if l.strip() == "":
                    if cur:
                        chunks.append(cur)
                    cur = []
                else:
                    cur.append(l)
            if cur:
                chunks.append(cur)
            for ch in chunks:
                kind, rest = panel_kind(ch[0])
                ch[0] = rest
                out.append("{%s}" % kind)
                out.extend(blocks(ch, hard=True))
                out.append("{%s}" % kind)
                out.append("")
            continue

        if s.startswith("|") and i + 1 < n and re.match(
                r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$", lines[i + 1]):
            flush()
            stack.clear()
            head = cells(line)
            out.append("||" + "||".join(inline(c) or " " for c in head) + "||")
            i += 2
            while i < n and lines[i].strip().startswith("|"):
                out.append("|" + "|".join(inline(c) or " " for c in cells(lines[i])) + "|")
                i += 1
            continue

        lm = LIST_RE.match(line)
        if lm:  # 목록
            flush()
            if i >= run_end:
                has_fence, run_end = run_info(i)
                ord_para = has_fence
            indent, mark, text = len(lm.group(1).expandtabs(4)), lm.group(2), lm.group(3)
            tm = re.match(r"^\[( |x|X)\]\s+(.*)$", text)
            if tm:
                text = ("\u2610 " if tm.group(1) == " " else "\u2611 ") + tm.group(2)
            ordered = mark[0].isdigit()
            if ordered and ord_para and indent == 0:
                stack.clear()
                out.append("%s %s" % (mark, inline(text)))  # 코드 블록이 끼면 번호 유지를 위해 문단으로 출력
            else:
                typ = "#" if ordered else "*"
                while stack and stack[-1][0] > indent:
                    stack.pop()
                if stack and stack[-1][0] == indent:
                    stack[-1] = (indent, typ)
                else:
                    stack.append((indent, typ))
                out.append("%s %s" % ("".join(t for _, t in stack), inline(text)))
            i += 1
            continue

        if stack and line[0] in " \t":  # 목록 항목 이어쓰기
            out[-1] += " " + inline(s)
            i += 1
            continue

        stack.clear()
        para.append(line)
        i += 1

    flush()
    return out


def clean(text):
    text = text.replace("\ufe0f", "").replace("\U0001F6AB", "\u274C")
    return re.sub("[\U00010000-\U0010ffff]", "", text)


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: md2confluence.py <입력 디렉터리> <출력 디렉터리>")
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    files = sorted(src.glob("*.md"))
    for f in files:  # 1차: 페이지 제목 수집 (페이지 링크 해석용)
        TITLES.pop("__title__", None)
        for l in f.read_text(encoding="utf-8").splitlines():
            if l.startswith("# "):
                TITLES[f.name] = plain(l[2:])
                break
    dst.mkdir(parents=True, exist_ok=True)
    print("파일 -> Confluence 페이지 제목")
    for f in files:
        TITLES.pop("__title__", None)
        body = blocks(f.read_text(encoding="utf-8").splitlines())
        text = clean("{toc:minLevel=2|maxLevel=3}\n\n" + "\n".join(body).strip() + "\n")
        (dst / (f.stem + ".confluence.txt")).write_text(text, encoding="utf-8")
        print("  %s -> %s" % (f.name, TITLES[f.name]))


if __name__ == "__main__":
    main()
