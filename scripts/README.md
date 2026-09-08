# Scripts Index

Aktive Skripte fuer das aktuelle Rancher-Desktop-Setup:

- `scripts/init-project-config.ps1`
  - Erstellt `project.config.json` aus `project.config.example.json`.
  - Erzeugt daraus auch `backend/config.local.php` und `dust1947-frontend/.env.local`.
  - Lokale Runtime-Konfiguration (nicht im Git).

- `scripts/db/export-db-dump.ps1`
  - Exportiert einen SQL-Dump aus dem laufenden MySQL-Pod.
  - Liest das Root-Passwort aus dem Kubernetes Secret `mysql-secret`.

- `scripts/db/import-db-dump.ps1`
  - Importiert einen SQL-Dump in den laufenden MySQL-Pod.
  - Liest ebenfalls das Root-Passwort aus `mysql-secret`.

Hinweis: Legacy-XAMPP- und Recovery-Skripte wurden entfernt.

## Konfiguration (ein zentrales File)

Single Source of Truth im Projekt-Root:
- `project.config.example.json` (im Git)
- `project.config.json` (lokal, aus Example erzeugt, nicht im Git)

Erzeugen:
`powershell -ExecutionPolicy Bypass -File scripts/init-project-config.ps1`

Prioritaet pro Wert:
1) CLI-Parameter
2) Umgebungsvariablen
3) `project.config.json` (lokal)
4) sinnvolle Fallbacks (z. B. aktueller kube namespace / `root`)


Unterstuetzte Umgebungsvariablen:
- `DUST_DB_NAMESPACE`
- `DUST_DB_NAME`
- `DUST_DB_USER`
- `DUST_DB_LABEL`
- `DUST_DB_SECRET`
- `DUST_DB_SECRET_KEY`

