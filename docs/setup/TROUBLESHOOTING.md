# ⚠️ TROUBLESHOOTING: Lokale API wird nicht verwendet

## Problem
Frontend ruft immer noch `kunzomat.de` auf statt `localhost:8000`.

## Ursache
React lädt `.env.local` nur beim **Start**, nicht während der Laufzeit!

---

## ✅ LÖSUNG 1: Hard Refresh im Browser

**Schnellste Lösung:**

1. Öffnen Sie http://localhost:3000
2. Drücken Sie **STRG + SHIFT + R** (Hard Refresh)
3. Oder: F12 → Application → Clear Storage → Clear site data

---

## ✅ LÖSUNG 2: React komplett neu starten

### Windows:

```powershell
# 1. Alle Node-Prozesse beenden
taskkill /F /IM node.exe

# 2. Warten
timeout /t 3

# 3. Frontend neu starten
cd D:\private\apps\dust1947\dust1947-frontend
npm start
```

---

## ✅ LÖSUNG 3: ENV-Variablen explizit setzen

Starten Sie das Frontend mit diesem Script:

```batch
D:\private\apps\dust1947\dust1947-frontend\start-with-env.bat
```

Dieses Script setzt die ENV-Variablen **explizit** vor dem Start.

---

## 🔍 DEBUG: Prüfen Sie die Konfiguration

### Im Browser (F12 → Console):

Sie sollten sehen:
```
🚀 API CLIENT CONFIGURATION
API_BASE: http://localhost:8000/backend/army_api.php
API_KEY: ✅ SET
```

### Wenn Sie `kunzomat.de` sehen:

❌ Die `.env.local` wurde nicht geladen!

**Lösungen:**
1. React **komplett** neu starten (siehe oben)
2. Browser-Cache leeren (STRG+SHIFT+R)
3. Script `start-with-env.bat` verwenden

---

## 📁 Dateien prüfen

### 1. Prüfen Sie `.env.local`:

```powershell
Get-Content D:\private\apps\dust1947\dust1947-frontend\.env.local
```

**Sollte enthalten:**
```
REACT_APP_API_BASE=http://localhost:8000/backend/army_api.php
REACT_APP_API_KEY=local-dev-key-12345
```

### 2. Prüfen Sie `apiClient.js`:

```javascript
const API_BASE = process.env.REACT_APP_API_BASE || "http://kunzomat.de/...";
```

Sollte das Debug-Log enthalten!

---

## 🔄 Workflow: Jeden Tag starten

### Empfohlene Methode:

**Option A: Automatisch (empfohlen)**
```batch
D:\private\apps\dust1947\start-dev.bat
```

**Option B: Mit expliziten ENV-Vars**
```batch
cd D:\private\apps\dust1947\dust1947-frontend
start-with-env.bat
```

**Option C: Manuell**
```powershell
# Terminal 1: Backend
cd D:\private\apps\dust1947
C:\xampp\php\php.exe -S localhost:8000

# Terminal 2: Frontend  
cd D:\private\apps\dust1947\dust1947-frontend
npm start
```

---

## ❓ FAQ

### Q: Warum sehe ich immer noch CORS-Fehler?

**A:** React nutzt noch den alten Build. Lösungen:

1. **Browser:** STRG+SHIFT+R (Hard Refresh)
2. **React:** Alle Node-Prozesse killen und neu starten
3. **Cache:** Browser-Cache komplett leeren

### Q: Wie prüfe ich, welche API-URL verwendet wird?

**A:** Browser-Console (F12) öffnen und nach "API CLIENT CONFIGURATION" suchen.

### Q: Die .env.local existiert, wird aber nicht geladen?

**A:** React lädt `.env` Dateien nur beim **Start**!

**Lösung:**
```powershell
# Alle Node-Prozesse beenden
taskkill /F /IM node.exe

# Neu starten
npm start
```

### Q: Kann ich .env.local zur Laufzeit ändern?

**A:** NEIN! React muss **neu gestartet** werden!

### Q: Backend läuft, aber Frontend zeigt "Connection refused"?

**A:** Prüfen Sie:

1. Backend läuft auf Port 8000:
   ```powershell
   netstat -ano | findstr :8000
   ```

2. API_BASE ist korrekt:
   Browser Console → Suche nach "API CLIENT CONFIGURATION"

---

## 🚨 Emergency: Alles zurücksetzen

Wenn nichts funktioniert:

```powershell
# 1. Alle Server stoppen
taskkill /F /IM node.exe
taskkill /F /IM php.exe

# 2. Browser-Cache leeren
# STRG+SHIFT+DELETE → Alles löschen

# 3. .env.local prüfen/neu erstellen
cd D:\private\apps\dust1947\dust1947-frontend

# Sollte enthalten:
# REACT_APP_API_BASE=http://localhost:8000/backend/army_api.php
# REACT_APP_API_KEY=local-dev-key-12345

# 4. Mit expliziten ENV-Vars starten
.\start-with-env.bat
```

---

## ✅ Erfolgreich, wenn:

1. Browser-Console zeigt: `API_BASE: http://localhost:8000/...`
2. Keine CORS-Fehler mehr
3. API-Requests gehen an `localhost:8000`

---

## 📞 Weitere Hilfe

- `check-system.bat` - System-Status prüfen
- `QUICKSTART.md` - Schnellstart-Anleitung
- `README.md` - Vollständige Dokumentation

