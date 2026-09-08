# Game Systems & Blocks Tab Update - Dokumentation

## 🎯 Überblick
Du hast jetzt einen neuen **Game Systems** Tab und einen reparierte **Blocks** Tab im Admin Panel.

### Neue Features:
1. **Game Systems Management** - Zentrale Verwaltung von Spiel-Systemen (z.B. Warhammer 40K, Kill Team, etc.)
2. **Blocks Management** - Mit Description-Spalte und Game System Zugehörigkeit
3. **Blocs Management** - Repariert mit Description-Spalte (beschreibt Allianzen)

---

## 📋 Installation & Setup

### Schritt 1: Datenbank-Migration ausführen
Du musst die Datenbank-Änderungen anwenden. Es gibt zwei Optionen:

#### Option A: Via PHPMyAdmin (Empfohlen für schnelle Tests)
1. Öffne http://localhost/phpmyadmin
2. Wähle die Datenbank `dust1947`
3. Gehe zum "SQL" Tab
4. Kopiere den Inhalt aus: `backend/database/migration_game_systems.sql`
5. Klicke "Go"

#### Option B: Via PHP-Script
1. Rufe auf: http://localhost/dust1947/backend/run-migration.php
2. Dies führt die Migration automatisch aus und zeigt die Ergebnisse

#### Option C: Via Command Line
```bash
cd D:\private\apps\dust1947\backend
mysql -h localhost -u root -pdust1947 dust1947 < database/migration_game_systems.sql
```

### Schritt 2: Frontend aktualisieren
Die neuen Komponenten sind bereits hinzugefügt:
- `src/components/admin/GameSystemManager.js` ✅
- `src/components/admin/BlocksManager.js` ✅
- `src/components/AdminPanel.js` ✅ (aktualisiert)

### Schritt 3: Backend aktualisieren
Die API-Handler sind bereits hinzugefügt in `backend/admin_api.php`:
- `game_systems.list` ✅
- `game_systems.create` ✅
- `game_systems.update` ✅
- `game_systems.delete` ✅
- `blocks.list` ✅
- `blocks.create` ✅
- `blocks.update` ✅
- `blocks.delete` ✅
- `blocs.list` ✅ (repariert)
- `blocs.create` ✅ (repariert mit description)
- `blocs.update` ✅ (repariert mit description)
- `blocs.delete` ✅

---

## 📊 Datenbankstruktur

### game_systems Tabelle
```sql
CREATE TABLE game_systems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    rules_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### blocks Tabelle
```sql
CREATE TABLE blocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_system_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL
);
```

### blocs Tabelle (aktualisiert)
```sql
ALTER TABLE blocs ADD COLUMN description TEXT AFTER name;
```

---

## 🎮 Admin Panel Tabs (neue Reihenfolge)

| # | Tab | Icon | Manager |
|---|-----|------|---------|
| 0 | Game Systems | 🎮 | GameSystemManager |
| 1 | Blocks | 📦 | BlocksManager |
| 2 | Blocs | 🏴 | BlocManager |
| 3 | Factions | 🎖️ | FactionManager |
| 4 | Units | ⚔️ | UnitManager |
| 5 | Weapons | 🔫 | WeaponManager |
| 6 | Rules | 📜 | RuleManager |
| 7 | Platoons | 🪖 | PlatoonManager |

---

## 🔄 Funktionen pro Manager

### GameSystemManager
- ✅ Liste aller Game Systems
- ✅ Neues System erstellen
- ✅ System bearbeiten
- ✅ System löschen (nur wenn nicht in Blocks in Verwendung)
- ✅ Validierung: Verhindert Duplikate bei Namen

### BlocksManager
- ✅ Liste aller Blocks mit Game System Zugehörigkeit
- ✅ Neuen Block erstellen
- ✅ Block bearbeiten (Name, Description, Game System)
- ✅ Block löschen
- ✅ Game System als Dropdown auswählbar
- ✅ Description anzeigen (gekürzt auf 60 Zeichen)

### BlocManager (repariert)
- ✅ Liste aller Blocs mit Description
- ✅ Neuen Bloc erstellen
- ✅ Bloc bearbeiten
- ✅ Bloc löschen
- ✅ Description-Feld funktioniert jetzt

---

## 📝 Beispiel-Daten

### Standard Game Systems (werden bei Migration eingefügt)
1. Warhammer 40K - 10th Edition
2. Kill Team
3. Necromunda

### Beschreibung hinzufügen
Blocks können jetzt detaillierte Beschreibungen haben:
- Spielregeln
- Spezialfähigkeiten
- Quellenangaben
- Etc.

---

## 🐛 Bugfixes

### admin_api.php Fixes
❌ **Vorher:**
```php
INSERT INTO blocs (name, sytem_id) VALUES (?, ?)  // Typo: sytem_id
UPDATE blocs SET name=?, sytem_id=? WHERE id=?     // Typo
```

✅ **Nachher:**
```php
INSERT INTO blocs (name, description) VALUES (?, ?)
UPDATE blocs SET name=?, description=? WHERE id=?
```

---

## 🚀 Nächste Schritte

1. **Datenbank-Migration ausführen** (siehe Schritt 1 oben)
2. **Frontend neustarten** (npm start)
3. **Admin Panel öffnen** und die neuen Tabs testen
4. **Game Systems erstellen** (z.B. deine Spiel-Systeme)
5. **Blocks hinzufügen** und Game Systems zuweisen
6. **Beschreibungen ausfüllen**

---

## 🔗 API Endpoints

```
POST /backend/admin_api.php?action=game_systems.list
POST /backend/admin_api.php?action=game_systems.create
POST /backend/admin_api.php?action=game_systems.update
DELETE /backend/admin_api.php?action=game_systems.delete&id=X

POST /backend/admin_api.php?action=blocks.list
POST /backend/admin_api.php?action=blocks.create
POST /backend/admin_api.php?action=blocks.update
DELETE /backend/admin_api.php?action=blocks.delete&id=X

POST /backend/admin_api.php?action=blocs.list
POST /backend/admin_api.php?action=blocs.create
POST /backend/admin_api.php?action=blocs.update
DELETE /backend/admin_api.php?action=blocs.delete&id=X
```

---

## ❓ FAQ

**F: Was ist der Unterschied zwischen Blocs und Blocks?**
A: 
- **Blocs** = Allianzen (politische Gruppierungen)
- **Blocks** = Spielprogramme/Module (mit Game System Zugehörigkeit)

**F: Kann ich ein Game System löschen, wenn es in Blocks verwendet wird?**
A: Nein, das wird verhindert. Du musst zuerst alle Blocks von diesem System befreien.

**F: Warum sind meine Daten nach der Migration weg?**
A: Die Migration fügt nur neue Spalten/Tabellen hinzu. Bestehende Daten bleiben erhalten!

**F: Wie überprüfe ich, ob die Migration erfolgreich war?**
A: Öffne PHPMyAdmin und schaue die Tabellenstruktur von `blocks` und `game_systems` an.

---

## 📞 Support

Falls es Probleme gibt:
1. Prüfe ob MySQL/XAMPP läuft
2. Führe die Migration nochmal aus
3. Leere den Browser-Cache (Ctrl+Shift+Delete)
4. Prüfe die Browser-Konsole (F12) auf Fehler
5. Schau in `backend/admin_api.php` ob die Handler vorhanden sind

