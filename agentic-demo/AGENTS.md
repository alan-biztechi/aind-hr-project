# 프로젝트 규칙 (모든 서브에이전트 공통)

## 작업 디렉터리
- 모든 FE 작업은 **이 폴더 안의 `web-dashboard/` 서브폴더** 안에서 일어난다.
- 이 폴더 밖 (`../src/`, `../pom.xml` 등 백엔드 파일) 은 **읽지도 쓰지도 않는다**.
- 백엔드 API는 **실행 중인 서버 (`http://localhost:8080`) 를 curl로 조회** 해서만 학습한다.

## 기술 스택 (고정)
- React 18 + TypeScript + Vite
- Tailwind CSS 3
- Recharts
- 백엔드: http://localhost:8080 (Spring Boot, 이미 동작 중, *수정 금지*)
- 환경 변수: `import.meta.env.VITE_API_BASE_URL`

## CORS 처리 규약 (고정 — 시행착오 금지)

브라우저에서 `http://localhost:5173` (Vite dev) → `http://localhost:8080` (Spring) 직접 호출은 *cross-origin* 이고, 백엔드에 `Access-Control-Allow-Origin` 응답 헤더가 없어 차단됩니다. *백엔드 수정은 금지* 이므로 *Vite 개발 서버 프록시* 로 우회합니다.

- `vite.config.ts` 의 `server.proxy` 에서 `'/api' → http://localhost:8080` 로 매핑하고 `/api` 접두사를 rewrite 로 제거 (scaffolder 책임)
- `.env.local` 의 `VITE_API_BASE_URL` 은 *항상 `/api`* (절대 URL이 아님)
- 프론트엔드 fetch URL은 `${VITE_API_BASE_URL}/v1/employees` → 실제로 `/api/v1/employees` → Vite 가 `http://localhost:8080/v1/employees` 로 프록시
- *호스트(`http://localhost:8080`) 를 코드에 직접 박지 않는다* — 항상 환경 변수 + 상대 경로
- 학습용 curl(api-integrator)은 직접 `http://localhost:8080/...` 호출해도 됨 (서버↔서버 호출이라 CORS 없음). 학습한 결과로 *생성하는 코드만* `/api/...` 형태 사용.

## 코드 컨벤션
- 컴포넌트: 함수형 + named export
- API 호출: `web-dashboard/src/api/*.ts` 로 모음, fetch 사용
- 타입: `web-dashboard/src/types.ts` 한 곳에 모음
- API 엔드포인트는 *항상* `${import.meta.env.VITE_API_BASE_URL}/v1/...` 형태 (위 CORS 규약 참고)

## 비목표
- 라우터 설치하지 않음 (단일 페이지)
- 인증/로그인 없음
- 데이터 수정/삭제 기능 없음 (조회 전용)
- 백엔드 코드 수정 없음

## 완료 조건
- `cd web-dashboard && npm run build` 가 성공
- `cd web-dashboard && npm run dev` 후 직원 목록과 부서 차트가 렌더링
- `RESULT.md` 에 빌드/실행 결과 기록

## API 학습 방식
실제 백엔드 응답을 직접 보고 타입을 만든다. 추측 금지:

```bash
# OpenAPI 스펙 통째로
curl -s http://localhost:8080/v3/api-docs | jq .

# 실제 응답 형태 (필드명·타입 그대로 미러링)
curl -s http://localhost:8080/v1/employees | jq '.[0]'
curl -s http://localhost:8080/v1/departments | jq '.[0]'
```
