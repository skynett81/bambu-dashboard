---
sidebar_position: 5
title: Filament trocknen
description: Warum, wann und wie man Filament trocknet — Temperaturen, Zeiten und Lagerungstipps für alle Materialien
---

# Filament trocknen

Feuchtes Filament ist eine der häufigsten und am meisten unterschätzten Ursachen für schlechte Drucke. Selbst Filament, das trocken aussieht, kann genug Feuchtigkeit aufgenommen haben, um das Ergebnis zu ruinieren — besonders bei Materialien wie Nylon und PVA.

## Warum Filament trocknen?

Viele Kunststofftypen sind **hygroskopisch** — sie nehmen im Laufe der Zeit Feuchtigkeit aus der Luft auf. Wenn feuchtes Filament durch die heiße Düse geht, verdampft das Wasser abrupt und erzeugt Mikroblasen im geschmolzenen Kunststoff. Das Ergebnis ist:

- **Knister- und Knallgeräusche** beim Drucken
- **Nebel oder Dampf** sichtbar aus der Düse
- **Stringing und Hairing**, das sich nicht wegregeln lässt
- **Raue oder körnige Oberfläche** — besonders auf Deckschichten
- **Schwache Teile** mit schlechter Schichthaftung und Mikrorissen
- **Mattes oder trübes Finish** bei Materialien, die normalerweise glänzend oder seidenglänzend sein sollten

:::warning Filament VOR dem Anpassen von Einstellungen trocknen
Viele Nutzer verbringen Stunden damit, Retrakt und Temperatur zu optimieren, ohne Verbesserungen zu sehen — weil die Ursache feuchtes Filament ist. Immer zuerst das Filament trocknen und erneut testen, bevor Druckeinstellungen geändert werden.
:::

## Welche Materialien müssen getrocknet werden?

Alle Kunststofftypen können feucht werden, aber der Grad der Hygroskopizität variiert enorm:

| Material | Hygroskopisch | Trocknungstemperatur | Trocknungszeit | Priorität |
|---|---|---|---|---|
| PLA | Niedrig | 45–50 °C | 4–6 Stunden | Optional |
| PETG | Mittel | 65 °C | 4–6 Stunden | Empfohlen |
| ABS | Mittel | 65–70 °C | 4 Stunden | Empfohlen |
| TPU | Mittel | 50–55 °C | 4–6 Stunden | Empfohlen |
| ASA | Mittel | 65 °C | 4 Stunden | Empfohlen |
| PC | Hoch | 70–80 °C | 6–8 Stunden | Erforderlich |
| PA/Nylon | Extrem hoch | 70–80 °C | 8–12 Stunden | ERFORDERLICH |
| PA-CF | Extrem hoch | 70–80 °C | 8–12 Stunden | ERFORDERLICH |
| PVA | Extrem hoch | 45–50 °C | 4–6 Stunden | ERFORDERLICH |

:::tip Nylon und PVA sind kritisch
PA/Nylon und PVA können innerhalb von **wenigen Stunden** in normalem Innenraumklima genug Feuchtigkeit aufnehmen, um undruckbar zu werden. Öffne niemals eine neue Spule dieser Materialien, ohne sie direkt danach zu trocknen — und drucke immer aus einer versiegelten Box oder Trocknungsbox.
:::

## Anzeichen von feuchtem Filament

Du musst Filament nicht immer nach einer Tabelle trocknen. Lerne die Symptome zu erkennen:

| Symptom | Feuchtigkeit? | Andere mögliche Ursachen |
|---|---|---|
| Knister-/Knallgeräusche | Ja, sehr wahrscheinlich | Teilweise verstopfte Düse |
| Nebel/Dampf aus der Düse | Ja, fast sicher | Keine andere Ursache |
| Raue, körnige Oberfläche | Ja, möglich | Temp zu niedrig, Geschwindigkeit zu hoch |
| Stringing, das nicht verschwindet | Ja, möglich | Falscher Retrakt, Temp zu hoch |
| Schwache, spröde Teile | Ja, möglich | Temp zu niedrig, falscher Infill |
| Farbveränderung oder mattes Finish | Ja, möglich | Falsche Temp, verbrannter Kunststoff |

## Trocknungsmethoden

### Filamenttrockner (empfohlen)

Dedizierte Filamenttrockner sind die einfachste und sicherste Lösung. Sie halten eine genaue Temperatur und ermöglichen das Drucken direkt aus dem Trockner während des gesamten Jobs.

Beliebte Modelle:
- **eSun eBOX** — erschwinglich, kann aus der Box drucken, unterstützt die meisten Materialien
- **Bambu Lab Filament Dryer** — optimiert für Bambu AMS, unterstützt hohe Temperaturen
- **Polymaker PolyDryer** — gutes Thermometer und gute Temperaturregelung
- **Sunlu S2 / S4** — budgetfreundlich, mehrere Spulen gleichzeitig

Vorgehensweise:
```
1. Spulen in den Trockner legen
2. Temperatur aus der obigen Tabelle einstellen
3. Timer auf die empfohlene Zeit setzen
4. Warten — den Prozess nicht abkürzen
5. Direkt aus dem Trockner drucken oder sofort einschweißen
```

### Lebensmitteldehydrator

Ein gewöhnlicher Lebensmitteldehydrator funktioniert überraschend gut als Filamenttrockner:

- Erschwinglich in der Anschaffung (ab ca. 30 €)
- Gute Luftzirkulation
- Unterstützt Temperaturen bis zu 70–75 °C bei vielen Modellen

:::warning Max-Temperatur des Dehydrators prüfen
Viele günstige Lebensmitteldehydratoren haben ungenaue Thermostate und können um ±10 °C schwanken. Tatsächliche Temperatur mit einem Thermometer messen für PA und PC, die hohe Wärme benötigen.
:::

### Ofen

Der Backofen kann im Notfall verwendet werden, erfordert aber Vorsicht:

:::danger PLA NIEMALS in einem normalen Ofen über 60 °C — es verformt sich!
PLA beginnt bereits bei 55–60 °C zu erweichen. Ein heißer Ofen kann Spulen zerstören, den Kern schmelzen und das Filament unbrauchbar machen. Den Ofen für PLA niemals verwenden, es sei denn, du weißt, dass die Temperatur genau kalibriert und unter 50 °C liegt.
:::

Für Materialien, die höhere Temperaturen vertragen (ABS, ASA, PA, PC):
```
1. Ofen auf die gewünschte Temperatur vorheizen
2. Tatsächliche Temperatur mit einem Thermometer überprüfen
3. Spulen auf einem Rost legen (nicht direkt auf dem Ofenboden)
4. Tür einen Spalt offen lassen, damit Feuchtigkeit entweichen kann
5. Beim ersten Mal mit dieser Methode überwachen
```

### Bambu Lab AMS

Bambu Lab AMS Lite und AMS Pro haben eine integrierte Trocknungsfunktion (geringe Wärme + Luftzirkulation). Dies ist kein Ersatz für vollständiges Trocknen, hält aber bereits getrocknetes Filament während des Druckens trocken.

- AMS Lite: Passives Trocknen — begrenzt Feuchtigkeitsaufnahme, trocknet nicht aktiv
- AMS Pro: Aktive Heizung — etwas Trocknen möglich, aber nicht so effektiv wie ein dedizierter Trockner

## Filamentlagerung

Richtige Lagerung nach dem Trocknen ist genauso wichtig wie der Trocknungsprozess selbst:

### Beste Lösungen

1. **Trockenschrank mit Silicagel** — dedizierter Schrank mit Hygrometer und Trocknungsmittel. Hält die Feuchtigkeit konstant niedrig (idealerweise unter 20 % RH)
2. **Vakuumbeutel** — Luft absaugen und mit Trocknungsmittel innen versiegeln. Günstigste Langzeitlagerung
3. **Ziplock-Beutel mit Trocknungsmittel** — einfach und effektiv für kürzere Zeiträume

### Silicagel und Trocknungsmittel

- **Blaues/orangefarbenes Silicagel** zeigt den Sättigungsgrad an — austauschen oder regenerieren (im Ofen bei 120 °C trocknen), wenn sich die Farbe ändert
- **Perlenförmiges Silicagel** ist effektiver als Granulat
- **Trocknungsmittel-Pakete** von Filamentherstellern können regeneriert und wiederverwendet werden

### Hygrometer in der Aufbewahrungsbox

Ein günstiges digitales Hygrometer zeigt die aktuelle Luftfeuchtigkeit in der Box an:

| Relative Luftfeuchtigkeit (RH) | Status |
|---|---|
| Unter 15 % | Ideal |
| 15–30 % | Gut für die meisten Materialien |
| 30–50 % | Akzeptabel für PLA und PETG |
| Über 50 % | Problematisch — besonders für PA, PVA, PC |

## Praktische Tipps

- **Direkt VOR dem Drucken trocknen** — getrocknetes Filament kann in normalem Innenraumklima innerhalb von Tagen wieder feucht werden
- **Aus dem Trockner drucken** für PA, PC und PVA — nicht nur trocknen und weglegen
- **Neue Spule ≠ trockene Spule** — Hersteller versiegeln mit Trocknungsmittel, aber die Lieferkette kann versagt haben. Neue Spulen hygroskopischer Materialien immer trocknen
- **Getrocknete Spulen beschriften** mit dem Trocknungsdatum
- **Dediziertes PTFE-Rohr** vom Trockner zum Drucker minimiert die Exposition während des Druckens

## Bambu Dashboard und Trocknungsstatus

Bambu Dashboard ermöglicht das Protokollieren von Filamentinformationen, einschließlich des letzten Trocknungsdatums unter Filamentprofilen. Damit behält man den Überblick, welche Spulen frisch getrocknet sind und welche eine neue Runde benötigen.
