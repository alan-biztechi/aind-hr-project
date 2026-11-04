---
inclusion: always
---

# Architecture Review Rules

## Target System
This repository is a two-tier HR/attendance application:
- Backend: Java 17 + Spring Boot 3.2.5, MyBatis over MySQL, REST + springdoc
  OpenAPI. Source under `src/`, build via `./mvnw`.
- Frontend: React 19 + TypeScript + Vite SPA under `frontend/`, calling the
  backend over HTTP (axios + TanStack Query).
Ground every finding in this actual stack; do not assume microservices, message
queues, caches, or cloud services that are not present in the codebase.

## Review Areas
- Architecture and module boundaries
- API contracts and integration patterns
- Database transactions and consistency
  - Transaction boundary placement and propagation
  - Isolation levels and locking strategy
  - Concurrency control and race conditions
  - Data consistency guarantees across services
- Fault tolerance and recovery
- Scalability and performance
- Security and observability
- Infrastructure dependencies

## Review Process
1. Identify the current architecture.
2. Find evidence in the codebase.
3. Identify verified risks.
4. Compare alternatives.
5. Explain trade-offs.
6. Recommend a practical design.
7. Define validation methods.

## Severity Criteria
Classify each finding consistently using these definitions:
- Critical: data loss or corruption, security breach, or full outage is likely;
  no safe workaround exists. Must be fixed before release.
- High: significant failure, data inconsistency, or security risk under
  realistic conditions; a workaround may exist but is fragile.
- Medium: correctness, performance, or maintainability problem that degrades the
  system but does not threaten data integrity or availability.
- Low: minor issue, style, or hardening opportunity with limited impact.

## Reporting
Produce the review as a Markdown report. For each finding, include:
- Severity: Critical, High, Medium, Low (per the criteria above)
- Location: source file and line/range, or other supporting evidence
- Problem and potential impact
- Recommended solution
- Trade-offs
- Verification approach

Report structure:
1. Summary (overall assessment + finding counts by severity)
2. Findings ordered by severity, highest first
3. Open questions / assumptions

Save the report under `.kiro/docs/` (e.g. `.kiro/docs/architecture-review-<date>.md`)
unless the user specifies another destination.

## Review Scope and Boundaries
- Architecture review is strictly read-only.
- Do not modify source files, configuration, or infrastructure during a review.
- Do not execute code, migrations, or deployment commands as part of a review.
- Recommendations and proposed designs are allowed, but implementing them
  requires a separate, explicitly approved task.
- Do not invent unsupported architecture details.
