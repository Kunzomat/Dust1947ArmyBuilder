# 🚀 Lokale Entwicklungsumgebung einrichten

## 1. XAMPP installieren

1. **Download XAMPP** von https://www.apachefriends.org/
2. Installieren Sie XAMPP (Standard-Pfad: `C:\xampp`)
3. Starten Sie das XAMPP Control Panel
4. Starten Sie **Apache** und **MySQL**

## 2. Datenbank einrichten

### Option A: Mit phpMyAdmin (Einfach)
1. Öffnen Sie http://localhost/phpmyadmin
2. Klicken Sie auf "Neu" (linke Seite)
3. Datenbank-Name: `dust1947`
4. Kollation: `utf8mb4_unicode_ci`
5. Klicken Sie "Erstellen"
6. Gehen Sie zum Tab "SQL"
7. Kopieren Sie den Inhalt von `backend/database/schema.sql` hinein
8. Klicken Sie "OK"

### Option B: Mit Kommandozeile
```bash
# MySQL starten
mysql -u root -p

# Im MySQL-Prompt:
CREATE DATABASE dust1947 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dust1947;
SOURCE D:/private/apps/dust1947/backend/database/schema.sql;
EXIT;
```

## 3. Daten importieren (Optional)

Wenn Sie Daten vom Remote-Server haben:

```bash
# Export vom Remote-Server
mysqldump -h database-5019385374.webspace-host.com -u dbu358620 -p dbs15166077 > backup.sql

# Import in lokale DB
mysql -u root dust1947 < backup.sql
```

## 4. PHP Backend konfigurieren

Die Datei `backend/config.local.php` wurde bereits erstellt. 
Falls MySQL ein Passwort hat, ändern Sie dort:

```php
define('DB_PASS', 'IhrPasswort');
```

## 5. Backend starten

### Option A: XAMPP nutzen
```bash
# Kopieren Sie das backend-Verzeichnis nach:
# C:\xampp\htdocs\dust1947\backend\

# Backend ist dann erreichbar unter:
# http://localhost/dust1947/backend/army_api.php
```

### Option B: PHP Built-in Server (Empfohlen für Development)
```bash
cd D:\private\apps\dust1947
php -S localhost:8000
```

## 6. Frontend konfigurieren

Erstelle deine lokale Datei aus dem Template (wird nicht in Git versioniert):

```bash
cd dust1947-frontend
copy .env.local.example .env.local
```

Passe danach die Werte in `.env.local` an deine Maschine an (Port, URL, API-Key).

**Starten Sie das Frontend neu:**
```bash
cd dust1947-frontend
npm start
```

Das Frontend nutzt jetzt automatisch die lokale API.

## 7. Testen

Öffnen Sie http://localhost:3000

Sie sollten jetzt die App mit der lokalen Datenbank nutzen können!

---

## Umgebungen wechseln

### Lokal entwickeln:
```bash
# Backend
php -S localhost:8000

# Frontend (nutzt automatisch .env.local)
npm start
```

### Für Production bauen:
```bash
cd dust1947-frontend
npm run build
# Nutzt .env.production
```

---

## Troubleshooting

### "Connection refused" Fehler
- Prüfen Sie, ob MySQL in XAMPP läuft
- Prüfen Sie den Port: Standard ist 3306

### "Access denied" Fehler
- Prüfen Sie Username/Passwort in `config.local.php`
- XAMPP Standard: User=`root`, Passwort=leer

### CORS-Fehler weiterhin
- Prüfen Sie, ob PHP auf Port 8000 läuft
- Prüfen Sie `.env.local` im Frontend

### Datenbank leer
- Importieren Sie das Schema: `backend/database/schema.sql`
- Oder importieren Sie einen Backup vom Server

