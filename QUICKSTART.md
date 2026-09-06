# 🚀 Quick Start Guide - Dust 1947 Lokal

## ✅ Checkliste

- [ ] XAMPP installiert
- [ ] MySQL gestartet
- [ ] Datenbank `dust1947` erstellt
- [ ] Schema importiert
- [ ] Server gestartet

---

## 📥 Installation (nur einmal)

### 1. XAMPP installieren (5 Min)

1. ✅ **Download-Seite wurde geöffnet**
2. Laden Sie **XAMPP für Windows** herunter
3. Installieren Sie XAMPP (Standard-Einstellungen OK)
4. Starten Sie das **XAMPP Control Panel**
5. Klicken Sie **"Start"** bei **MySQL** (wird grün)

### 2. Datenbank einrichten (2 Min)

**Einfacher Weg - Mit Script:**
```bash
# Doppelklick auf:
setup-database.bat
```

Das Script öffnet automatisch phpMyAdmin und das Schema-File!

**Manueller Weg:**
1. Öffnen Sie http://localhost/phpmyadmin
2. Klicken Sie "Neu" (links)
3. Datenbank-Name: `dust1947`
4. Kollation: `utf8mb4_unicode_ci`
5. "Erstellen" klicken
6. Tab "SQL" öffnen
7. Kopieren Sie den Inhalt von `backend/database/schema.sql`
8. Einfügen & "OK" klicken

---

## 🎮 Jeden Tag: Server starten

**Einfachste Methode:**
```bash
# Doppelklick auf:
start-dev.bat
```

Das startet automatisch:
- ✅ PHP Backend auf Port 8000
- ✅ React Frontend auf Port 3000

**Fertig!** Öffnen Sie http://localhost:3000

---

## 🔧 Manuelle Methode (Alternative)

### Terminal 1: Backend starten
```bash
cd D:\private\apps\dust1947
php -S localhost:8000
```

### Terminal 2: Frontend starten
```bash
cd D:\private\apps\dust1947\dust1947-frontend
npm start
```

---

## 🌐 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/backend/army_api.php
- **phpMyAdmin:** http://localhost/phpmyadmin

---

## 🐛 Probleme?

### "php ist kein Befehl"
❌ Problem: XAMPP nicht im PATH  
✅ Lösung: Nutzen Sie `start-dev.bat` statt manuellem Start

### "Connection refused" / "Access denied"
❌ Problem: MySQL nicht gestartet  
✅ Lösung: XAMPP Control Panel → MySQL → Start

### "Unknown database 'dust1947'"
❌ Problem: Datenbank nicht erstellt  
✅ Lösung: Führen Sie `setup-database.bat` aus

### "401 Unauthorized"
❌ Problem: API-Key falsch  
✅ Lösung: `.env.local` sollte `local-dev-key-12345` enthalten (bereits gesetzt!)

### Leere Datenbank / Keine Units
❌ Problem: Schema nicht importiert  
✅ Lösung: Importieren Sie `backend/database/schema.sql` in phpMyAdmin

### CORS-Fehler
❌ Problem: Backend läuft nicht  
✅ Lösung: Starten Sie Backend mit `start-dev.bat`

---

## 📊 Daten vom Server importieren (Optional)

Wenn Sie Ihre Production-Daten lokal haben möchten:

1. **Export vom Server** (wenn möglich):
   ```bash
   mysqldump -h database-5019385374.webspace-host.com -u dbu358620 -p dbs15166077 > backup.sql
   ```

2. **Import in lokale DB**:
   - phpMyAdmin öffnen
   - Datenbank `dust1947` auswählen
   - Tab "Importieren"
   - `backup.sql` auswählen
   - "OK" klicken

---

## 🔄 Zwischen Lokal und Server wechseln

### Lokal entwickeln (Standard)
- Existiert: `backend/config.local.php` ✅
- Existiert: `dust1947-frontend/.env.local` ✅
- Läuft gegen: `localhost:8000`

### Gegen Production-Server
- Löschen/umbenennen Sie: `config.local.php`
- Nutzen Sie: `.env.production` im Frontend
- Läuft gegen: `kunzomat.de`

---

## 💾 Änderungen auf Server hochladen

**Backend-Änderungen:**
1. Via FTP auf `kunzomat.de` verbinden
2. Hochladen: `backend/*.php` (außer `config.local.php`)

**Frontend-Änderungen:**
1. Build erstellen: `npm run build`
2. `build/` Ordner auf Server hochladen

---

## 🎯 Was Sie jetzt haben

✅ Lokale MySQL Datenbank  
✅ PHP Backend Server  
✅ React Frontend  
✅ Keine CORS-Probleme mehr  
✅ Schnelles Entwickeln ohne Server-Upload  
✅ Ein-Klick-Start mit `start-dev.bat`

---

## 📞 Support

- **Detailed Setup:** Siehe `SETUP_LOCAL.md`
- **Project README:** Siehe `README.md`
- **Database Schema:** Siehe `backend/database/schema.sql`

---

**Viel Erfolg! 🎲**

