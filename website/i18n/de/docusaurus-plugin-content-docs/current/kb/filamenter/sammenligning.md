---
sidebar_position: 9
title: Materialvergleich
description: Alle 3D-Druckmaterialien im direkten Vergleich — Festigkeit, Temperatur, Preis, Schwierigkeitsgrad
---

# Materialvergleich

Die Wahl des richtigen Filaments ist genauso wichtig wie die Wahl des richtigen Werkzeugs für eine Aufgabe. Dieser Artikel gibt dir das vollständige Bild — von einer einfachen Vergleichstabelle bis zu Shore-Härte, HDT-Werten und einer praktischen Entscheidungshilfe.

## Große Vergleichstabelle

| Material | Festigkeit | Temp-Best | Flexibilität | UV-Best | Chem. Best | Düsenanf. | Gehäuse | Schwierigkeit | Preis |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Messing | Nein | ★ Leicht | Niedrig |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Messing | Nein | ★★ | Niedrig |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Messing | JA | ★★★ | Niedrig |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Messing | JA | ★★★ | Mittel |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Messing | Nein | ★★★ | Mittel |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Messing | JA | ★★★★ | Hoch |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Gehärteter Stahl | JA | ★★★★ | Hoch |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Messing | JA | ★★★★ | Hoch |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Gehärteter Stahl | Nein | ★★ | Mittel |

**Erklärung:**
- ★ = schwach/niedrig/schlecht
- ★★★ = mittel/Standard
- ★★★★★ = ausgezeichnet/beste in der Klasse

---

## Das richtige Material wählen — Entscheidungshilfe

Unsicher, was du wählen sollst? Folge diesen Fragen:

### Muss es Hitze standhalten?
**Ja** → ABS, ASA, PC oder PA

- Etwas Hitze (bis ~90 °C): **ABS** oder **ASA**
- Viel Hitze (über 100 °C): **PC** oder **PA**
- Maximale Temperaturbeständigkeit: **PC** (bis ~120 °C) oder **PA-CF** (bis ~160 °C)

### Muss es flexibel sein?
**Ja** → **TPU**

- Sehr weich (wie Gummi): TPU 85A
- Standard flexibel: TPU 95A
- Semi-flexibel: PETG oder PA

### Soll es im Freien verwendet werden?
**Ja** → **ASA** ist die klare Wahl

ASA wurde speziell für UV-Exposition entwickelt und ist ABS im Freien überlegen. PETG ist die zweitbeste Wahl, wenn ASA nicht verfügbar ist.

### Braucht es maximale Festigkeit?
**Ja** → **PA-CF** oder **PC**

- Stärkstes Leichtgewicht-Komposit: **PA-CF**
- Stärkster reiner Thermoplast: **PC**
- Gute Festigkeit zu niedrigerem Preis: **PA (Nylon)**

### Einfachstes mögliches Drucken?
→ **PLA**

PLA ist das verzeihendste Material überhaupt. Niedrigste Temperatur, keine Gehäuseanforderungen, minimales Verzugsrisiko.

### Lebensmittelkontakt?
→ **PLA** (mit Vorbehalt)

PLA selbst ist nicht giftig, aber:
- Edelstahldüse verwenden (kein Messing — kann Blei enthalten)
- FDM-Drucke sind wegen poröser Oberfläche nie wirklich „lebensmittelsicher" — Bakterien können wachsen
- Anspruchsvolle Umgebungen vermeiden (Säure, heißes Wasser, Spülmaschine)
- PETG ist eine bessere Option für Einmalkontakt

---

## Shore-Härte erklärt

Shore-Härte beschreibt die Härte und Steifigkeit von Elastomeren und Kunststoffmaterialien. Beim 3D-Druck ist sie besonders relevant für TPU und andere flexible Filamente.

### Shore A — flexible Materialien

Die Shore-A-Skala reicht von 0 (extrem weich, fast wie Gel) bis 100 (extrem harter Gummi). Werte über 90A nähern sich starren Kunststoffmaterialien.

| Shore-A-Wert | Gefühlte Härte | Beispiel |
|---|---|---|
| 30A | Extrem weich | Silikon, Gelee |
| 50A | Sehr weich | Weicher Gummi, Ohrstöpsel |
| 70A | Weich | Autoschlauchinnenrohr, Laufschuh-Zwischensohle |
| 85A | Mittelweich | Fahrradreifen, weiches TPU-Filament |
| 95A | Halbsteif | Standard-TPU-Filament |
| 100A ≈ 55D | Grenze zwischen Skalen | — |

**TPU 95A** ist der Industriestandard für 3D-Druck und bietet eine gute Balance zwischen Elastizität und Druckbarkeit. **TPU 85A** ist sehr weich und erfordert mehr Geduld beim Drucken.

### Shore D — starre Materialien

Shore D wird für härtere Thermoplaste verwendet:

| Material | Ungefähres Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Nicht dieselbe Skala
Shore A 95 und Shore D 40 sind nicht dasselbe, auch wenn die Zahlen nah erscheinen mögen. Die Skalen sind unterschiedlich und überlappen sich nur teilweise um die 100A/55D-Grenze. Immer prüfen, welche Skala der Lieferant angibt.
:::

---

## Temperaturtoleranzen — HDT und VST

Zu wissen, bei welcher Temperatur ein Material nachgibt, ist entscheidend für Funktionsteile. Zwei Standardmessungen werden verwendet:

- **HDT (Heat Deflection Temperature)** — Temperatur, bei der das Material sich unter einer standardisierten Last um 0,25 mm biegt. Maß für die Gebrauchstemperatur unter Last.
- **VST (Vicat Softening Temperature)** — Temperatur, bei der eine standardisierte Nadel 1 mm in das Material eindringt. Maß für den absoluten Erweichungspunkt ohne Last.

| Material | HDT (°C) | VST (°C) | Praktische Max-Temp |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | variiert | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA in heißen Umgebungen
PLA-Teile in einem Auto im Sommer sind ein Rezept für eine Katastrophe. Das Armaturenbrett eines geparkten Autos kann 80–90 °C erreichen. ABS, ASA oder PETG für alles verwenden, was in der Sonne oder Wärme stehen könnte.
:::

:::info PA-Varianten haben sehr unterschiedliche Eigenschaften
PA ist eine Materialfamilie, kein einzelnes Material. PA6 hat eine niedrigere HDT (~70 °C), während PA12 und PA6-CF bei 160–200 °C liegen können. Immer das Datenblatt für genau das verwendete Filament prüfen.
:::

---

## Düsenanforderungen

### Messing-Düse (Standard)

Funktioniert für alle Materialien **ohne** Kohlefaser- oder Glasfaserfüllung:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Messing ist weich und verschleißt schnell durch abrasive Materialien

### Gehärtete Stahl-Düse (Pflicht für Komposite)

**ERFORDERLICH** für:
- PLA-CF (Kohlefaser-PLA)
- PETG-CF
- PA-CF
- ABS-GF (Glasfaser-ABS)
- PPA-CF, PPA-GF
- Alle Filamente mit „-CF", „-GF", „-HF" oder „Karbonfaser" im Namen

Gehärteter Stahl hat eine niedrigere Wärmeleitfähigkeit als Messing — mit +5–10 °C auf die Düsentemperatur kompensieren.

:::danger Karbonfaser-Filamente zerstören Messing-Düsen schnell
Eine Messing-Düse kann nach nur wenigen hundert Gramm CF-Filament merkbar verschlissen sein. Das Ergebnis ist allmähliche Unterextrusion und ungenaue Maße. In gehärteten Stahl investieren, wenn Komposite gedruckt werden.
:::

---

## Kurze Materialübersicht nach Anwendungsbereich

| Anwendungsbereich | Empfohlenes Material | Alternative |
|---|---|---|
| Dekoration, Figuren | PLA, PLA Silk | PETG |
| Funktionale Innenraumteile | PETG | PLA+ |
| Außenexposition | ASA | PETG |
| Flexible Teile, Hüllen | TPU 95A | TPU 85A |
| Motorraum, heiße Umgebungen | PA-CF, PC | ABS |
| Leichte, steife Konstruktion | PLA-CF | PA-CF |
| Stützmaterial (löslich) | PVA | HIPS |
| Lebensmittelkontakt (begrenzt) | PLA (Edelstahldüse) | — |
| Maximale Festigkeit | PA-CF | PC |
| Transparent | PETG klar | PC klar |

Individuelle Materialartikel für detaillierte Informationen zu Temperatureinstellungen, Fehlerbehebung und empfohlenen Profilen für Bambu Lab-Drucker beachten.
