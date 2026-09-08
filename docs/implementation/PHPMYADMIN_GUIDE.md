# 🗄️ phpMyAdmin Schnellreferenz für Dust1947

## 🔗 Zugriff
- **URL:** http://localhost/phpmyadmin
- **User:** root
- **Pass:** *(leer)*
- **DB:** dust1947

---

## 📊 Wichtige Tabellen

| Tabelle | Was speichert sie? | Wichtige Felder |
|---------|-------------------|-----------------|
| `blocs` | Allianzen | id, name |
| `factions` | Fraktionen | id, name, bloc_id |
| `units` | Einheiten | id, name, type, points, faction_id |
| `weapons` | Waffen | id, name, range |
| `weapon_stats` | Waffenstats | weapon_id, dice, damage |
| `armies` | Spieler-Armeen | id, name, points_limit |
| `army_units` | Einheiten in Armee | army_id, unit_id, quantity |
| `rules` | Spezialregeln | id, name, short_text |

---

## 🎯 Häufige Aufgaben

### Daten ansehen
1. Links auf `dust1947` klicken
2. Tabelle wählen (z.B. `units`)
3. Oben auf "Anzeigen"

### SQL-Abfrage ausführen
1. Oben auf "SQL" klicken
2. Query eingeben:
   ```sql
   SELECT * FROM units WHERE points > 50;
   ```
3. "OK" klicken

### Einheit hinzufügen
```sql
INSERT INTO units (name, type, points, faction_id) 
VALUES ('Neue Einheit', 'Infantry', 25, 1);
```

### Einheit aktualisieren
```sql
UPDATE units 
SET points = 30 
WHERE id = 123;
```

### Einheit löschen
```sql
DELETE FROM units WHERE id = 123;
```

---

## 🔍 Nützliche Abfragen

### Alle Einheiten einer Fraktion
```sql
SELECT u.* FROM units u
JOIN factions f ON u.faction_id = f.id
WHERE f.name = 'Allies';
```

### Armeen mit Punktestand
```sql
SELECT a.name, a.points_limit,
    COALESCE(SUM(u.points * au.quantity), 0) as used_points
FROM armies a
LEFT JOIN army_units au ON a.id = au.army_id
LEFT JOIN units u ON au.unit_id = u.id
GROUP BY a.id;
```

### Einheiten mit Waffen
```sql
SELECT u.name as unit, w.name as weapon
FROM units u
JOIN unit_weapons uw ON u.id = uw.unit_id
JOIN weapons w ON uw.weapon_id = w.id;
```

---

## 💾 Backup & Restore

### Backup erstellen
**Methode 1:** Skript verwenden
```
Doppelklick auf: backup-database.bat
```

**Methode 2:** phpMyAdmin
1. Datenbank `dust1947` wählen
2. Oben auf "Exportieren"
3. Format: SQL
4. "OK"

### Backup wiederherstellen
1. Datenbank `dust1947` wählen
2. Oben auf "Importieren"
3. Datei auswählen
4. "OK"

---

## 🛠️ Troubleshooting

### "Zugriff verweigert"
→ Prüfen: User = root, Passwort leer

### "Tabelle existiert nicht"
→ Migration ausführen: `run-migration.bat`

### Datenbank leer
→ Schema importieren:
1. SQL-Tab öffnen
2. Inhalt von `backend/database/schema.sql` einfügen
3. "OK"

---

## 📁 Wichtige Dateien

- **Schema:** `backend/database/schema.sql`
- **Queries:** `backend/database/useful_queries.sql`
- **Migration:** `backend/database/migration_admin_fix.sql`
- **Backup-Skript:** `backup-database.bat`
- **Config:** `backend/config.local.php`

---

## 🔑 Beziehungen verstehen

```
blocs (Allianzen)
  └── factions (Fraktionen)
        └── units (Einheiten)
              ├── unit_weapons → weapons
              ├── unit_rules → rules
              └── army_units → armies

armies (Spieler-Armeen)
  └── army_units → units
```

---

## ⚡ Performance-Tipps

- Verwenden Sie `LIMIT` bei großen Abfragen
- Nutzen Sie Indizes für häufige Suchen
- JOIN nur wenn nötig
- WHERE-Klauseln für Filterung

Beispiel:
```sql
SELECT * FROM units WHERE faction_id = 1 LIMIT 20;
```

---

## 🎨 View verwenden

Die Datenbank hat bereits eine View für Armee-Punkte:

```sql
SELECT * FROM v_army_points;
```

Zeigt: army_id, army_name, points_limit, points_current

---

✅ **Viel Erfolg mit phpMyAdmin!**

