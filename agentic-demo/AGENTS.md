# 프로젝트 규칙 (모든 서브에이전트 공통)

## 작업 디렉터리
- 모든 FE 작업은 **이 폴더 안의 `web-dashboard/` 서브폴더** 안에서 일어난다.
- 이 폴더 밖 (`../src/`, `../pom.xml` 등 백엔드 파일) 은 **읽지도 쓰지도 않는다**.
- 백엔드 API는 **실행 중인 서버 (`http://localhost:8080`) 를 curl로 조회** 해서만 학습한다.

## 기술 스택 (고정)
- React 18 + TypeScript + Vite
- Tailwind CSS 3
- Recharts
- 백엔드: http://localhost:8080 (Spring Boot, 이미 동작 중)
- 환경 변수: `import.meta.env.VITE_API_BASE_URL`

## 코드 컨벤션
- 컴포넌트: 함수형 + named export
- API 호출: `web-dashboard/src/api/*.ts` 로 모음, fetch 사용
- 타입: `web-dashboard/src/types.ts` 한 곳에 모음

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
