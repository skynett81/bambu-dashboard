---
sidebar_position: 4
title: Oberflächenfehler
description: Diagnose und Behebung häufiger Oberflächenprobleme — Blobs, Zits, Schichtlinien, Elephantenfuß und mehr
---

# Oberflächenfehler

Die Oberfläche eines 3D-Drucks verrät viel darüber, was im System passiert. Die meisten Oberflächenfehler haben ein bis zwei klare Ursachen — mit der richtigen Diagnose sind sie überraschend einfach zu beheben.

## Schnelle Diagnoseübersicht

| Symptom | Häufigste Ursache | Erste Maßnahme |
|---|---|---|
| Blobs und Zits | Überextrusion, Nahtplatzierung | Naht anpassen, Flow kalibrieren |
| Sichtbare Schichtlinien | Z-Wobble, zu dicke Schichten | Zu feineren Schichten wechseln, Z-Achse prüfen |
| Elephantenfuß | Erste Schicht zu breit | Elephantenfuß-Kompensation |
| Ringing/Ghosting | Vibrationen bei hoher Geschwindigkeit | Geschwindigkeit senken, Input Shaper aktivieren |
| Unterextrusion | Verstopfte Düse, zu niedrige Temp | Düse reinigen, Temp erhöhen |
| Überextrusion | Flow Rate zu hoch | Flow Rate kalibrieren |
| Pillowing | Zu wenige Deckschichten, zu wenig Kühlung | Deckschichten erhöhen, Kühlgebläse erhöhen |
| Schichtablösung | Zu niedrige Temp, zu viel Kühlung | Temp erhöhen, Kühlgebläse reduzieren |

---

## Blobs und Zits

Blobs sind unregelmäßige Klumpen auf der Oberfläche. Zits sind stecknadelförmige Punkte — oft entlang der Nahtlinie.

### Ursachen

- **Überextrusion** — zu viel Kunststoff wird extrudiert und seitlich herausgedrückt
- **Schlechte Nahtplatzierung** — die Standard-„Nearest"-Naht sammelt alle Übergänge an derselben Stelle
- **Retrakt-Probleme** — unzureichendes Retraktieren erzeugt Druckaufbau in der Düse
- **Feuchtes Filament** — Feuchtigkeit erzeugt Mikroblasen und Tropfen

### Lösungen

**Nahteinstellungen in Bambu Studio:**
```
Bambu Studio → Qualität → Nahtposition
- Aligned: Alle Nähte an derselben Stelle (sichtbar, aber ordentlich)
- Nearest: Nächster Punkt (verteilt Blobs zufällig)
- Back: Hinter dem Objekt (empfohlen für visuelle Qualität)
- Random: Zufällige Verteilung (kaschiert die Naht am besten)
```

**Flow-Rate-Kalibrierung:**
```
Bambu Studio → Kalibrierung → Flow Rate
In Schritten von ±2 % anpassen, bis Blobs verschwinden
```

:::tip Naht auf „Back" für visuelle Qualität
Platziere die Naht auf der Rückseite des Objekts, damit sie am wenigsten sichtbar ist. Kombiniere mit „Wipe on retract" für einen saubereren Nahtabschluss.
:::

---

## Sichtbare Schichtlinien

Alle FDM-Drucke haben Schichtlinien, aber sie sollten konsistent und bei normalen Drucken kaum sichtbar sein. Ungewöhnliche Sichtbarkeit deutet auf konkrete Probleme hin.

### Ursachen

- **Z-Wobble** — die Z-Achse vibriert oder ist nicht gerade, erzeugt ein Wellenmuster über die gesamte Höhe
- **Zu dicke Schichten** — Schichthöhe über 0,28 mm ist selbst bei perfekten Drucken merkbar
- **Temperaturschwankungen** — inkonsistente Schmelztemperatur führt zu variierender Schichtbreite
- **Inkonsistenter Filamentdurchmesser** — billiges Filament mit variierendem Durchmesser

### Lösungen

**Z-Wobble:**
- Prüfen, ob die Z-Leitspindel sauber und geschmiert ist
- Kontrollieren, ob die Spindel verbogen ist (Sichtprüfung beim Drehen)
- Wartungsartikel zur [Schmierung der Z-Achse](/docs/kb/vedlikehold/smoring) lesen

**Schichthöhe:**
- Zu 0,12 mm oder 0,16 mm für eine gleichmäßigere Oberfläche wechseln
- Denke daran: Halbierung der Schichthöhe verdoppelt die Druckzeit

**Temperaturschwankungen:**
- PID-Kalibrierung verwenden (verfügbar über das Bambu Studio Wartungsmenü)
- Zugluft vermeiden, die die Düse beim Drucken abkühlt

---

## Elephantenfuß

Elephantenfuß tritt auf, wenn die erste Schicht breiter ist als der Rest des Objekts — als würde sich das Objekt an der Basis „ausbreiten".

### Ursachen

- Erste Schicht wird zu stark gegen die Platte gedrückt (Z-Offset zu eng)
- Zu hohe Betttemperatur hält den Kunststoff zu lange weich und fließfähig
- Zu wenig Kühlung auf der ersten Schicht gibt dem Kunststoff mehr Zeit zum Ausbreiten

### Lösungen

**Elephantenfuß-Kompensation in Bambu Studio:**
```
Bambu Studio → Qualität → Elephantenfuß-Kompensation
Mit 0,1–0,2 mm beginnen und anpassen, bis der Fuß verschwindet
```

**Z-Offset:**
- First-Layer-Height neu kalibrieren
- Z-Offset schrittweise um 0,05 mm anheben, bis der Fuß weg ist

**Betttemperatur:**
- Betttemperatur um 5–10 °C senken
- Für PLA: 55 °C reicht oft aus — 65 °C kann Elephantenfuß verursachen

:::warning Nicht zu viel kompensieren
Zu hohe Elephantenfuß-Kompensation kann eine Lücke zwischen der ersten Schicht und dem Rest erzeugen. Vorsichtig in Schritten von 0,05 mm anpassen.
:::

---

## Ringing und Ghosting

Ringing (auch „Ghosting" oder „Echoing" genannt) ist ein Wellenmuster in der Oberfläche kurz nach scharfen Kanten oder Ecken. Das Muster „hallt" von der Kante aus.

### Ursachen

- **Vibrationen** — schnelle Beschleunigung und Verzögerung an Ecken überträgt Vibrationen auf den Rahmen
- **Zu hohe Geschwindigkeit** — besonders Außenwandgeschwindigkeit über 100 mm/s erzeugt deutliches Ringing
- **Lose Teile** — lose Spule, vibrierende Kabelkette oder locker montierter Drucker

### Lösungen

**Bambu Lab Input Shaper (Resonanzkompensation):**
```
Bambu Studio → Drucker → Resonanzkompensation
Bambu Lab X1C und P1S haben ein eingebautes Beschleunigungsmessgerät und kalibrieren dies automatisch
```

**Geschwindigkeit reduzieren:**
```
Außenwand: Auf 60–80 mm/s senken
Beschleunigung: Von Standard auf 3000–5000 mm/s² reduzieren
```

**Mechanische Prüfung:**
- Sicherstellen, dass der Drucker auf einer stabilen Unterlage steht
- Prüfen, ob die Spule nicht in ihrem Halter vibriert
- Alle zugänglichen Schrauben an den Außenpaneelen des Rahmens anziehen

:::tip X1C und P1S kalibrieren Ringing automatisch
Bambu Lab X1C und P1S verfügen über eine eingebaute Beschleunigungsmesser-Kalibrierung, die automatisch beim Start ausgeführt wird. „Vollständige Kalibrierung" aus dem Wartungsmenü ausführen, wenn Ringing nach einer Nutzungsperiode auftritt.
:::

---

## Unterextrusion

Unterextrusion tritt auf, wenn der Drucker zu wenig Kunststoff extrudiert. Das Ergebnis sind dünne, schwache Wände, sichtbare Lücken zwischen Schichten und eine struppige Oberfläche.

### Ursachen

- **Teilweise verstopfte Düse** — Karbonaufbau reduziert den Durchfluss
- **Düsentemperatur zu niedrig** — der Kunststoff ist nicht fließfähig genug
- **Abgenutztes Zahnrad** im Extruder-Mechanismus greift das Filament nicht gut genug
- **Geschwindigkeit zu hoch** — Extruder kann mit dem gewünschten Durchfluss nicht mithalten

### Lösungen

**Kaltziehen (Cold Pull):**
```
1. Düse auf 220 °C erhitzen
2. Filament manuell hineinschieben
3. Düse auf 90 °C (PLA) abkühlen, während Druck gehalten wird
4. Filament schnell herausziehen
5. Wiederholen, bis was herausgezogen wird sauber ist
```

**Temperaturanpassung:**
- Düsentemperatur um 5–10 °C erhöhen und erneut testen
- Zu niedrige Temperatur ist eine häufige Ursache für Unterextrusion

**Flow-Rate-Kalibrierung:**
```
Bambu Studio → Kalibrierung → Flow Rate
Schrittweise erhöhen, bis Unterextrusion verschwindet
```

**Extruder-Zahnrad prüfen:**
- Filament entfernen und Zahnrad inspizieren
- Mit einer kleinen Bürste reinigen, wenn Filamentpulver in den Zähnen ist

---

## Überextrusion

Überextrusion erzeugt eine zu breite Raupe — die Oberfläche sieht locker, glänzend oder ungleichmäßig aus, mit Tendenz zu Blobs.

### Ursachen

- **Flow Rate zu hoch** (EM — Extrusion Multiplier)
- **Falscher Filamentdurchmesser** — 2,85 mm Filament mit 1,75 mm-Profil verursacht massive Überextrusion
- **Düsentemperatur zu hoch** macht den Kunststoff zu fließfähig

### Lösungen

**Flow-Rate-Kalibrierung:**
```
Bambu Studio → Kalibrierung → Flow Rate
In Schritten von 2 % senken, bis die Oberfläche gleichmäßig und matt ist
```

**Filamentdurchmesser überprüfen:**
- Tatsächlichen Filamentdurchmesser mit einer Schieblehre an 5–10 Stellen entlang des Filaments messen
- Durchschnittliche Abweichung über 0,05 mm weist auf minderwertiges Filament hin

---

## Pillowing

Pillowing sind blasige, ungleichmäßige Deckschichten mit „Kissen" aus Kunststoff zwischen den Deckschichten. Besonders auffällig bei niedrigem Infill und zu wenigen Deckschichten.

### Ursachen

- **Zu wenige Deckschichten** — Kunststoff über dem Infill bricht in die Lücken ein
- **Zu wenig Kühlung** — Kunststoff erstarrt nicht schnell genug, um über Infill-Lücken zu überbrücken
- **Infill zu niedrig** — große Lücken im Infill sind schwer zu überbrücken

### Lösungen

**Anzahl der Deckschichten erhöhen:**
```
Bambu Studio → Qualität → Obere Schalenlagen
Minimum: 4 Lagen
Empfohlen für gleichmäßige Oberfläche: 5–6 Lagen
```

**Kühlung erhöhen:**
- PLA sollte das Kühlgebläse ab Schicht 3 auf 100 % haben
- Unzureichende Kühlung ist die häufigste Ursache für Pillowing

**Infill erhöhen:**
- Von 10–15 % auf 20–25 % gehen, wenn Pillowing anhält
- Gyroid-Muster gibt eine gleichmäßigere Brückenoberfläche als Linien

:::tip Ironing
Die „Ironing"-Funktion von Bambu Studio fährt die Düse noch einmal über die Deckschicht, um die Oberfläche zu glätten. Unter Qualität → Ironing aktivieren für bestes Deckschicht-Finish.
:::

---

## Schichtablösung (Delamination)

Schichtablösung tritt auf, wenn Schichten nicht richtig aneinander haften. Im schlimmsten Fall bricht der Druck entlang der Schichtlinien auseinander.

### Ursachen

- **Düsentemperatur zu niedrig** — Kunststoff schmilzt nicht gut genug in die darunter liegende Schicht
- **Zu viel Kühlung** — Kunststoff erstarrt zu schnell, bevor er sich verbinden kann
- **Schichtdicke zu groß** — über 80 % des Düsendurchmessers ergibt schlechte Fusion
- **Geschwindigkeit zu hoch** — reduzierte Schmelzzeit pro mm Bahn

### Lösungen

**Temperatur erhöhen:**
- +10 °C gegenüber Standard versuchen und beobachten
- ABS und ASA sind besonders empfindlich — benötigen kontrollierte Kammerheizung

**Kühlung reduzieren:**
- ABS: Kühlgebläse AUS (0 %)
- PETG: max. 20–40 %
- PLA: kann volle Kühlung vertragen, aber reduzieren, wenn Schichtablösung auftritt

**Schichtdicke:**
- Max. 75 % des Düsendurchmessers verwenden
- Mit 0,4 mm Düse: max. empfohlene Schichthöhe ist 0,30 mm

**Prüfen, ob Gehäuse warm genug ist (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Kammer auf 40–60 °C aufwärmen lassen,
bevor der Druck startet — Tür während des Druckens nicht öffnen
```

---

## Allgemeine Fehlerbehebungstipps

1. **Jeweils nur eine Sache ändern** — zwischen jeder Änderung mit einem kleinen Kalibrierungsdruck testen
2. **Filament zuerst trocknen** — viele Oberflächenfehler sind eigentlich Feuchtigkeitssymptome
3. **Düse reinigen** — teilweise Verstopfung führt zu inkonsistenten Oberflächenfehlern, die schwer zu diagnostizieren sind
4. **Vollständige Kalibrierung ausführen** über das Bambu Studio Wartungsmenü nach größeren Anpassungen
5. **Bambu Dashboard nutzen**, um zu verfolgen, welche Einstellungen im Laufe der Zeit die besten Ergebnisse erzielt haben
