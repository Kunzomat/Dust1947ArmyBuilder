# MySQL Reparaturanleitung - InnoDB Recovery

## Problem
MySQL startet nicht mehr aufgrund korrupter InnoDB-Dateien. Die Log-Sequenznummern stimmen nicht überein.

## Ursache
Die häufigsten Ursachen sind:
- Unsachgemäßes Herunterfahren des Systems
- Stromausfall während MySQL aktiv war
- Manuelles Kopieren von Datenbankdateien ohne Log-Dateien

## Lösung

### Automatische Reparatur (Empfohlen)
Führe `repair-mysql.bat` aus und folge den Schritten:

1. **Schritt 1: MySQL im Recovery-Modus starten**
   - Der Recovery-Modus wurde bereits in `C:\xampp\mysql\bin\my.ini` aktiviert
   - Öffne XAMPP Control Panel
   - Klicke auf "Start" bei MySQL
   - MySQL sollte jetzt starten (nur im Read-Only-Modus)

2. **Schritt 2: Datenbank exportieren**
   - Das Skript erstellt automatisch ein Backup aller Datenbanken
   - Backup wird gespeichert als: `mysql_backup_[DATUM]_[ZEIT].sql`
   - **Wichtig:** Stoppe MySQL nach dem Backup!

3. **Schritt 3: InnoDB neu aufbauen**
   - Das Skript entfernt den Recovery-Modus
   - Löscht die korrupten Log-Dateien (`ib_logfile0`, `ib_logfile1`)
   - MySQL erstellt beim nächsten Start neue, saubere Log-Dateien

4. **Schritt 4: MySQL normal starten**
   - Starte MySQL im XAMPP Control Panel
   - MySQL sollte jetzt normal funktionieren
   - Alle Daten sollten erhalten sein

### Manuelle Reparatur

Falls das Skript nicht funktioniert:

#### 1. Recovery-Modus aktivieren (Bereits erledigt!)
```ini
# In C:\xampp\mysql\bin\my.ini ist bereits hinzugefügt:
innodb_force_recovery=1
```

#### 2. MySQL starten und Backup erstellen
```batch
# MySQL im XAMPP Control Panel starten
# Dann Backup erstellen:
C:\xampp\mysql\bin\mysqldump.exe -u root --all-databases > backup.sql
```

#### 3. MySQL stoppen

#### 4. Recovery-Modus deaktivieren
```batch
# Öffne C:\xampp\mysql\bin\my.ini
# Kommentiere die Zeile aus:
#innodb_force_recovery=1
```

#### 5. InnoDB Log-Dateien löschen
```batch
del C:\xampp\mysql\data\ib_logfile0
del C:\xampp\mysql\data\ib_logfile1
```

#### 6. MySQL normal starten
MySQL erstellt automatisch neue Log-Dateien.

## InnoDB Force Recovery Levels

Falls Level 1 nicht funktioniert, kannst du höhere Levels versuchen:

- **Level 1** (SRV_FORCE_IGNORE_CORRUPT): Ignoriert korrupte Seiten
- **Level 2** (SRV_FORCE_NO_BACKGROUND): Verhindert Master Thread
- **Level 3** (SRV_FORCE_NO_TRX_UNDO): Keine Transaktions-Rollbacks
- **Level 4** (SRV_FORCE_NO_IBUF_MERGE): Verhindert Insert-Buffer-Merges
- **Level 5** (SRV_FORCE_NO_UNDO_LOG_SCAN): Kein Undo-Log beim Start
- **Level 6** (SRV_FORCE_NO_LOG_REDO): Kein Redo-Log

**Warnung:** Level 4-6 können zu Datenverlust führen!

## Häufige Fehler

### "MySQL startet auch im Recovery-Modus nicht"
- Versuche einen höheren Recovery-Level (2-6)
- Prüfe, ob Port 3306 bereits belegt ist
- Schaue in `C:\xampp\mysql\data\mysql_error.log`

### "Backup schlägt fehl"
```batch
# Versuche nur eine bestimmte Datenbank:
C:\xampp\mysql\bin\mysqldump.exe -u root databasename > backup.sql
```

### "Nach Reparatur fehlen Daten"
- Importiere das Backup:
```batch
C:\xampp\mysql\bin\mysql.exe -u root < backup.sql
```

## Prävention

Um zukünftige Probleme zu vermeiden:

1. **Regelmäßige Backups erstellen**
   ```batch
   backup-database.bat
   ```

2. **MySQL ordnungsgemäß beenden**
   - Immer über XAMPP Control Panel stoppen
   - Nicht den Computer einfach ausschalten

3. **UPS verwenden**
   - Schützt vor Stromausfall

4. **Nicht manuell Dateien kopieren**
   - Nutze `mysqldump` für Backups
   - Nie die Dateien in `C:\xampp\mysql\data` manuell bearbeiten

## Status prüfen

Nach der Reparatur:
```sql
-- In phpMyAdmin oder MySQL Console:
SHOW ENGINE INNODB STATUS;
```

## Weitere Hilfe

- Prüfe das Error-Log: `C:\xampp\mysql\data\mysql_error.log`
- XAMPP Forum: https://community.apachefriends.org/
- MariaDB InnoDB Recovery: https://mariadb.com/kb/en/innodb-recovery-modes/

