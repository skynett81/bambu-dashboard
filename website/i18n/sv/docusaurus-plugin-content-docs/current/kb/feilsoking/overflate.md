---
sidebar_position: 4
title: Ytfel
description: Diagnos och fix av vanliga ytproblem — blobs, zits, lagerlinjer, elephant foot och mer
---

# Ytfel

Ytan på en 3D-utskrift berättar mycket om vad som händer inne i systemet. De flesta ytfel har en till två tydliga orsaker — med rätt diagnos är de förvånansvärt enkla att åtgärda.

## Snabb diagnosöversikt

| Symptom | Vanligaste orsak | Första åtgärd |
|---|---|---|
| Blobs och zits | Överextrusion, seam-placering | Justera seam, kalibrera flöde |
| Synliga lagerlinjer | Z-wobble, för tjocka lager | Byt till finare lager, kontrollera Z-axel |
| Elephant foot | Första lagret för brett | Elephant foot compensation |
| Ringing/ghosting | Vibrationer vid hög hastighet | Sänk hastighet, aktivera input shaper |
| Under-extrusion | Blockerad munstycke, för låg temp | Rensa munstycke, höj temp |
| Over-extrusion | För hög flödeshastighet | Kalibrera flödeshastighet |
| Pillowing | För få topplag, för lite kylning | Öka antal topplag, öka kylfläkt |
| Lagerskillnad | För låg temp, för mycket kylning | Höj temp, minska kylfläkt |

---

## Blobs och zits

Blobs är oregelbundna klumpar på ytan. Zits är prickliknande punkter — ofta längs seam-linjen.

### Orsaker

- **Överextrusion** — för mycket plast extruderas och trycks ut åt sidan
- **Dålig seam-placering** — standard "nearest"-seam samlar all övergång på samma ställe
- **Retract-problem** — otillräcklig retract ger tryckuppbyggnad i munstycket
- **Fuktig filament** — fukt skapar mikrobubblor och droppning

### Lösningar

**Seam-inställningar i Bambu Studio:**
```
Bambu Studio → Kvalitet → Seam position
- Aligned: Alla seams på samma ställe (synlig, men prydlig)
- Nearest: Närmaste punkt (sprider blobs slumpmässigt)
- Back: Bakom objektet (rekommenderas för visuell kvalitet)
- Random: Slumpmässig fördelning (kamouflerar seam bäst)
```

**Flödeshastighets-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Justera i steg om ±2 % tills blobs försvinner
```

:::tip Seam på "Back" för visuell kvalitet
Placera seam på baksidan av objektet så att den är minst synlig. Kombinera med "Wipe on retract" för renare seam-avslutning.
:::

---

## Synliga lagerlinjer

Alla FDM-utskrifter har lagerlinjer, men de ska vara konsekventa och knappt synliga på normala utskrifter. Onormal synlighet pekar på konkreta problem.

### Orsaker

- **Z-wobble** — Z-axeln vibrerar eller är inte rak, ger vågigt mönster över hela höjden
- **För tjocka lager** — lagerhöjd över 0,28 mm är märkbar även på perfekta utskrifter
- **Temperatursvängningar** — inkonsekvent smälttemperatur ger varierande bredd på lager
- **Inkonsekvent filamentdiameter** — billig filament med varierande diameter

### Lösningar

**Z-wobble:**
- Kontrollera att skruvspindeln (Z-leadscrew) är ren och smord
- Kontrollera att spindeln inte är böjd (visuell inspektion vid rotation)
- Se underhållsartikeln om [smörjning av Z-axel](/docs/kb/vedlikehold/smoring)

**Lagerhoojd:**
- Byt till 0,12 mm eller 0,16 mm för jämnare yta
- Kom ihåg att halvering av lagerhoojden dubblerar utskriftstiden

**Temperatursvängningar:**
- Använd PID-kalibrering (tillgänglig via Bambu Studios underhållsmeny)
- Undvik luftdrag som kyler ner munstycket under utskrift

---

## Elephant foot

Elephant foot är när det första lagret är bredare än resten av objektet — som om objektet "brettar ut sig" i botten.

### Orsaker

- Första lagret trycks för hårt mot plattan (för tät Z-offset)
- För hög bäddtemperatur håller plasten mjuk och flytande för länge
- För lite kylning på första lagret ger plasten mer tid att sprida sig

### Lösningar

**Elephant foot compensation i Bambu Studio:**
```
Bambu Studio → Kvalitet → Elephant foot compensation
Börja med 0,1–0,2 mm och justera tills foten försvinner
```

**Z-offset:**
- Kalibrera first layer height på nytt
- Höj Z-offset 0,05 mm åt gången tills foten är borta

**Bäddtemperatur:**
- Sänk bäddtemperatur 5–10 °C
- För PLA: 55 °C räcker ofta — 65 °C kan ge elephant foot

:::warning Kompensera inte för mycket
För hög elephant foot compensation kan skapa ett hål mellan första lagret och resten. Justera försiktigt i steg om 0,05 mm.
:::

---

## Ringing och ghosting

Ringing (kallas även "ghosting" eller "echoing") är ett vågmönster i ytan precis efter skarpa kanter eller hörn. Mönstret "ekar" ut från kanten.

### Orsaker

- **Vibrationer** — snabb acceleration och deceleration vid hörn skickar vibrationer genom ramen
- **För hög hastighet** — särskilt ytterväggshastighet över 100 mm/s ger markant ringing
- **Lösa delar** — lös spole, vibrerande kabelhylsa eller löst monterad skrivare

### Lösningar

**Bambu Lab input shaper (Resonance Compensation):**
```
Bambu Studio → Skrivare → Resonance compensation
Bambu Lab X1C och P1S har inbyggd accelerometer och auto-kalibrerar detta
```

**Minska hastighet:**
```
Yttervägg: Sänk till 60–80 mm/s
Acceleration: Minska från standard till 3000–5000 mm/s²
```

**Mekanisk kontroll:**
- Kontrollera att skrivaren står på ett stabilt underlag
- Kontrollera att spolen inte vibrerar i spolhållaren
- Dra åt alla tillgängliga skruvar på ramens yttre paneler

:::tip X1C och P1S auto-kalibrerar ringing
Bambu Lab X1C och P1S har inbyggd accelerometerkalibrering som körs automatiskt vid start. Kör "Full calibration" från underhållsmenyn om ringing dyker upp efter en period.
:::

---

## Under-extrusion

Under-extrusion är när skrivaren extruderar för lite plast. Resultatet är tunna, svaga väggar, synliga hål mellan lager och "scraggly" yta.

### Orsaker

- **Delvis blockerat munstycke** — koluppbyggnad minskar genomflödet
- **För låg munstyckstemperatur** — plasten är inte tillräckligt flytande
- **Slitet kugghjul** i extruder-mekanismen griper inte filamenten tillräckligt bra
- **För hög hastighet** — extruder klarar inte hänga med önskat flöde

### Lösningar

**Kall dragning (Cold pull):**
```
1. Värm munstycket till 220 °C
2. Tryck filament manuellt in
3. Kyl munstycket till 90 °C (PLA) medan du håller tryck
4. Dra filamentet snabbt ut
5. Upprepa tills det som dras ut är rent
```

**Temperaturrjustering:**
- Höj munstyckstemperatur 5–10 °C och testa igen
- Körning med för låg temperatur är en vanlig orsak till under-extrusion

**Flödeshastighets-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Öka gradvis tills under-extrusion försvinner
```

**Kontrollera extruder-kugghjul:**
- Ta bort filament och inspektera kugghjulet
- Rengör med en liten borste om det finns filamentpulver i tänderna

---

## Over-extrusion

Over-extrusion ger för bred sträng — ytan ser lossgjord, glänsande eller ojämn ut, med tendens till blobs.

### Orsaker

- **För hög flödeshastighet** (EM — Extrusion Multiplier)
- **Fel filamentdiameter** — 2,85 mm filament med 1,75 mm-profil ger massiv over-extrusion
- **För hög munstyckstemperatur** gör plasten för flytande

### Lösningar

**Flödeshastighets-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Sänk i steg om 2 % tills ytan är jämn och matt
```

**Verifiera filamentdiameter:**
- Mät faktisk filamentdiameter med ett skjutmått på 5–10 ställen längs filamenten
- Genomsnittlig avvikelse över 0,05 mm indikerar lågkvalitets-filament

---

## Pillowing

Pillowing är bubblande, ojämna topplag med "kuddar" av plast mellan topplagen. Särskilt tydligt med låg infill och för få topplag.

### Orsaker

- **För få topplag** — plasten över infill kollapsar ner i hålen
- **För lite kylning** — plasten stelnar inte snabbt nog för att bygga brygga över infill-hålen
- **För låg infill** — stora hål i infill är svåra att bygga över

### Lösningar

**Öka antal topplag:**
```
Bambu Studio → Kvalitet → Top shell layers
Minimum: 4 lager
Rekommenderas för jämn yta: 5–6 lager
```

**Öka kylning:**
- PLA bör ha kylfläkt på 100 % från lager 3
- Otillräcklig kylning är den vanligaste orsaken till pillowing

**Öka infill:**
- Gå från 10–15 % upp till 20–25 % om pillowing kvarstår
- Gyroid-mönster ger jämnare brygga-yta än linjer

:::tip Ironing
Bambu Studios "ironing"-funktion kör munstycket över topplagret en extra gång för att jämna ut ytan. Aktivera under Kvalitet → Ironing för bästa topplag-finish.
:::

---

## Lagerskillnad (Layer separation / delamination)

Lagerskillnad är när lager inte häftar ordentligt mot varandra. I värsta fall spricker utskriften upp längs lagerlinjer.

### Orsaker

- **För låg munstyckstemperatur** — plasten smälter inte tillräckligt bra in i lagret under
- **För mycket kylning** — plasten stelnar för snabbt innan den hinner fusa
- **För hög lagertjocklek** — över 80 % av munstyckets diameter ger dålig fusion
- **För hög hastighet** — minskad smälttid per mm bana

### Lösningar

**Höj temperatur:**
- Prova +10 °C från standard och observera
- ABS och ASA är särskilt känsliga — kräver kontrollerad kammaruppvärmning

**Minska kylning:**
- ABS: kylfläkt AV (0 %)
- PETG: 20–40 % max
- PLA: kan klara full kylning, men minska om lagerskillnad uppstår

**Lagertjocklek:**
- Använd max 75 % av munstyckets diameter
- Med 0,4 mm munstycke: max rekommenderad lagerhoojd är 0,30 mm

**Kontrollera att inneslutningen är tillräckligt varm (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Låt kammaren värmas upp till 40–60 °C
innan utskrift startar — öppna inte dörren under utskrift
```

---

## Allmänna felsökningstips

1. **Ändra en sak i taget** — testa med en liten kalibrerings-utskrift mellan varje ändring
2. **Torka filamenten först** — många ytfel är egentligen fuktsymptom
3. **Rensa munstycket** — delvis blockering ger inkonsekvent ytfel som är svåra att diagnostisera
4. **Kör fullständig kalibrering** från Bambu Studios underhållsmeny efter större justeringar
5. **Använd Bambu Dashboard** för att spåra vilka inställningar som gav bäst resultat över tid
