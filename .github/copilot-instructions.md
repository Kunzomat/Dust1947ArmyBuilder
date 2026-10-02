# Dust1947 Copilot Instructions

- Inspect the existing code and project structure before modifying anything.
- Reuse the existing architecture and conventions already used in this repository.
- The application consists of a React frontend, a PHP backend, and a MySQL database running in Kubernetes.
- PHP commands must be executed in the Kubernetes PHP container when PHP is unavailable on the Windows host.
- Use the namespace `dust1947` for all kubectl commands.
- Do not create a new Kubernetes environment, new database, replacement container setup, or Docker Compose setup.
- Reuse the existing Kubernetes resources and current cluster configuration.
- Before proposing database changes, inspect the actual schema and migration files in the repository.
- Do not modify database schemas just to work around an application bug without confirming the underlying root cause.
- Do not execute destructive SQL without explicit approval.
- Do not delete Kubernetes resources or persistent volumes without explicit approval.
- Verify changes whenever possible with the smallest relevant check.
- Keep changes focused on the requested task and avoid unrelated refactors.
- Prefer existing patterns and scripts already in the repo over creating new ones.

## Multi-agent development system

This repository uses a small set of custom agents, defined in
`.github/agents/*.agent.md`, that are exclusive to this project (never
reference Toolineo or any other project/agent system):

- **Dust-Master** (`dust-master.agent.md`) — the user's primary interface.
  Discusses requirements, inspects the project when needed, creates
  implementation plans, and coordinates the other agents. Does not implement
  features itself unless explicitly requested.
- **Dust-Dev** (`dust-dev.agent.md`) — owns implementation: React frontend
  (`dust1947-frontend/src`), PHP backend (`backend/*.php`), SQL
  schema/migrations (`backend/database/*.sql`), and Dust 1947 game logic /
  point calculation. Must not deploy, restart pods, import databases, or
  otherwise operate the runtime.
- **Dust-Ops** (`dust-ops.agent.md`) — owns the runtime: namespace
  `dust1947` (Rancher Desktop/Kubernetes), the Apache/PHP pod, MySQL, database
  backup/restore (`scripts/db/export-db-dump.ps1`,
  `scripts/db/import-db-dump.ps1`), migrations, deployment, pod
  restart/log inspection, and environment health. Must create a database
  backup before any potentially destructive database change.
- **Dust-Test** (`dust-test.agent.md`) — owns verification: browser/E2E
  testing of the running application as a real user (a required capability;
  no new test framework such as Playwright/Cypress is installed yet — that
  choice is pending), the existing Jest tests, API verification, and
  read-only database verification. Runs baseline tests before changes and
  feature/regression tests after deployment. Must not change
  application/implementation code just to make a test pass.

**Default workflow once the user approves an implementation:**

1. Dust-Ops verifies environment health.
2. Dust-Test establishes a baseline.
3. Dust-Dev implements the requested feature.
4. Dust-Ops deploys/applies the runtime changes.
5. Dust-Test verifies the feature and runs relevant regression tests.
6. Dust-Master evaluates the result and reports back to the user.

If verification fails, Dust-Master determines whether the failure belongs to
implementation, environment/deployment, or the test itself, then delegates
accordingly. For implementation defects the loop is
`Dust-Dev -> Dust-Ops -> Dust-Test`, repeated until successful or until a
decision from the user is required. All agents must use the actual commands,
paths, and architecture of this repository rather than inventing alternative
infrastructure, and all agents must respect the destructive-operation
approval rules above.
