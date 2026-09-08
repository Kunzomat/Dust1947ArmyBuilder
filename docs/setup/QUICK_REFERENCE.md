# 🚀 Dust1947 - Quick Start Guide

## 📋 Voraussetzungen
- XAMPP installiert (C:\xampp)
- Node.js installiert
- MySQL und Apache müssen laufen

---

## ⚡ Schnellstart

### 1. Services starten
```bash
# In XAMPP Control Panel:
- MySQL starten
- Apache starten (für phpMyAdmin)
```

### 2. Application starten
```bash
# Einfach Doppelklick auf:
start-dev.bat
```

Das Skript startet automatisch:
- ✅ PHP Backend (Port 8000)
- ✅ React Frontend (Port 3000)

---

## 🌐 URLs

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Frontend** | http://localhost:3000 | React App |
| **Backend** | http://localhost:8000 | PHP API |
| **phpMyAdmin** | http://localhost/phpmyadmin | Datenbank-Admin |
| **phpMyAdmin (Shortcut)** | Doppelklick: `open-phpmyadmin.bat` | Öffnet direkt |

---

## 🗄️ phpMyAdmin Login

**Zugangsdaten:**
- Benutzername: `root`
- Passwort: *(leer lassen)*
- Datenbank: `dust1947`

---

## 🛠️ Wichtige Skripte

| Datei | Funktion |
|-------|----------|
| `start-dev.bat` | Startet Backend + Frontend |
| `open-phpmyadmin.bat` | Öffnet phpMyAdmin direkt |
| `backup-database.bat` | Erstellt Datenbank-Backup |
| `setup-database.bat` | Datenbank einrichten |
| `check-system.bat` | System-Check |

---

## 🐛 Troubleshooting

### Problem: "phpMyAdmin lädt nicht"
**Lösung:** Apache muss laufen!
1. XAMPP Control Panel öffnen
2. Bei Apache auf "Start"
3. Warten bis grün

### Problem: "MySQL startet nicht"
**Lösung:** Port blockiert oder Datei korrupt
1. Port prüfen: `netstat -ano | findstr ":3306"`
2. Falls blockiert: Blockierenden Prozess beenden
3. Falls korrupt: Siehe `TROUBLESHOOTING.md`

### Problem: "Backend startet nicht"
**Lösung:** MySQL muss laufen!
1. MySQL im XAMPP starten
2. Dann Backend starten

### Problem: "Frontend startet nicht"
**Lösung:** Node.js Probleme
```bash
cd dust1947-frontend
npm install
npm start
```

---

## 📚 Dokumentation

| Datei | Inhalt |
|-------|--------|
| `PHPMYADMIN_GUIDE.md` | Vollständige phpMyAdmin-Anleitung |
| `TROUBLESHOOTING.md` | Fehlerbehebung |
| `ADMIN_PANEL_IMPLEMENTATION.md` | Admin-Panel Doku |
| `QUICKSTART.md` | Quick Start Guide |

---

## 🔧 Erweiterte Befehle

### Status aller Services prüfen
```powershell
netstat -ano | findstr ":3306 :80 :8000 :3000"
```

### Datenbank-Backup erstellen
```bash
Doppelklick: backup-database.bat
```

### SQL-Abfragen
Siehe: `backend/database/useful_queries.sql`

---

## 🎯 Typischer Workflow

1. **XAMPP starten:**
   - MySQL ✅
   - Apache ✅

2. **Application starten:**
   ```bash
   start-dev.bat
   ```

3. **Entwickeln:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Datenbank: http://localhost/phpmyadmin

4. **Testen:**
   - API-Calls im Frontend
   - SQL-Abfragen in phpMyAdmin

---

## 💾 Wichtige Pfade

```
dust1947/
├── backend/
│   ├── api.php              # Haupt-API
│   ├── admin_api.php        # Admin-API
│   ├── config.local.php     # DB-Config
│   └── database/
│       ├── schema.sql       # DB-Schema
│       └── useful_queries.sql  # SQL-Queries
│
├── dust1947-frontend/
│   ├── src/
│   │   ├── App.js           # Main App
│   │   ├── api.js           # API Client
│   │   └── components/      # React Components
│   └── package.json
│
└── Scripts:
    ├── start-dev.bat        # App starten
    ├── open-phpmyadmin.bat  # phpMyAdmin öffnen
    └── backup-database.bat  # DB-Backup
```

---

## 🔐 Sicherheit

- ❌ **Niemals** in Production verwenden ohne:
  - MySQL root Passwort setzen
  - Apache .htaccess konfigurieren
  - API-Key ändern in `config.local.php`

- ✅ Für lokale Entwicklung ist die aktuelle Konfiguration OK

---

## 📞 Bei Problemen

1. **Logs prüfen:**
   - XAMPP Control Panel → Logs
   - Browser Console (F12)

2. **Services neu starten:**
   - XAMPP: MySQL & Apache neu starten
   - Backend/Frontend: Fenster schließen, neu starten

3. **Dokumentation lesen:**
   - `TROUBLESHOOTING.md`
   - `PHPMYADMIN_GUIDE.md`

---

✅ **System bereit für Entwicklung!**

