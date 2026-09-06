# 📊 DUST 1947 Army Builder - Feature-Analyse & Roadmap

**Datum:** 2026-08-27
**Aktueller Stand:** MVP (Minimum Viable Product)
**Gesamt-Score:** 6/10

---

## ✅ **IMPLEMENTIERTE FEATURES (Aktuell)**

### **CORE FEATURES** ✅

#### 1. Army Management
- ✅ Army Liste anzeigen
- ✅ Army erstellen (Bloc, Name, Punktelimit)
- ✅ Army bearbeiten (Name, Punktelimit)
- ✅ Army löschen (mit Confirmation)
- ✅ Army auswählen/anzeigen
- ✅ Punkteberechnung (verbraucht/gesamt)

#### 2. Platoon System
- ✅ Platoons zur Army hinzufügen
- ✅ Platoons entfernen
- ✅ Platoon-Slots anzeigen (COMMAND, COMBAT 1-4)
- ✅ Verfügbare Platoons nach Bloc filtern

#### 3. Unit Management
- ✅ Units zur Army hinzufügen (frei oder in Platoon)
- ✅ Units aus Army entfernen
- ✅ Unit Details anzeigen (Card rechts)
- ✅ Unit Quantity ändern
- ✅ Unit-Waffen anzeigen
- ✅ Special Rules anzeigen

#### 4. Data Loading
- ✅ Blocs laden
- ✅ Factions laden
- ✅ Units mit Stats laden
- ✅ Weapons mit Stats laden
- ✅ Rules laden
- ✅ Platoons laden

#### 5. UI/UX
- ✅ 3-Spalten Layout (Desktop)
- ✅ Loading States
- ✅ Error Handling
- ✅ Confirmation Dialogs
- ✅ Material-UI Design
- ✅ Unit Card (Detail-View)

---

## ❌ **FEHLENDE/UNVOLLSTÄNDIGE FEATURES**

### **CRITICAL (Basis-Funktionalität fehlt)**

#### 1. Regelvalidierung 🔴 **PRIO 1**
- ❌ Faction Bonus Check (75% Rule)
- ❌ Bloc-Kompatibilität prüfen
- ❌ Platoon-Slot Validation (nur ein COMMAND)
- ❌ Söldner-System (Mercenary Units)
- ❌ Points-Over-Limit Warning

**Problem:** User können illegale Armeen bauen!

#### 2. Image/Icon System 🔴 **PRIO 1**
- ❌ Unit Images nicht angezeigt
- ❌ Faction Symbols nicht angezeigt
- ❌ Weapon Icons fehlen
- ❌ Type Icons (Infantry, Vehicle, Aircraft)

**Vorhanden in DB:** 
- `backend/images/` mit Icons (AD_AU_STD.png, etc.)
- Unit `image_url` Feld
- Faction `symbol_url` Feld

**Problem:** Bilder sind da, werden aber nicht geladen!

#### 3. Mobile Responsiveness 🟠 **PRIO 2**
- ⚠️ 3-Spalten-Layout nicht mobil-optimiert
- ❌ Keine Touch-Gesten
- ❌ Kein Mobile-Menü

**Problem:** Auf Tablets/Phones nicht nutzbar!

---

### **IMPORTANT (Nutzbarkeit leidet)**

#### 4. Search & Filter 🟠 **PRIO 2**
- ❌ Units filtern (nach Type, Faction, Points)
- ❌ Units suchen (Name)
- ❌ Platoons filtern
- ❌ Sort-Optionen

#### 5. Army Statistics 🟠 **PRIO 2**
- ❌ Durchschnittliche Range
- ❌ Total Health
- ❌ Unit-Type Breakdown (2x Infantry, 1x Vehicle)
- ❌ Most used weapons
- ❌ Faction distribution

#### 6. Persistence & State 🟠 **PRIO 2**
- ❌ LocalStorage für letzte Army
- ❌ Session State (Reload → Reset)
- ❌ Undo/Redo

#### 7. Export/Share 🟠 **PRIO 3**
- ❌ PDF Export
- ❌ Print View
- ❌ Army Link teilen
- ❌ Copy to Clipboard

---

### **NICE-TO-HAVE (Erweiterte Features)**

#### 8. Advanced UI 🟢 **PRIO 4**
- ❌ Drag & Drop für Units
- ❌ Bulk Operations (mehrere Units)
- ❌ Keyboard Shortcuts
- ❌ Theme Switcher (Dark Mode)
- ❌ Animations/Transitions

#### 9. Data Management 🟢 **PRIO 4**
- ❌ Army Duplicate/Clone
- ❌ Army Templates
- ❌ Import/Export armies (JSON)
- ❌ Version History

#### 10. Community Features 🟢 **PRIO 5**
- ❌ User Accounts
- ❌ Army Sharing (Public/Private)
- ❌ Comments/Ratings
- ❌ Popular Armies
- ❌ Leaderboard

#### 11. Game Support 🟢 **PRIO 5**
- ❌ Mission Selector
- ❌ Army vs Army Simulator
- ❌ Dice Roller
- ❌ Turn Tracker

---

## 🚨 **BUGS & ISSUES**

### **Kritisch**
1. ⚠️ **CORS-Fehler** wenn nicht localhost → GELÖST ✅
2. ⚠️ **Images laden nicht** (URL path problem)
3. ⚠️ **Duplicate unit.list action** in army_api.php (Zeile 58 & 86)

### **Klein**
1. ⚠️ Empty States haben keinen Text ("Freie Einheiten" ist leer)
2. ⚠️ Edit Army nutzt `prompt()` statt Dialog
3. ⚠️ Keine Loading Spinner bei Unit-Add

---

## 🎯 **PRIORISIERTE ROADMAP**

### **Phase 1: MVP Completion (1-2 Wochen)**

#### **Sprint 1: Critical Fixes** 🔴
**Ziel:** App funktional machen

**Must-Have:**
1. ✅ Image System reparieren (2h)
   - Image-URL Mapping prüfen
   - Backend image serving
   - Fallback Images

2. ✅ Regelvalidierung (4h)
   - Faction Bonus Calculation
   - Bloc-Check
   - Points-Limit Warning
   - Visual Feedback (Red/Green)

3. ✅ Mobile Basic Support (3h)
   - 1-Column Layout für Mobile
   - Touch-friendly Buttons
   - Responsive Breakpoints

**Geschätzter Aufwand:** 9 Stunden

---

#### **Sprint 2: Usability** 🟠
**Ziel:** App angenehm nutzbar

**Should-Have:**
4. ✅ Search & Filter (4h)
   - Unit Search by Name
   - Filter: Type, Faction, Points Range
   - Sort: Name, Points, Type

5. ✅ Empty States (1h)
   - "Keine Armeen" Message
   - "Freie Einheiten" Placeholder
   - CTA Buttons

6. ✅ Better Dialogs (2h)
   - Edit Army Dialog (statt prompt)
   - Confirm Delete mit Details
   - Loading States in Dialogs

**Geschätzter Aufwand:** 7 Stunden

---

### **Phase 2: Polish & Extend (2-3 Wochen)**

#### **Sprint 3: Statistics & Export** 🟠

7. ✅ Army Statistics Dashboard (3h)
   - Unit Count by Type
   - Average Stats
   - Weapon Distribution
   - Visual Charts

8. ✅ PDF Export (4h)
   - Print-friendly Layout
   - Army List PDF
   - QR Code für Sharing

9. ✅ Army Duplicate (1h)
   - Clone mit neuem Namen
   - Copy all Units/Platoons

**Geschätzter Aufwand:** 8 Stunden

---

#### **Sprint 4: Advanced UI** 🟢

10. ✅ Drag & Drop (5h)
    - Units zwischen Platoons ziehen
    - Reorder Units
    - Visual Feedback

11. ✅ Keyboard Shortcuts (2h)
    - Ctrl+N: Neue Army
    - Ctrl+S: Save
    - Delete: Remove selected

12. ✅ Dark Mode (3h)
    - Theme Switcher
    - Persistent Theme
    - Dark Color Palette

**Geschätzter Aufwand:** 10 Stunden

---

### **Phase 3: Community & Advanced (4+ Wochen)**

#### **Sprint 5: Sharing & Community** 🟢

13. ✅ User Authentication (8h)
    - Login/Register
    - JWT Tokens
    - User Profile

14. ✅ Army Sharing (6h)
    - Public/Private Toggle
    - Share Link
    - View-Only Mode

15. ✅ Army Gallery (4h)
    - Browse Public Armies
    - Filter/Search
    - Clone to own

**Geschätzter Aufwand:** 18 Stunden

---

## 📈 **FEATURE-MATRIX**

| Feature | Aktuell | MVP | Polish | Advanced |
|---------|---------|-----|--------|----------|
| **Army CRUD** | ✅ | ✅ | ✅ | ✅ |
| **Unit Management** | ✅ | ✅ | ✅ | ✅ |
| **Platoon System** | ✅ | ✅ | ✅ | ✅ |
| **Images** | ❌ | ✅ | ✅ | ✅ |
| **Regelvalidierung** | ❌ | ✅ | ✅ | ✅ |
| **Mobile Support** | ❌ | ✅ | ✅ | ✅ |
| **Search/Filter** | ❌ | ❌ | ✅ | ✅ |
| **Statistics** | ❌ | ❌ | ✅ | ✅ |
| **PDF Export** | ❌ | ❌ | ✅ | ✅ |
| **Sharing** | ❌ | ❌ | ❌ | ✅ |
| **User Accounts** | ❌ | ❌ | ❌ | ✅ |
| **Drag & Drop** | ❌ | ❌ | ❌ | ✅ |

---

## 💰 **AUFWANDS-SCHÄTZUNG**

### **Zeitaufwand gesamt:**

| Phase | Features | Stunden | Wochen |
|-------|----------|---------|--------|
| **Phase 1** | MVP Completion | 16h | 1-2 |
| **Phase 2** | Polish & Extend | 18h | 2-3 |
| **Phase 3** | Community | 18h+ | 4+ |
| **TOTAL** | | **52h+** | **7-9** |

### **Quick Wins (Sofort umsetzbar):**
1. Image System Fix (2h) → Große visuelle Verbesserung
2. Empty States (1h) → Poliertes Aussehen
3. Regelvalidierung (4h) → Kernfunktionalität

**Total Quick Wins:** 7 Stunden für massive Verbesserung!

---

## 🎯 **EMPFEHLUNG**

### **Sofort starten (Diese Woche):**

**Tag 1-2: Images & Validation** 🔴
```
1. Image System reparieren
2. Faction Bonus Berechnung
3. Points-Limit Warning
```

**Tag 3: Mobile & Empty States** 🟠
```
4. Basic Mobile Layout
5. Empty State Messages
6. Edit Dialog statt prompt()
```

**Ergebnis:** 
- ✅ App sieht professionell aus
- ✅ App funktioniert richtig
- ✅ Auf Mobile nutzbar

---

## 📝 **NOTIZEN**

### **Datenbank ist solide:**
- ✅ 345 Weapon Stats
- ✅ 86 Rules
- ✅ 34 Units
- ✅ Relationships korrekt

### **Code-Qualität:**
- ✅ Saubere Trennung (Frontend/Backend)
- ✅ API gut strukturiert
- ✅ React Hooks korrekt genutzt
- ⚠️ Fehlt: PropTypes/TypeScript
- ⚠️ Fehlt: Tests

### **Deployment:**
- ✅ Lokale Umgebung läuft
- ❌ Production Deploy fehlt
- ❌ CI/CD fehlt

---

## 🚀 **NÄCHSTE SCHRITTE**

**Option A: Quick Wins (empfohlen)**
```bash
Woche 1: Images + Validation + Mobile
Woche 2: Search/Filter + Statistics
→ Nutzbare App für Beta-Tester
```

**Option B: Feature Complete**
```bash
4 Wochen: Alle Phase 1+2 Features
→ Production-Ready App
```

**Option C: Full Product**
```bash
8+ Wochen: Inkl. User Accounts & Sharing
→ Community-Platform
```

---

**Was möchtest du als nächstes umsetzen?**

