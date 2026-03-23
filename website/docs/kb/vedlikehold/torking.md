---
sidebar_position: 5
title: Tørking av filament
description: Hvorfor, når og hvordan tørke filament — temperaturer, tider og lagringstips for alle materialer
---

# Tørking av filament

Fuktig filament er en av de vanligste og mest undervurderte årsakene til dårlige prints. Selv filament som ser tørt ut kan ha absorbert nok fuktighet til å ødelegge resultatet — særlig for materialer som nylon og PVA.

## Hvorfor tørke filament?

Mange plasttyper er **hygroskopiske** — de absorberer fuktighet fra luften over tid. Når fuktig filament passerer gjennom den varme dysen, fordamper vannet brått og lager mikrobobler i smeltet plast. Resultatet er:

- **Poppelyder og knatrende lyder** under printing
- **Tåke eller damp** synlig fra dysen
- **Stringing og hairing** som ikke lar seg justere bort
- **Ru eller kornete overflate** — spesielt på topplag
- **Svake deler** med dårlig lagheft og mikrosprekker
- **Matte eller skummel finish** på materialer som normalt skal være blanke eller silkeglanset

:::warning Tørk filament FØR du justerer innstillinger
Mange bruker timer på å tweake retract og temperatur uten å se bedring — fordi årsaken er fuktig filament. Tørk alltid filamentet og test på nytt før du endrer printinnstillinger.
:::

## Hvilke materialer trenger tørking?

Alle plasttyper kan bli fuktige, men graden av hygroskopisitet varierer enormt:

| Materiale | Hygroskopisk | Tørketemperatur | Tørketid | Prioritet |
|---|---|---|---|---|
| PLA | Lav | 45–50 °C | 4–6 timer | Valgfritt |
| PETG | Medium | 65 °C | 4–6 timer | Anbefalt |
| ABS | Medium | 65–70 °C | 4 timer | Anbefalt |
| TPU | Medium | 50–55 °C | 4–6 timer | Anbefalt |
| ASA | Medium | 65 °C | 4 timer | Anbefalt |
| PC | Høy | 70–80 °C | 6–8 timer | Påkrevd |
| PA/Nylon | Ekstremt høy | 70–80 °C | 8–12 timer | PÅKREVD |
| PA-CF | Ekstremt høy | 70–80 °C | 8–12 timer | PÅKREVD |
| PVA | Ekstremt høy | 45–50 °C | 4–6 timer | PÅKREVD |

:::tip Nylon og PVA er kritiske
PA/Nylon og PVA kan absorbere nok fuktighet til å bli uprintbart i løpet av **noen timer** i normalt innendørsklima. Åpne aldri en ny spole av disse materialene uten å tørke den rett etterpå — og print alltid fra en lukket boks eller tørke-box.
:::

## Tegn på fuktig filament

Du trenger ikke alltid tørke filament etter oppslagstabell. Lær å kjenne igjen symptomene:

| Symptom | Fuktighet? | Andre mulige årsaker |
|---|---|---|
| Knatrende/poppende lyder | Ja, svært sannsynlig | Delvis blokkert dyse |
| Tåke/damp fra dysen | Ja, nesten sikkert | Ingen annen årsak |
| Ru, kornete overflate | Ja, mulig | For lav temp, for høy hastighet |
| Stringing som ikke forsvinner | Ja, mulig | Feil retract, for høy temp |
| Svake, sprø deler | Ja, mulig | For lav temp, feil infill |
| Fargeendring eller matte finish | Ja, mulig | Feil temp, brent plast |

## Tørkemetoder

### Filamenttørker (anbefalt)

Dedikerte filamenttørkere er den enkleste og sikreste løsningen. De holder nøyaktig temperatur og lar deg printe direkte fra tørkeren under hele jobben.

Populære modeller:
- **eSun eBOX** — rimelig, kan printe fra boksen, støtter de fleste materialer
- **Bambu Lab Filament Dryer** — optimalisert for Bambu AMS, støtter høye temperaturer
- **Polymaker PolyDryer** — godt termometer og god temperaturstyring
- **Sunlu S2 / S4** — budsjettvennlig, flere spoler samtidig

Fremgangsmåte:
```
1. Legg spoler i tørkeren
2. Still inn temperatur fra tabellen over
3. Sett timer til anbefalt tid
4. Vent — ikke kutt prosessen kort
5. Print rett fra tørkeren eller pakk inn umiddelbart
```

### Matdehydrator

En vanlig matdehydrator fungerer overraskende godt som filamenttørker:

- Rimelig i innkjøp (finnes fra ~300 kr)
- God luftsirkulasjon
- Støtter temperaturer opp til 70–75 °C på mange modeller

:::warning Sjekk maks-temperatur på din dehydrator
Mange billige matdehydratorer har unøyaktige termostater og kan variere ±10 °C. Mål faktisk temperatur med et termometer for PA og PC som krever høy varme.
:::

### Ovn

Stekeovnen kan brukes i nødsfall, men krever forsiktighet:

:::danger Bruk ALDRI vanlig ovn over 60 °C for PLA — det deformeres!
PLA begynner å mykne allerede ved 55–60 °C. En varm ovn kan ødelegge spoler, smelte kjernen og gjøre filamentet ubrukelig. Bruk aldri ovnen for PLA med mindre du vet at temperaturen er nøyaktig kalibrert og ligger under 50 °C.
:::

For materialer som tåler høyere temperaturer (ABS, ASA, PA, PC):
```
1. Forvarm ovnen til ønsket temperatur
2. Bruk et termometer for å verifisere faktisk temperatur
3. Legg spoler på et rist (ikke direkte på ovnbunn)
4. La døren stå på gløtt for å slippe ut fuktighet
5. Overvåk første gang du bruker denne metoden
```

### Bambu Lab AMS

Bambu Lab AMS Lite og AMS Pro har innebygd tørkefunksjon (lav varme + luftsirkulasjon). Dette er ikke en erstatning for full tørking, men holder allerede tørket filament tørt under printing.

- AMS Lite: Passiv tørking — begrenser fuktighetsopptak, tørker ikke aktivt
- AMS Pro: Aktiv oppvarming — noe tørking mulig, men ikke like effektivt som dedikert tørker

## Lagring av filament

Riktig lagring etter tørking er like viktig som selve tørkeprosessen:

### Beste løsninger

1. **Tørrskap med silicagel** — dedikert skap med hygrometer og dessikant. Holder fuktighet stabilt lavt (under 20 % RH ideelt)
2. **Vakuumposer** — sug ut luft og forsegl med dessikant inni. Billigste langtidslagring
3. **Ziplock-poser med dessikant** — enkelt og effektivt for kortere perioder

### Silicagel og dessikant

- **Blå/oransje silicagel** indikerer mettingsgrad — bytt eller regenerer (tørk i ovn ved 120 °C) når fargen endres
- **Beaded silicagel** er mer effektiv enn granulat
- **Dessikant-pakker** fra filamentprodusenter kan regenereres og gjenbrukes

### Hygrometer i oppbevaringsboks

Et billig digitalt hygrometer viser aktuell luftfuktighet i boksen:

| Relativ fuktighet (RH) | Status |
|---|---|
| Under 15 % | Ideelt |
| 15–30 % | Bra for de fleste materialer |
| 30–50 % | Akseptabelt for PLA og PETG |
| Over 50 % | Problematisk — spesielt for PA, PVA, PC |

## Praktiske tips

- **Tørk rett FØR printing** — tørket filament kan bli fuktig igjen i løpet av dager i normalt innendørsklima
- **Print fra tørkeren** for PA, PC og PVA — ikke bare tørk og legg bort
- **Ny spole ≠ tørr spole** — produsenter segler med dessikant, men lagringskjeden kan ha svikte. Tørk alltid nye spoler av hygroskopiske materialer
- **Merk tørkede spoler** med dato for tørking
- **Dedikert PTFE-rør** fra tørker til printer minimerer eksponering under printing

## Bambu Dashboard og tørkestatus

Bambu Dashboard lar deg logge filamentinformasjon inkludert siste tørkingsdato under filamentprofiler. Bruk dette til å holde oversikt over hvilke spoler som er fersk-tørket og hvilke som trenger en ny runde.
