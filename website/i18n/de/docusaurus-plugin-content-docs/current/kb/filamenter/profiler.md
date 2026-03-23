---
sidebar_position: 8
title: Druckprofile und Einstellungen
description: Druckprofile in Bambu Studio verstehen und anpassen — Geschwindigkeit, Temperatur, Retrakt und Qualitätseinstellungen
---

# Druckprofile und Einstellungen

Ein Druckprofil ist eine Sammlung von Einstellungen, die genau bestimmen, wie der Drucker arbeitet — von Temperatur und Geschwindigkeit bis zu Retrakt und Schichthöhe. Das richtige Profil ist der Unterschied zwischen einem perfekten Druck und einem misslungenen.

## Was ist ein Druckprofil?

Bambu Studio unterscheidet zwischen drei Profiltypen:

- **Filamentprofil** — Temperatur, Kühlung, Retrakt und Trocknung für ein bestimmtes Material
- **Prozessprofil** — Schichthöhe, Geschwindigkeit, Infill und Stützstruktureinstellungen
- **Druckerprofil** — maschinenspezifische Einstellungen (werden für Bambu Lab-Drucker automatisch gesetzt)

Bambu Studio liefert generische Profile für alle Bambu Lab-Filamente und eine Reihe von Drittmaterialien. Drittanbieter wie Polyalkemi, eSUN und Fillamentum erstellen zusätzlich optimierte Profile, die für ihr jeweiliges Filament feinabgestimmt sind.

Profile können frei zwischen Nutzern importiert, exportiert und geteilt werden.

## Profile in Bambu Studio importieren

1. Profil (JSON-Datei) von der Website des Lieferanten oder von MakerWorld herunterladen
2. Bambu Studio öffnen
3. Zu **Datei → Importieren → Konfiguration importieren** gehen
4. Heruntergeladene Datei auswählen
5. Das Profil erscheint unter der Filamentauswahl im Slicer

:::tip Organisation
Profile mit einem beschreibenden Namen versehen, z.B. „Polyalkemi PLA HF 0,20mm Balanced", damit das richtige Profil beim nächsten Mal leicht gefunden werden kann.
:::

## Wichtige Einstellungen erklärt

### Temperatur

Temperatur ist die wichtigste Einzeleinstellung. Zu niedrige Temperatur ergibt schlechte Schichthaftung und Unterfüllung. Zu hohe ergibt Stringing, blasige Oberfläche und verbranntes Filament.

| Einstellung | Beschreibung | Typisches PLA | Typisches PETG | Typisches ABS |
|---|---|---|---|---|
| Düsentemperatur | Schmelztemperatur | 200–220 °C | 230–250 °C | 240–260 °C |
| Betttemperatur | Druckplattenheizung | 55–65 °C | 70–80 °C | 90–110 °C |
| Kammertemperatur | Gehäusetemperatur | Nicht nötig | Optional | 40–60 °C empfohlen |

Bambu Lab X1C und P1-Serie haben aktive Kammerheizung. Für ABS und ASA ist dies entscheidend, um Verzug und Schichtablösung zu vermeiden.

### Geschwindigkeit

Bambu Lab-Drucker können extrem schnell laufen, aber höhere Geschwindigkeit bedeutet nicht immer bessere Ergebnisse. Besonders die Außenwandgeschwindigkeit beeinflusst die Oberfläche.

| Einstellung | Was es beeinflusst | Qualitätsmodus | Ausgewogen | Schnell |
|---|---|---|---|---|
| Außenwand | Oberflächenergebnis | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Innenwand | Strukturelle Festigkeit | 100 mm/s | 150 mm/s | 200+ mm/s |
| Infill | Innenfüllung | 150 mm/s | 200 mm/s | 300+ mm/s |
| Deckschicht | Obere Oberfläche | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Bodenschicht | Erste Schicht | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Außenwandgeschwindigkeit ist der Schlüssel zur Oberflächenqualität
Außenwandgeschwindigkeit auf 45–60 mm/s senken für seidigen Glanz. Dies gilt besonders für Silk PLA und Matte-Filamente. Innenwände und Infill können weiterhin schnell laufen, ohne die Oberfläche zu beeinflussen.
:::

### Retrakt (Rückzug)

Retrakt zieht das Filament leicht zurück in die Düse, wenn der Drucker sich ohne Extrudieren bewegt. Dies verhindert Stringing (feine Fäden zwischen Teilen). Falsche Retrakt-Einstellungen führen zu Stringing (zu wenig) oder Verstopfung (zu viel).

| Material | Retrakt-Distanz | Retrakt-Geschwindigkeit | Hinweis |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Standard für die meisten |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Zu viel = Verstopfung |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Ähnlich PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimal! Oder deaktivieren |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Erfordert trockenes Filament |

:::warning TPU-Retrakt
Für TPU und andere flexible Materialien: minimalen Retrakt (0–1 mm) verwenden oder ganz deaktivieren. Zu viel Retrakt führt dazu, dass sich das weiche Filament biegt und im Bowden-Schlauch blockiert, was zu Verstopfung führt.
:::

### Schichthöhe

Die Schichthöhe bestimmt die Balance zwischen Detailgrad und Druckgeschwindigkeit. Niedrige Schichthöhe ergibt feinere Details und glattere Oberflächen, dauert aber viel länger.

| Schichthöhe | Beschreibung | Anwendungsbereich |
|---|---|---|
| 0,08 mm | Ultrafein | Miniaturenfiguren, detaillierte Modelle |
| 0,12 mm | Fein | Visuelle Qualität, Text, Logos |
| 0,16 mm | Hohe Qualität | Standard für die meisten Drucke |
| 0,20 mm | Ausgewogen | Gute Balance Zeit/Qualität |
| 0,28 mm | Schnell | Funktionsteile, Prototypen |

Bambu Studio arbeitet mit Prozesseinstellungen wie „0,16mm High Quality" und „0,20mm Balanced Quality" — diese setzen die Schichthöhe und passen Geschwindigkeit und Kühlung automatisch an.

### Infill (Füllung)

Infill bestimmt, wie viel Material das Innere des Drucks füllt. Mehr Infill = stärker, schwerer und längere Druckzeit.

| Prozent | Anwendungsbereich | Empfohlenes Muster |
|---|---|---|
| 10–15 % | Dekoration, visuell | Gyroid |
| 20–30 % | Allgemeine Verwendung | Cubic, Gyroid |
| 40–60 % | Funktionsteile | Cubic, Honeycomb |
| 80–100 % | Maximale Festigkeit | Rectilinear |

:::tip Gyroid ist König
Gyroid-Muster bietet das beste Festigkeit-zu-Gewicht-Verhältnis und ist isotrop — in alle Richtungen gleich stark. Es ist auch schneller zu drucken als Honeycomb und sieht bei offenen Modellen gut aus. Standardwahl für die meisten Situationen.
:::

## Profil-Tipps pro Material

### PLA — Qualitätsfokus

PLA ist verzeihend und einfach zu verarbeiten. Fokus auf Oberflächenqualität:

- **Außenwand:** 60 mm/s für perfekte Oberfläche, besonders mit Silk PLA
- **Kühlgebläse:** 100 % ab Schicht 3 — entscheidend für scharfe Details und Brücken
- **Brim:** Nicht nötig bei sauberem PLA mit korrekt kalibrierter Platte
- **Schichthöhe:** 0,16 mm High Quality bietet eine gute Balance für dekorative Teile

### PETG — Balance

PETG ist stärker als PLA, aber anspruchsvoller in der Feineinstellung:

- **Prozesseinstellung:** 0,16 mm High Quality oder 0,20 mm Balanced Quality
- **Kühlgebläse:** 30–50 % — zu viel Kühlung ergibt schlechte Schichthaftung und spröde Drucke
- **Z-Hop:** Aktivieren, um zu verhindern, dass die Düse beim Verfahren über die Oberfläche schleift
- **Stringing:** Retrakt anpassen und eher wärmer als kälter drucken

### ABS — Das Gehäuse ist alles

ABS druckt gut, benötigt aber eine kontrollierte Umgebung:

- **Kühlgebläse:** AUS (0 %) — absolut entscheidend! Kühlung verursacht Schichtablösung und Verzug
- **Gehäuse:** Türen schließen und Kammer auf 40–60 °C aufwärmen lassen, bevor der Druck startet
- **Brim:** 5–8 mm empfohlen für große flache Teile — verhindert Verzug an Ecken
- **Belüftung:** Gute Raumbelüftung sicherstellen — ABS gibt Styrendämpfe ab

### TPU — Langsam und vorsichtig

Flexible Materialien erfordern einen völlig anderen Ansatz:

- **Geschwindigkeit:** Max. 30 mm/s — zu schnelles Drucken führt zum Knicken des Filaments
- **Retrakt:** Minimal (0–1 mm) oder ganz deaktivieren
- **Direct Drive:** TPU funktioniert nur auf Bambu Lab-Maschinen mit eingebautem Direct Drive
- **Schichthöhe:** 0,20 mm Balanced ergibt gute Schichtfusion ohne zu viel Spannung

### Nylon — Trockenes Filament ist alles

Nylon ist hygroskopisch und nimmt innerhalb von Stunden Feuchtigkeit auf:

- **Immer trocknen:** 70–80 °C für 8–12 Stunden vor dem Druck
- **Gehäuse:** Aus Trocknungsbox direkt in AMS führen, um Filament trocken zu halten
- **Retrakt:** Moderat (1,0–2,0 mm) — feuchtes Nylon erzeugt viel mehr Stringing
- **Druckplatte:** Engineering Plate mit Kleber oder Garolite-Platte für beste Haftung

## Bambu Lab-Voreinstellungen

Bambu Studio hat integrierte Profile für die gesamte Bambu Lab-Produktfamilie:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Bambu Lab Stützmaterialien (Support W, Support G)
- Bambu Lab Spezial (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Generische Profile (Generic PLA, Generic PETG usw.) als Ausgangspunkt für Drittanbieter-Filament

Generische Profile sind ein guter Ausgangspunkt. Temperatur um ±5 °C basierend auf dem tatsächlichen Filament feinabstimmen.

## Drittanbieter-Profile

Viele führende Anbieter bieten fertige Bambu Studio-Profile an, die für ihr jeweiliges Filament optimiert sind:

| Anbieter | Verfügbare Profile | Download |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Bambu Lab-Profile](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [eSUN-Profile](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Fillamentum-Profile](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Spectrum-Profile](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Fiberlogy-Profile](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [add:north-Profile](https://addnorth.com/printing-profiles) |

:::info Wo findet man Profile?
- **Bambu Studio:** Integrierte Profile für Bambu Lab-Materialien und viele Drittanbieter
- **Website des Anbieters:** Nach „Bambu Studio profile" oder „JSON profile" unter Downloads suchen
- **Bambu Dashboard:** Im Druckprofil-Panel im Werkzeug-Bereich
- **MakerWorld:** Profile werden oft zusammen mit Modellen von anderen Nutzern geteilt
:::

## Profile exportieren und teilen

Eigene Profile können exportiert und mit anderen geteilt werden:

1. Zu **Datei → Exportieren → Konfiguration exportieren** gehen
2. Profile auswählen (Filament, Prozess, Drucker), die exportiert werden sollen
3. Als JSON-Datei speichern
4. Datei direkt teilen oder auf MakerWorld hochladen

Dies ist besonders nützlich, wenn ein Profil über Zeit feinabgestimmt wurde und bei einer Neuinstallation von Bambu Studio erhalten bleiben soll.

---

## Fehlerbehebung mit Profilen

### Stringing

Feine Fäden zwischen gedruckten Teilen — in dieser Reihenfolge versuchen:

1. Retrakt-Distanz um 0,5 mm erhöhen
2. Drucktemperatur um 5 °C senken
3. „Wipe on retract" aktivieren
4. Prüfen, ob Filament trocken ist

### Unterfüllung / Lücken in Wänden

Der Druck sieht nicht solide aus oder hat Lücken:

1. Prüfen, ob die Filamentdurchmesser-Einstellung stimmt (1,75 mm)
2. Flow Rate in Bambu Studio kalibrieren (Kalibrierung → Flow Rate)
3. Temperatur um 5 °C erhöhen
4. Auf teilweise verstopfte Düse prüfen

### Schlechte Schichthaftung

Schichten halten nicht gut zusammen:

1. Temperatur um 5–10 °C erhöhen
2. Kühlgebläse reduzieren (besonders PETG und ABS)
3. Druckgeschwindigkeit reduzieren
4. Prüfen, ob Gehäuse warm genug ist (für ABS/ASA)
