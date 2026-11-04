---
inclusion: always
---

# Security Rules

> Precedence: these security rules take priority over architecture-rules.md and
> engineering-rules.md whenever they conflict.

## Data Protection
- Never expose credentials, tokens or secrets.
- Do not include personal or confidential data in outputs.
- Use only approved project information.
- Respect repository access and data handling policies.
- If hardcoded secrets are found in the codebase (e.g. DB passwords in
  `application.yml`/`application.properties`, API keys, tokens), report them by
  key name and location only. Never echo the secret value. Recommend moving it
  to an environment variable or secret manager. Do not commit a fix that still
  contains the live value.

## Defining "Production"
Treat as production anything that touches real/shared resources:
- The deployed MySQL database or any non-local DB connection string
- Remote/shared environments (anything that is not the developer's local
  machine, local MySQL, or an in-memory/test database)
- Live deployment targets and their configuration
Local development and test resources are not production.

## Infrastructure
- Do not access or modify production infrastructure (see definition above).
- Do not modify production databases, and do not run DDL/DML against any shared
  database. Schema/data changes go through reviewed migration scripts.
- Do not run destructive shell commands without explicit approval. Destructive
  includes, but is not limited to:
  - `rm -rf`, bulk/recursive deletes outside build output
  - `git push --force`, `git reset --hard`, `git clean -fd`, branch deletion
  - `DROP`/`TRUNCATE`/unscoped `DELETE`/`UPDATE` on any database
  - overwriting or deleting `.env`, credential files, or `application-*.yml`
  Removing regenerable local build output (`target/`, `dist/`, `node_modules/`)
  is acceptable.

## Tool Restrictions
- Do not connect to unapproved external services.
- Do not install packages without approval.

## Change Control
- Require explicit approval before implementation.
- Never claim that a security check or test passed
  unless it was actually executed.
