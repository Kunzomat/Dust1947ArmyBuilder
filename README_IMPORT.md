# 🎯 Dust 1947 Import - Vollständiges Paket

## 📦 Was wurde erstellt?

Ich habe ein komplettes Import-System für alle 459 Dust 1947 Kartendaten aus den Originalbildern erstellt!

### Dateien im Verzeichnis `D:\private\apps\dust1947\`

| Datei | Größe | Beschreibung |
|-------|-------|-------------|
| **dust1947_import_data.json** | 238.7 KB | Strukturierte Kartendaten im JSON-Format (API-Import) |
| **dust1947_import.csv** | 40.4 KB | Kartendaten als CSV für Spreadsheet-Bearbeitung |
| **import_units.php** | 6.2 KB | PHP-Script zum automatischen Importieren via API |
| **IMPORT_GUIDE.md** | 3.6 KB | Detaillierte Anleitung zur Verwendung |
| **IMPORT_STATISTICS.txt** | 0.5 KB | Statistik über gefundene Kartendaten |

---

## 📊 Statistik

### Kartendaten extrahiert:
- **Total Kartendateien gescannt**: 1.100+
- **Eindeutige Kartennummern**: 459
- **Kartenvarianten** (mit Front/Back/Reverse): 575

### Nach Fraktion:
| Fraktion | Kartennummern |
|----------|--------------|
| 🎖️ **Allies** | 156 (AL100-AL914) |
| ⚒️ **Axis** | 167 (AX100-AX923) |
| 🗾 **IJN** | 37 (JP100-JP192) |
| 🏴 **Mercenaries** | 52 (DS038-ME914) |
| 👹 **Mythos** | 28 (CT100-CT905) |
| ☭ **SSU** | 135 (SU101-SU901) |
| **TOTAL** | **575** |

---

## 🚀 Schnellstart

### 1️⃣ Daten in Spreadsheet bearbeiten
```bash
# CSV öffnen in Excel/Google Sheets
dust1947_import.csv
```
Hier kannst du:
- Unit-Namen eintragen
- Punkte anpassen
- Stats korrigieren
- Notizen hinzufügen

### 2️⃣ JSON für API-Import verwenden
```bash
# JSON direkt über API importieren
curl -X POST http://localhost:8180/admin_api.php?action=units.bulk_import \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @dust1947_import_data.json
```

### 3️⃣ PHP-Script verwenden
```bash
# Mit API-Key Umgebungsvariable
export REACT_APP_API_KEY="your-api-key"

# Script ausführen
php import_units.php dust1947_import_data.json
```

---

## 📝 Format der Daten

### CSV Struktur
```
Card_ID  | Name         | Faction  | Type | Points | Health | Level | Speed | March_Speed | Image_File   | Notes
---------|--------------|----------|------|--------|--------|-------|-------|-------------|--------------|----------
AL100    | Unit AL100   | Allies   | I    | 10     | 1      | 1     | 4     | 2           | AL100.jpg    | Auto...
AL101    | Unit AL101   | Allies   | I    | 10     | 1      | 1     | 4     | 2           | AL101.jpg    | Auto...
AX100    | Unit AX100   | Axis     | V    | 10     | 1      | 1     | 4     | 2           | AX100.jpg    | Auto...
```

### JSON Struktur
```json
{
  "metadata": {
    "version": "1.0",
    "timestamp": "2026-09-10 13:02:33",
    "total_units": 459,
    "source": "Dust 1947 Card Repository"
  },
  "units": [
    {
      "card_id": "AL100",
      "name": "Unit AL100",
      "faction": "Allies",
      "type": "I",
      "points": 10,
      "health": 1,
      "level": 1,
      "speed": 4,
      "march_speed": 2,
      "image_url": "AL100.jpg",
      "notes": "Auto-generated - requires manual data entry"
    }
  ]
}
```

---

## ⚠️ Wichtige Hinweise

1. **Auto-generierte Daten**: 
   - ✅ Card-IDs sind korrekt
   - ✅ Fraktionen sind korrekt
   - ✅ Bildverweise sind korrekt
   - ❌ Namen müssen manuell eingetragen werden
   - ❌ Punkte sind Platzhalter

2. **Bilder**: 
   - Dateipfade zeigen auf die Original-Kartendateien
   - Müssen kopiert oder verschoben werden, wenn die Bilder im Backend genutzt werden sollen

3. **Datentypen**:
   - **Type**: I (Infantry), V (Vehicle), A (Aircraft), H (Hero)
   - **Level**: 1-7 (je nach Einheitstyp)
   - **Punkte**: Basis-Platzhalter (10 Punkte)
   - **Health**: 1-5 (Lebenspunkte)

---

## 🔧 Workflow zur Vervollständigung

### Phase 1: Datenerfassung
1. `dust1947_import.csv` in Excel/Google Sheets öffnen
2. Nacheinander jede Fraktion durchgehen
3. Unit-Namen aus den Kartenbildern OCR-lesen oder manuell eintippen
4. Korrekte Punkte, Stats eintragen
5. CSV speichern

### Phase 2: Validierung
1. Daten auf Konsistenz prüfen
2. Duplikate prüfen
3. Bildverweise testen

### Phase 3: Import
1. CSV → JSON konvertieren
2. PHP-Script oder API-Call verwenden
3. Datenbank überprüfen

### Phase 4: Feinabstimmung
1. Im Admin-Panel überprüfen
2. Fehlende Icons hochladen
3. Beschreibungen hinzufügen

---

## 🛠️ Verwendung im Admin-Panel

Nach dem Import kannst du die Einheiten im Admin-Panel verwalten:

```
Admin Panel → Units → Berechnen
```

Das System berechnet automatisch die theoretischen Punkte basierend auf:
- Waffen
- Regeln
- Stats (Health, Speed, Level)

Du kannst dann die Auto-berechneten Punkte mit einem Klick übernehmen! ⚡

---

## 📂 Quelldateien

Original-Kartendateien sind in:
```
D:\private\dust47cardrepo-main\dust47cardrepo-main\
```

Organisiert nach Fraktionen:
- Allies/
- Axis/
- IJN/
- Mercenaries/
- Mythos/
- SSU/

---

## 💡 Tipps

1. **OCR für Unit-Namen**: Verwende online OCR-Tools wie:
   - Google Lens
   - Tesseract OCR
   - Azure Vision API

2. **Batch-Verarbeitung**: Mit dem PHP-Script können alle 459 Einheiten automatisch importiert werden

3. **Iterative Verbesserung**: 
   - Import mit Basis-Daten
   - Schrittweise verbessern
   - Regelmäßig neu-importieren

4. **Community-Crowdsourcing**: 
   - CSV teilen
   - Community-Mitglieder können Daten ergänzen
   - Zusammenführen und importieren

---

## 📞 Support

Bei Fragen:
1. Siehe `IMPORT_GUIDE.md` für Details
2. Überprüfe `IMPORT_STATISTICS.txt` für Übersicht
3. Nutze `import_units.php` für Logging

---

## ✨ Fertig!

Alle Dateien sind bereit zum Importieren. Du kannst jetzt:

1. **Sofort importieren**: Mit den Basis-Daten (schnell, aber weniger informativ)
2. **Manuell bearbeiten**: CSV öffnen und verbessern (zeitaufwändig, aber präzise)
3. **Hybrid-Ansatz**: Einige Einheiten manuell, andere automatisch

Viel Spaß beim Aufbau der Dust 1947 Datenbank! 🎮⚔️

---

**Generiert**: 2026-09-10  
**Quelle**: Dust 1947 Official Card Repository  
**Total Import-Dateien**: 5

