# Dust 1947 Import Files - Anleitung

## 📦 Dateien

### 1. **dust1947_import_data.json** (238 KB)
JSON-Format für API-basierte Importe. Enthält alle 459 Kartendaten im strukturierten Format.

### 2. **dust1947_import.csv** (40 KB)
CSV-Format (Komma-getrennte Werte) für Spreadsheet-Editing. Einfach in Excel, Google Sheets oder Calc öffnen.

## 📊 Daten

- **Gesamtzahl Einheiten**: 459
- **Fraktionen**: Allies, Axis, IJN, Mercenaries, Mythos, SSU
- **Format**: Card ID basiert (z.B. AL100, AX200, SS500)

## 🔧 Verwendung

### Option 1: CSV in Spreadsheet bearbeiten
1. `dust1947_import.csv` in Excel/Google Sheets öffnen
2. Die Daten anpassen (Name, Punkte, Health, Speed, etc.)
3. Speichern und für Import nutzen

### Option 2: JSON direkt importieren
Die JSON-Datei kann direkt über eine API oder ein Admin-Tool importiert werden.

### Option 3: PHP/SQL Import
```php
$json = json_decode(file_get_contents('dust1947_import_data.json'), true);
foreach ($json['units'] as $unit) {
    // Import-Logik hier
}
```

## 📝 Spalten / Felder

| Feld | Beschreibung | Beispiel |
|------|-------------|----------|
| Card_ID | Eindeutige Kartennummer | AL100, AX200 |
| Name | Einheitsname (muss manuell gefüllt werden) | Lieutenant |
| Faction | Fraktion/Seite | Allies, Axis, Mythos |
| Type | Einheitstyp | I (Infantry), V (Vehicle), A (Aircraft), H (Hero) |
| Points | Punktewert | 10, 22, 12 |
| Health | Lebenspunkte | 1, 3, 5 |
| Level | Stufe | 1-7 |
| Speed | Bewegung | 4, 6, 8 |
| March_Speed | Marschgeschwindigkeit | 2, 3, 4 |
| Image_File | Kartenbilddatei | AL100.jpg |
| Notes | Notizen | Auto-generated - requires manual data entry |

## ⚠️ Wichtig

Die Import-Dateien sind **AUTO-GENERIERT** aus den Kartendateien. Das bedeutet:
- ✅ Card-IDs sind korrekt
- ✅ Fraktionen sind korrekt
- ✅ Bilder sind verlinkt
- ❌ Unit-Namen müssen manuell gefüllt werden
- ❌ Punkte sind Platzhalter (müssen angepasst werden)
- ❌ Stats (Health, Speed, etc.) sind Standardwerte

## 🎯 Nächste Schritte

1. **CSV öffnen** in Excel oder Google Sheets
2. **Einheitendaten nachtragen** aus den Originalkartenbildern oder den offiziellen Dust 1947 Regeln
3. **Punkte kalibrieren** basierend auf den Karteneffekten
4. **Import durchführen** über das Admin-Panel

## 📄 Format-Details

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

### CSV Struktur
```csv
Card_ID,Name,Faction,Type,Points,Health,Level,Speed,March_Speed,Image_File,Notes
AL100,Unit AL100,Allies,I,10,1,1,4,2,AL100.jpg,Auto-generated - requires manual data entry
AL101,Unit AL101,Allies,I,10,1,1,4,2,AL101.jpg,Auto-generated - requires manual data entry
```

## 🚀 Tips zur Datenerfassung

1. **OCR-Tools** für Kartentexte verwenden (z.B. Tesseract, Google Vision API)
2. **Crowd-Sourcing**: Community zur Datenerfassung einbeziehen
3. **Systematisches Vorgehen**: Pro Fraktion/Kategorie arbeiten
4. **Validierung**: Daten mit mehreren Quellen vergleichen

## 📞 Fragen?

Falls Fragen zum Import oder Format auftauchen, bitte konsultieren Sie:
- Die Admin-Panel Dokumentation
- Das Datenbankschema (schema.sql)
- Dust 1947 Originaldokumentation

