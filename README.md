# Dust 1947 Army Builder 🎲

Full-Stack-Anwendung zum Erstellen von Armeen für Dust 1947.

## 🚀 Quick Start - Lokale Entwicklung

### Voraussetzungen
- Node.js (v14+)
- PHP 7.4+ oder XAMPP
- MySQL/MariaDB

### Setup in 3 Schritten:

1. **XAMPP installieren & MySQL starten**
   - Download: https://www.apachefriends.org/
   - Starte MySQL im XAMPP Control Panel

2. **Datenbank erstellen**
   ```bash
   # In phpMyAdmin (http://localhost/phpmyadmin):
   # - Neue Datenbank: dust1947
   # - SQL-Tab: Inhalt von backend/database/schema.sql einfügen
   ```

3. **Development Server starten**
   ```bash
   # Doppelklick auf:
   start-dev.bat
   ```

Das war's! 🎉

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000

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
└── start-dev.bat              # Dev-Server starten
```

---

## 🔄 Umgebungen

### Lokal entwickeln
```bash
# Backend (PHP Built-in Server)
php -S localhost:8000

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

Siehe **SETUP_LOCAL.md** für detaillierte Anleitung.

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
✅ MySQL in XAMPP gestartet?

### "Access denied"
✅ Passwort in `config.local.php` korrekt?
   - XAMPP Standard: User=`root`, Passwort=leer

### CORS-Fehler
✅ Backend läuft auf Port 8000?
✅ `.env.local` zeigt auf `http://localhost:8000`?

### Leere Datenbank
✅ Schema importiert? (`backend/database/schema.sql`)

---

## 📦 Dependencies

### Backend
- PHP 7.4+
- MySQL 5.7+ / MariaDB 10.3+
- Extensions: mysqli, json

### Frontend
- React 18
- Node.js 14+

---

## 👨‍💻 Development

```bash
# Frontend Dependencies installieren
cd dust1947-frontend
npm install

# Backend Server
php -S localhost:8000

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

