# AIND HR Frontend

AIND HR 백엔드(Spring Boot, `/v1/*` REST API)를 사용하는 React 관리자 웹 프론트엔드입니다.
부서 / 직원 / 출퇴근 / 휴가 4개 도메인을 조회·관리할 수 있는 SPA입니다.

## 기술 스택

버전은 npm 공식 레지스트리의 안정 릴리스를 기준으로 고정했습니다. TypeScript만 생태계 호환을 고려해
`latest`(7.x) 대신 검증된 5.9를 사용합니다.

| 영역 | 패키지 | 버전 |
|------|--------|------|
| 빌드 | Vite | ^8.3.5 |
| React | react / react-dom | ^19.3.1 |
| 라우팅 | react-router-dom | ^7.18.4 |
| 서버 상태 | @tanstack/react-query | ^5.104.5 |
| HTTP | axios | ^1.20.0 |
| 폼 | react-hook-form | ^7.90.0 |
| 언어 | typescript | ~5.9.3 |

## 사전 준비

### 1. Node 버전

Vite 8 / React Router 7은 **Node `^20.19.0 || >=22.12.0`** 를 요구합니다.

```bash
node -v   # 20.19 이상인지 확인
```

### 2. 백엔드 먼저 실행

프로젝트 루트(`../`)의 README 절차에 따라 Spring Boot 백엔드를 먼저 띄웁니다.
기본 주소는 `http://localhost:8080` 입니다.

```bash
cd ..
./mvnw spring-boot:run
```

## 실행

```bash
# frontend 디렉터리에서
npm install
npm run dev
```

개발 서버: http://localhost:5173

Vite dev 서버가 `/v1/*` 요청을 `http://localhost:8080`으로 프록시하므로 별도 CORS 설정이 필요 없습니다.

## 환경변수

`.env.example`을 복사해 `.env`를 만들어 설정합니다.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE_URL` | (빈 값) | API 베이스 URL. 비워 두면 dev 프록시(상대 경로 `/v1`)를 사용. 프로덕션 배포 시 실제 호스트 지정 |
| `VITE_PROXY_TARGET` | `http://localhost:8080` | dev 프록시가 가리킬 백엔드 주소 |

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 타입 체크(`tsc --noEmit`) 후 프로덕션 빌드 |
| `npm run typecheck` | 타입 체크만 수행 |
| `npm run preview` | 빌드 결과 미리보기 |

## 폴더 구조

```
src/
├── api/          # axios 클라이언트 + 도메인별 API 함수
├── hooks/        # TanStack Query 훅 (useQuery/useMutation)
├── types/        # 백엔드 DTO 대응 TypeScript 타입
├── components/
│   ├── layout/   # AppLayout (사이드바 + Outlet)
│   ├── common/   # DataTable, Modal, StatusBadge, Spinner, ErrorState ...
│   └── forms/    # 도메인별 폼
└── pages/        # 라우트 단위 화면
```

## 참고

- 휴가 승인/반려 API가 백엔드에 없어 휴가 화면은 **조회 + 신청**까지만 제공합니다.
- 휴가 목록 응답에는 직원명이 없어 직원 목록과 `employeeId`로 조인해 이름을 표시합니다.
- 인증/권한은 백엔드에 없으므로 프론트엔드도 로그인 없이 동작합니다(실습 범위).
