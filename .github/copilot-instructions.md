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
