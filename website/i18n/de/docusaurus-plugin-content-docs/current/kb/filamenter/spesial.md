---
sidebar_position: 7
title: Spezialwerkstoffe
description: ASA, PC, PP, PVA, HIPS und andere Spezialwerkstoffe für fortgeschrittene Anwendungsfälle
---

# Spezialwerkstoffe

Neben den gängigen Materialien gibt es eine Reihe von Spezialwerkstoffen für spezifische Anwendungsfälle — von UV-beständigen Außenteilen bis hin zu wasserlöslichem Stützmaterial. Hier ist eine praktische Übersicht.

---

## ASA (Acrylnitril-Styrol-Acrylat)

ASA ist die beste Alternative zu ABS für den Außeneinsatz. Es druckt nahezu identisch wie ABS, verträgt aber Sonnenlicht und Witterung weit besser.

### Einstellungen

| Parameter | Wert |
|-----------|------|
| Düsentemperatur | 240–260 °C |
| Betttemperatur | 90–110 °C |
| Kammertemperatur | 45–55 °C |
| Teilkühlung | 0–20% |
| Trocknung | Empfohlen (70 °C / 4–6 h) |

### Eigenschaften

- **UV-beständig:** Speziell für langanhaltende Sonnenexposition entwickelt, ohne zu vergilben oder zu reißen
- **Wärmestabil:** Glasübergangstemperatur ~100 °C
- **Schlagfest:** Bessere Schlagzähigkeit als ABS
- **Gehäuse erforderlich:** Verzieht sich genauso wie ABS — X1C/P1S liefert die besten Ergebnisse

:::tip ASA statt ABS im Freien
Soll das Teil im Freien bei jedem Wetter (Sonne, Regen, Frost) eingesetzt werden? ASA statt ABS wählen. ASA hält viele Jahre ohne sichtbaren Abbau aus. ABS beginnt nach Monaten zu reißen und zu vergilben.
:::

### Anwendungsbereiche
- Außenhalterungen, Gehäuse und Befestigungspunkte
- Karosserieteile, Antennenhalterungen
- Gartenmöbel und Außenumgebungen
- Beschilderung und Spender außen an Gebäuden

---

## PC (Polycarbonat)

Polycarbonat ist einer der stärksten und schlagzähsten Kunststoffe, die 3D-gedruckt werden können. Es ist transparent und verträgt extreme Temperaturen.

### Einstellungen

| Parameter | Wert |
|-----------|------|
| Düsentemperatur | 260–310 °C |
| Betttemperatur | 100–120 °C |
| Kammertemperatur | 50–70 °C |
| Teilkühlung | 0–20% |
| Trocknung | Erforderlich (80 °C / 8–12 h) |

:::danger PC benötigt All-Metal-Hotend und hohe Temperatur
PC schmilzt nicht bei Standard-PLA-Temperaturen. Bambu X1C mit dem richtigen Düsensystem verarbeitet PC. Immer prüfen, ob die PTFE-Komponenten im Hotend die Temperatur aushalten — Standard-PTFE hält nicht dauerhaft über 240–250 °C aus.
:::

### Eigenschaften

- **Sehr schlagfest:** Widerstandsfähig gegen Bruch auch bei niedrigen Temperaturen
- **Transparent:** Kann für Fenster, Linsen und optische Komponenten verwendet werden
- **Wärmestabil:** Glasübergangstemperatur ~147 °C — höchste der gängigen Materialien
- **Hygroskopisch:** Nimmt schnell Feuchtigkeit auf — immer gründlich trocknen
- **Verzug:** Starke Schwindung — erfordert Gehäuse und Brim

### Anwendungsbereiche
- Sicherheitsvisiere und Schutzabdeckungen
- Elektrische Gehäuse, die Hitze standhalten
- Linsenhalter und optische Komponenten
- Roboterrahmen und Drohnenkörper

---

## PP (Polypropylen)

Polypropylen ist eines der schwierigsten Materialien zu drucken, bietet aber einzigartige Eigenschaften, die kein anderes Kunststoffmaterial erreicht.

### Einstellungen

| Parameter | Wert |
|-----------|------|
| Düsentemperatur | 220–250 °C |
| Betttemperatur | 80–100 °C |
| Teilkühlung | 20–50% |
| Trocknung | Empfohlen (70 °C / 6 h) |

### Eigenschaften

- **Chemisch resistent:** Widersteht starken Säuren, Laugen, Alkohol und den meisten Lösemitteln
- **Leicht und flexibel:** Geringe Dichte, hält wiederholtes Biegen aus (Lebendscharnier-Effekt)
- **Schlechte Haftung:** Haftet schlecht an sich selbst und an der Druckplatte — das ist die Herausforderung
- **Ungiftig:** Sicher für Lebensmittelkontakt (abhängig von Farbe und Zusätzen)

:::warning PP haftet schlecht auf allem
PP ist dafür bekannt, nicht an der Druckplatte zu haften. PP-Klebeband (wie Tesa-Band oder dediziertes PP-Band) auf der Engineering Plate verwenden oder speziell für PP formulierten Klebestift. Brim von 15–20 mm ist erforderlich.
:::

### Anwendungsbereiche
- Laborflaschen und Chemiebehälter
- Lebensmittellagerungsteile und Küchenutensilien
- Lebendscharniere (Boxdeckel, die Tausende von Öffne/Schließ-Zyklen aushalten)
- Automobilkomponenten, die Chemikalien standhalten

---

## PVA (Polyvinylalkohol) — wasserlösliches Stützmaterial

PVA ist ein Spezialmaterial, das ausschließlich als Stützmaterial verwendet wird. Es löst sich in Wasser auf und hinterlässt eine saubere Oberfläche am Modell.

### Einstellungen

| Parameter | Wert |
|-----------|------|
| Düsentemperatur | 180–220 °C |
| Betttemperatur | 35–60 °C |
| Trocknung | Kritisch (55 °C / 6–8 h) |

:::danger PVA ist extrem hygroskopisch
PVA nimmt Feuchtigkeit schneller auf als jedes andere gängige Filament. PVA VOR dem Drucken gründlich trocknen und immer in einer versiegelten Box mit Silica aufbewahren. Feuchtes PVA bleibt in der Düse stecken und ist sehr schwer zu entfernen.
:::

### Verwendung und Auflösung

1. Modell mit PVA als Stützmaterial drucken (erfordert Multi-Material-Drucker — AMS)
2. Fertigen Druck in warmes Wasser (30–40 °C) legen
3. 30–120 Minuten stehen lassen, Wasser bei Bedarf wechseln
4. Mit sauberem Wasser abspülen und trocknen lassen

**Wenn möglich immer einen dedizierten Extruder für PVA verwenden** — PVA-Rückstände in einem Standard-Extruder können den nächsten Druck ruinieren.

### Anwendungsbereiche
- Komplexe Stützstrukturen, die manuell nicht entfernt werden können
- Interne Überhangstütze ohne sichtbaren Oberflächenabdruck
- Modelle mit Hohlräumen und inneren Kanälen

---

## HIPS (High Impact Polystyrol) — lösemittellösliches Stützmaterial

HIPS ist ein weiteres Stützmaterial, das für die Verwendung mit ABS konzipiert ist. Es löst sich in **Limonen** (Zitronen-Lösemittel).

### Einstellungen

| Parameter | Wert |
|-----------|------|
| Düsentemperatur | 220–240 °C |
| Betttemperatur | 90–110 °C |
| Kammertemperatur | 45–55 °C |
| Trocknung | Empfohlen (65 °C / 4–6 h) |

### Verwendung mit ABS

HIPS druckt bei denselben Temperaturen wie ABS und haftet gut daran. Nach dem Drucken wird HIPS aufgelöst, indem der Druck für 30–60 Minuten in D-Limonen gelegt wird.

:::warning Limonen ist kein Wasser
D-Limonen ist ein Lösemittel, das aus Orangenschalen gewonnen wird. Es ist relativ ungefährlich, aber trotzdem Handschuhe tragen und in einem belüfteten Raum arbeiten. Gebrauchtes Limonen nicht in den Abfluss schütten — zur Recyclingstation bringen.
:::

### Vergleich: PVA vs. HIPS

| Eigenschaft | PVA | HIPS |
|-------------|-----|------|
| Lösemittel | Wasser | D-Limonen |
| Kompatibles Material | PLA-kompatibel | ABS-kompatibel |
| Feuchteempfindlichkeit | Extrem hoch | Moderat |
| Kosten | Hoch | Moderat |
| Verfügbarkeit | Gut | Moderat |

---

## PVB / Fibersmooth — ethanolglättbares Material

PVB (Polyvinylbutyral) ist ein einzigartiges Material, das mit **Ethanol (Alkohol) geglättet** werden kann — ähnlich wie ABS mit Aceton geglättet werden kann, aber viel sicherer.

### Einstellungen

| Parameter | Wert |
|-----------|------|
| Düsentemperatur | 190–210 °C |
| Betttemperatur | 35–55 °C |
| Teilkühlung | 80–100% |
| Trocknung | Empfohlen (55 °C / 4 h) |

### Ethanol-Glättung

1. Modell mit Standard-PVB-Einstellungen drucken
2. 99%iges Isopropylalkohol (IPA) oder Ethanol mit einem Pinsel auftragen
3. 10–15 Minuten trocknen lassen — die Oberfläche läuft gleichmäßig aus
4. Bei Bedarf für eine glattere Oberfläche wiederholen
5. Alternativ: Auftragen und für 5 Minuten in einem geschlossenen Behälter für Dampfbehandlung legen

:::tip Sicherer als Aceton
IPA/Ethanol ist viel sicherer zu handhaben als Aceton. Der Flammpunkt ist höher und die Dämpfe sind weit weniger giftig. Gute Belüftung wird dennoch empfohlen.
:::

### Anwendungsbereiche
- Figuren und Dekorationen, bei denen eine glatte Oberfläche gewünscht wird
- Prototypen zur Präsentation
- Teile, die lackiert werden sollen — glatte Oberfläche ergibt bessere Lackhaftung

---

## Empfohlene Druckplatten für Spezialwerkstoffe

| Material | Empfohlene Platte | Klebestift? |
|----------|------------------|-------------|
| ASA | Engineering Plate / High Temp Plate | Ja |
| PC | High Temp Plate | Ja (erforderlich) |
| PP | Engineering Plate + PP-Band | PP-spezifisches Band |
| PVA | Cool Plate / Textured PEI | Nein |
| HIPS | Engineering Plate / High Temp Plate | Ja |
| PVB | Cool Plate / Textured PEI | Nein |
