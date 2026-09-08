# Dust 1947 Army Builder 🎲

Full-Stack-Anwendung zum Erstellen von Armeen für Dust 1947.

## 🚀 Quick Start - Lokale Entwicklung

### Voraussetzungen
- Node.js (v18+ empfohlen)
- Rancher Desktop (mit `kubectl`)
- Laufende Kubernetes-Ressourcen im Namespace `dust1947` (`apache`, `mysql`)

### Setup in 4 Schritten:

1. **Backend/DB in Rancher Desktop starten**
   ```bash
   kubectl get pods -n dust1947
   ```
   Erwartet: Pods `apache` und `mysql` sind `Running`.

2. **Datenbank initialisieren (falls leer)**
   ```bash
   # Schema-Datei liegt hier:
   # backend/database/schema.sql
   # Import z. B. per MySQL-Client in den laufenden mysql-Pod.
   ```

3. **Lokale Frontend-Umgebung erstellen**
   ```bash
   cd dust1947-frontend
   copy .env.local.example .env.local
   ```
   Danach bei Bedarf `.env.local` pro Rechner anpassen (wird nicht in Git gespeichert).

4. **Development Server starten**
   ```bash
   cd dust1947-frontend
   npm start
   ```

Das war's! 🎉

- **Frontend:** http://localhost:3000
- **Backend (Apache/PHP Service):** http://localhost:8180

---

## 📁 Projektstruktur

```
dust1947/
├── backend/                    # PHP Backend
│   ├── army_api.php           # Haupt-API
│   ├── auth.php               # Authentifizierung
│   ├── db_connection.php      # DB-Verbindung
│   ├── config.local.php       # Lokale Config (git-ignored)
│   └── database/
│       └── schema.sql         # Datenbank-Schema
├── dust1947-frontend/         # React Frontend
│   ├── src/
│   │   ├── App.js
│   │   └── apiClient.js       # API-Client
│   └── .env.local             # Lokale Umgebung (git-ignored)
├── docs/                      # Projekt-Dokumentation
├── scripts/                   # Hilfs-/Migrationsskripte
└── README.md
```

---

## 🔄 Umgebungen

### Lokal entwickeln
```bash
# Backend/DB Status (Rancher Desktop)
kubectl get pods -n dust1947

# Frontend
cd dust1947-frontend
npm start
```

**Nutzt automatisch:**
- `.env.local` für Frontend
- `config.local.php` für Backend

### Production Build
```bash
cd dust1947-frontend
npm run build
```

**Nutzt automatisch:**
- `.env.production` für Frontend
- Remote-Datenbank für Backend

---

## 🛠 Manuelle Installation

Siehe `docs/setup/SETUP_LOCAL.md` für detaillierte Anleitung.

---

## 📝 API Endpoints

### Armies
- `GET /army_api.php?action=armies.list` - Alle Armeen
- `GET /army_api.php?action=armies.get&id=1` - Army Details
- `POST /army_api.php?action=armies.create` - Neue Army
- `POST /army_api.php?action=armies.update` - Army bearbeiten
- `POST /army_api.php?action=armies.delete` - Army löschen

### Units
- `GET /army_api.php?action=unit.list` - Alle Units
- `GET /army_api.php?action=unit.get&id=1` - Unit Details
- `POST /army_api.php?action=army.units.add` - Unit zur Army hinzufügen

### Platoons
- `GET /army_api.php?action=platoons.list&bloc_id=1` - Platoons eines Blocs
- `POST /army_api.php?action=army.platoons.add` - Platoon zur Army
- `POST /army_api.php?action=army.platoons.remove` - Platoon entfernen

---

## 🔐 Authentifizierung

Alle API-Requests benötigen einen `X-API-Key` Header.

**Lokal:** `local-dev-key-12345` (siehe `.env.local`)
**Production:** Eigener Key (siehe `.env.production`)

---

## 🐛 Troubleshooting

### "Connection refused"
✅ Pods laufen im Namespace `dust1947`?

```bash
curl -H "X-API-Key: local-dev-key-12345" "http://localhost:8180/army_api.php?action=blocs.list"
```

✅ API erreichbar auf Port `8180`?

```bash
curl -H "X-API-Key: local-dev-key-12345" "http://localhost:8180/army_api.php?action=blocs.list"
```

### "Access denied"
✅ Datenbank-Zugangsdaten in `backend/config.local.php` passen zum MySQL-Pod/Secret?

### CORS-Fehler
✅ Backend läuft auf Port `8180`?
✅ `dust1947-frontend/.env.local` zeigt auf `http://localhost:8180/army_api.php`?

### Leere Datenbank
✅ Schema importiert? (`backend/database/schema.sql`)

---

## 📦 Dependencies

### Backend
- Container-Image: `php:8.2-apache`
- Extensions: `mysqli`, `pdo`, `pdo_mysql`
- MySQL: `mysql:8.4`

### Frontend
- React 19
- Node.js 18+

---

## 👨‍💻 Development

```bash
# Frontend Dependencies installieren
cd dust1947-frontend
npm install

# Backend/DB Status (Rancher Desktop)
kubectl get pods -n dust1947

# Optional: Logs vom Apache/PHP Pod
kubectl logs -n dust1947 deploy/apache --tail=100

# Frontend Dev Server
npm start
```

---

## 🚢 Deployment

### Backend auf Server hochladen:
- `backend/` → per FTP auf kunzomat.de
- **NICHT hochladen:** `config.local.php`

### Frontend bauen & deployen:
```bash
cd dust1947-frontend
npm run build
# build/ Ordner auf Server hochladen
```

---

## 📄 Lizenz

Private Projekt für Dust 1947 Army Building.

