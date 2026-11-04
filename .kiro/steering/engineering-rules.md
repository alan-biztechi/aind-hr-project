---
inclusion: always
---

# Engineering Rules

## Technology Stack
Backend (`src/`, `pom.xml`):
- Java 17, Spring Boot 3.2.5 (spring-boot-starter-web, validation)
- MyBatis (mybatis-spring-boot-starter 3.0.3) over MySQL (mysql-connector-j)
- springdoc-openapi (webmvc-ui 2.5.0) for API docs
- Lombok for boilerplate reduction
- Build/test via the Maven wrapper (`./mvnw`)

Frontend (`frontend/`):
- React 19, TypeScript ~5.9, Vite
- TanStack Query (server state), axios (HTTP), react-hook-form, react-router-dom
- Node `^20.19.0 || >=22.12.0`

## General
- Inspect the existing codebase before making suggestions.
- Follow the project's actual technology stack above; do not introduce a new
  framework, ORM, or state-management library without explicit approval.
- Prefer simple, maintainable solutions.
- Avoid unnecessary abstractions and dependencies.
- Preserve backward compatibility.

## Development
- Follow existing coding conventions.
- Handle exceptions explicitly and keep transaction boundaries correct when
  writing or changing code.
- Write concurrency-safe code and avoid introducing data races.
- Use official documentation when external references are available.

> Note: Deep review of transactions, concurrency, and data consistency at the
> design level is governed by architecture-rules.md. This file covers only the
> implementation discipline developers follow while writing code.

## Build and Test Commands
Run from the repository root. Verify changes before reporting them as done.

Backend:
- Compile: `./mvnw compile`
- Run tests: `./mvnw test`
- Full build (compile + test + package): `./mvnw verify`
- Run a single test: `./mvnw test -Dtest=ClassName#methodName`

Frontend (run inside `frontend/`):
- Type-check: `npm run typecheck`
- Build (type-check + bundle): `npm run build`
- Dev server (do not run in automation; the user runs this manually): `npm run dev`

> There is no configured frontend test runner yet. If tests are needed,
> propose a setup (e.g. Vitest) and get approval before adding it.

## Quality
- Separate verified facts from assumptions.
- Reference source files for technical findings.
- Recommend relevant automated tests, and run existing ones with the commands
  above after making changes.
- Never fabricate execution or performance results. If a command was not run,
  say so explicitly.

## Rule Precedence
- When rules conflict, order of precedence is: security-rules.md first, then
  architecture-rules.md, then engineering-rules.md.
- Backend-specific rules (transactions, MyBatis mappers, MySQL) do not apply to
  frontend-only changes, and vice versa.
