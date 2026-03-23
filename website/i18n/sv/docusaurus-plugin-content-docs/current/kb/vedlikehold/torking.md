---
sidebar_position: 5
title: Torkning av filament
description: Varför, när och hur man torkar filament — temperaturer, tider och lagringstips för alla material
---

# Torkning av filament

Fuktig filament är en av de vanligaste och mest underskattade orsakerna till dåliga utskrifter. Även filament som ser torrt ut kan ha absorberat tillräckligt med fukt för att förstöra resultatet — särskilt för material som nylon och PVA.

## Varför torka filament?

Många plasttyper är **hygroskopiska** — de absorberar fukt från luften över tid. När fuktig filament passerar genom det varma munstycket, förångas vattnet plötsligt och skapar mikrobubblor i smält plast. Resultatet är:

- **Poppande och knakande ljud** under utskrift
- **Dimma eller ånga** synlig från munstycket
- **Stringing och hårighet** som inte går att justera bort
- **Grov eller kornig yta** — speciellt på topplag
- **Svaga delar** med dålig lageradhesion och mikrosprickor
- **Matta eller skumma finish** på material som normalt ska vara blanka eller silkesglänsande

:::warning Torka filament INNAN du justerar inställningar
Många spenderar timmar på att tweaka retract och temperatur utan att se förbättring — för att orsaken är fuktig filament. Torka alltid filamenten och testa igen innan du ändrar utskriftsinställningar.
:::

## Vilka material behöver torkning?

Alla plasttyper kan bli fuktiga, men graden av hygroskopicitet varierar enormt:

| Material | Hygroskopisk | Torktemperatur | Torktid | Prioritet |
|---|---|---|---|---|
| PLA | Låg | 45–50 °C | 4–6 timmar | Valfritt |
| PETG | Medium | 65 °C | 4–6 timmar | Rekommenderas |
| ABS | Medium | 65–70 °C | 4 timmar | Rekommenderas |
| TPU | Medium | 50–55 °C | 4–6 timmar | Rekommenderas |
| ASA | Medium | 65 °C | 4 timmar | Rekommenderas |
| PC | Hög | 70–80 °C | 6–8 timmar | Krävs |
| PA/Nylon | Extremt hög | 70–80 °C | 8–12 timmar | KRÄVS |
| PA-CF | Extremt hög | 70–80 °C | 8–12 timmar | KRÄVS |
| PVA | Extremt hög | 45–50 °C | 4–6 timmar | KRÄVS |

:::tip Nylon och PVA är kritiska
PA/Nylon och PVA kan absorbera tillräckligt med fukt för att bli oupptryckbart inom **några timmar** i normalt inomhusklimat. Öppna aldrig en ny spole av dessa material utan att torka den direkt efteråt — och skriv alltid ut från en stängd låda eller torkbox.
:::

## Tecken på fuktig filament

Du behöver inte alltid torka filament enligt tabell. Lär dig känna igen symptomen:

| Symptom | Fukt? | Andra möjliga orsaker |
|---|---|---|
| Knakande/poppande ljud | Ja, mycket troligt | Delvis blockerat munstycke |
| Dimma/ånga från munstycket | Ja, nästan säkert | Ingen annan orsak |
| Grov, kornig yta | Ja, möjligt | För låg temp, för hög hastighet |
| Stringing som inte försvinner | Ja, möjligt | Fel retract, för hög temp |
| Svaga, spröda delar | Ja, möjligt | För låg temp, fel infill |
| Färgändring eller matt finish | Ja, möjligt | Fel temp, bränt plast |

## Torkningsmetoder

### Filamenttork (rekommenderas)

Dedikerade filamenttorkar är den enklaste och säkraste lösningen. De håller exakt temperatur och låter dig skriva ut direkt från torken under hela jobbet.

Populära modeller:
- **eSun eBOX** — prisvärd, kan skriva ut från lådan, stöder de flesta material
- **Bambu Lab Filament Dryer** — optimerad för Bambu AMS, stöder höga temperaturer
- **Polymaker PolyDryer** — bra termometer och god temperaturstyrning
- **Sunlu S2 / S4** — budgetvänlig, flera spoler samtidigt

Tillvägagångssätt:
```
1. Lägg spoler i torken
2. Ställ in temperatur från tabellen ovan
3. Sätt timer till rekommenderad tid
4. Vänta — skär inte processen kort
5. Skriv ut direkt från torken eller packa in omedelbart
```

### Matdehydrator

En vanlig matdehydrator fungerar förvånansvärt bra som filamenttork:

- Prisvärd att köpa (finns från ~300 kr)
- God luftcirkulation
- Stöder temperaturer upp till 70–75 °C på många modeller

:::warning Kontrollera max-temperatur på din dehydrator
Många billiga matdehydratorer har oprecisa termostater och kan variera ±10 °C. Mät faktisk temperatur med en termometer för PA och PC som kräver hög värme.
:::

### Ugn

Stekugnen kan användas i nödfall, men kräver försiktighet:

:::danger Använd ALDRIG vanlig ugn över 60 °C för PLA — det deformeras!
PLA börjar mjukna redan vid 55–60 °C. En varm ugn kan förstöra spoler, smälta kärnan och göra filamenten oanvändbar. Använd aldrig ugnen för PLA om du inte vet att temperaturen är exakt kalibrerad och ligger under 50 °C.
:::

För material som tål högre temperaturer (ABS, ASA, PA, PC):
```
1. Förvärm ugnen till önskad temperatur
2. Använd en termometer för att verifiera faktisk temperatur
3. Lägg spoler på ett galler (inte direkt på ugnsbotten)
4. Låt dörren stå på glänt för att släppa ut fukt
5. Övervaka första gången du använder denna metod
```

### Bambu Lab AMS

Bambu Lab AMS Lite och AMS Pro har inbyggd torkningsfunktion (låg värme + luftcirkulation). Detta är inte en ersättning för full torkning, men håller redan torkad filament torr under utskrift.

- AMS Lite: Passiv torkning — begränsar fuktupptagning, torkar inte aktivt
- AMS Pro: Aktiv uppvärmning — viss torkning möjlig, men inte lika effektivt som dedikerad tork

## Lagring av filament

Korrekt lagring efter torkning är lika viktigt som själva torkningsprocessen:

### Bästa lösningar

1. **Torrskåp med silikagel** — dedikerat skåp med hygrometer och torkmedel. Håller fuktighet stabilt låg (under 20 % RH idealt)
2. **Vakuumpåsar** — sug ut luft och förslut med torkmedel inuti. Billigaste långtidslagring
3. **Ziplock-påsar med torkmedel** — enkelt och effektivt för kortare perioder

### Silikagel och torkmedel

- **Blå/orange silikagel** indikerar mättnadsgrad — byt eller regenerera (torka i ugn vid 120 °C) när färgen ändras
- **Beaded silikagel** är mer effektiv än granulat
- **Torkmedels-påsar** från filamenttillverkare kan regenereras och återanvändas

### Hygrometer i förvaringslåda

En billig digital hygrometer visar aktuell luftfuktighet i lådan:

| Relativ fuktighet (RH) | Status |
|---|---|
| Under 15 % | Idealt |
| 15–30 % | Bra för de flesta material |
| 30–50 % | Acceptabelt för PLA och PETG |
| Över 50 % | Problematiskt — speciellt för PA, PVA, PC |

## Praktiska tips

- **Torka precis INNAN utskrift** — torkad filament kan bli fuktig igen inom dagar i normalt inomhusklimat
- **Skriv ut från torken** för PA, PC och PVA — torka inte bara och lägg bort
- **Ny spole ≠ torr spole** — tillverkare förseglar med torkmedel, men lagringskedjan kan ha sviktat. Torka alltid nya spoler av hygroskopiska material
- **Märk torkade spoler** med datum för torkning
- **Dedikerat PTFE-rör** från tork till skrivare minimerar exponering under utskrift

## Bambu Dashboard och torkningsstatus

Bambu Dashboard låter dig logga filamentinformation inklusive senaste torkningsdatum under filamentprofiler. Använd detta för att hålla koll på vilka spoler som är nyss torkade och vilka som behöver en ny omgång.
