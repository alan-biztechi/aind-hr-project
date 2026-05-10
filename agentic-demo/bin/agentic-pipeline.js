#!/usr/bin/env node
//
// W3A-8 Cursor CLI 데모 — Node 컨트롤러 (크로스플랫폼)
//   학생: node bin/agentic-pipeline.js          (또는 macOS/Linux: ./bin/agentic-pipeline.js)
//   강사: INSTRUCTOR_MODE=1 node bin/agentic-pipeline.js
//
//   Windows PowerShell 강사: $env:INSTRUCTOR_MODE='1'; node bin\agentic-pipeline.js
//
// 각 cursor-agent 호출의 stream-json 출력을 JSON 라인 단위로 파싱해서
// 텍스트 델타와 도구 호출만 .logs/<agent>.log 에 기록.
// zellij/WT 의 해당 페인이 tail -f / Get-Content -Wait 로 실시간 표시.

'use strict';

const fs       = require('node:fs');
const path     = require('node:path');
const http     = require('node:http');
const readline = require('node:readline');
const { spawn } = require('node:child_process');

const LOG_DIR    = '.logs';
const AGENTS_DIR = path.join('.cursor', 'agents');

// ── 헬퍼 ─────────────────────────────────────────────────────
const ts  = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
const say = (msg) => console.log(`[controller ${ts()}] ${msg}`);

function ensureLogsDir() {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function appendPaneLog(name, text) {
    // 페인이 tail/Get-Content -Wait 중이라 즉시 보여야 함 → sync write
    fs.appendFileSync(path.join(LOG_DIR, `${name}.log`), text);
}

// 에이전트 정의 .md 파일에서 YAML frontmatter 이후의 본문(역할 지침)만 추출
function readAgentRole(name) {
    const file = path.join(AGENTS_DIR, `${name}.md`);
    if (!fs.existsSync(file)) return null;
    const content = fs.readFileSync(file, 'utf8');
    // ^---$ 줄 기준으로 split. 첫 두 조각 = ['', frontmatter], 나머지 = 본문
    const parts = content.split(/^---\s*$/m);
    if (parts.length < 3) return content.trim();   // frontmatter 없으면 통째로
    return parts.slice(2).join('---').trim();
}

// 백엔드 헬스체크 — http://localhost:8080/v3/api-docs 가 살아있는지
function checkBackend() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:8080/v3/api-docs', { timeout: 5000 }, (res) => {
            res.resume();
            resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error',   () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

// ── 한 에이전트를 자기 로그 파일로 라우팅하면서 실행 ─────────
function runAgent(name, task) {
    return new Promise((resolve) => {
        const role = readAgentRole(name);
        if (role === null) {
            say(`❌ ${AGENTS_DIR}/${name}.md 파일이 없습니다`);
            return resolve(false);
        }

        say(`▶ ${name} 시작`);
        appendPaneLog(name, `\n[${ts()}] ▶ ${name} 시작\n\n`);

        const prompt = `${role}\n\n## 이번 작업\n${task}`;

        // Windows 에선 cursor-agent 가 .cmd 셰임으로 깔리는 경우가 있어 shell:true 로 해소
        const isWin = process.platform === 'win32';

        const child = spawn('cursor-agent', [
            '--print',
            '--force',
            '--trust',
            '--output-format', 'stream-json',
            '--stream-partial-output',
            prompt,
        ], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: isWin,    // Windows: cmd.exe 가 .cmd/.exe 확장자 자동 해소
        });

        // 원본 JSON 보존 (디버깅용)
        const rawLog    = fs.createWriteStream(path.join(LOG_DIR, `${name}.raw.log`), { flags: 'a' });
        const stderrLog = fs.createWriteStream(path.join(LOG_DIR, `${name}.stderr.log`), { flags: 'a' });
        child.stderr.pipe(stderrLog);

        // stdout 을 라인 단위로 읽어 JSON 파싱
        const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
        rl.on('line', (line) => {
            rawLog.write(line + '\n');

            let event;
            try { event = JSON.parse(line); }
            catch { return; }

            // 우리가 관심있는 건 timestamp_ms 가 있는 assistant 이벤트의 content
            if (event.type !== 'assistant' || !event.timestamp_ms) return;
            const blocks = (event.message && event.message.content) || [];
            for (const c of blocks) {
                if (c.type === 'text' && typeof c.text === 'string') {
                    appendPaneLog(name, c.text);
                } else if (c.type === 'tool_use' && c.name) {
                    appendPaneLog(name, `\n[🔧 ${c.name}]\n`);
                }
            }
        });

        child.on('close', (code) => {
            rawLog.end();
            stderrLog.end();
            appendPaneLog(name, `\n\n[${ts()}] ✅ ${name} 완료 (exit ${code})\n`);
            say(`✅ ${name} 완료`);
            resolve(code === 0);
        });

        child.on('error', (err) => {
            const msg = `cursor-agent 실행 에러: ${err.message}`;
            say(`❌ ${name} ${msg}`);
            appendPaneLog(name, `\n[${ts()}] ❌ ${msg}\n`);
            resolve(false);
        });
    });
}

// ── 메인 파이프라인 ─────────────────────────────────────────
async function main() {
    ensureLogsDir();

    // 백엔드 헬스체크
    say('▶ 백엔드 헬스체크 (http://localhost:8080)');
    const ok = await checkBackend();
    if (!ok) {
        say('❌ 백엔드(:8080) 응답 없음.');
        say('   상위 폴더(aind-hr-project)에서 백엔드를 먼저 실행하세요:');
        say('     macOS/Linux: ./mvnw spring-boot:run');
        say('     Windows:     .\\mvnw.cmd spring-boot:run');
        process.exit(1);
    }
    say('✅ 백엔드 OK');

    // 1. planner (순차)
    await runAgent('planner',
        'AGENTS.md, PLAN.md 기반으로 TASKS.md를 생성해줘.');

    // 2. scaffolder (순차)
    await runAgent('scaffolder',
        'TASKS.md 기준으로 web-dashboard/ 서브폴더에 Vite/React/TS/Tailwind/Recharts 셋업.');

    // 3. api-integrator (순차) — types.ts + src/api/*.ts 작성, 컴포넌트는 손대지 않음
    await runAgent('api-integrator',
        'TASKS.md 기준으로 백엔드를 curl로 학습한 뒤 web-dashboard/src/api/, src/types.ts 작성. 컴포넌트는 손대지 말 것.');

    // 4. ui-builder (순차) — api-integrator 산출물 import + useEffect 연결까지
    await runAgent('ui-builder',
        'TASKS.md 기준으로 web-dashboard/src/components/ 컴포넌트 작성. api-integrator가 만든 src/api/*.ts, src/types.ts 를 import 해서 useEffect 연결까지 본인이 마무리.');

    // 5. verifier (순차)
    await runAgent('verifier',
        'cd web-dashboard 후 npm run build 검증, 에러는 직접 수정. 결과를 RESULT.md에 기록.');

    // 6. release-engineer — 강사 모드만
    if (process.env.INSTRUCTOR_MODE === '1') {
        await runAgent('release-engineer',
            'web-dashboard/dist/ 를 AWS S3로 배포하고 공개 URL을 RESULT.md에 추가.');
    } else {
        say('⏭  release-engineer 건너뜀 (강사 모드: INSTRUCTOR_MODE=1)');
    }

    say('🎉 파이프라인 완료. RESULT.md 확인.');
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
