---
sidebar_position: 5
title: Prestasjoner
description: Gamification-system med opplåsbare prestasjoner, sjeldenhetsgrader og milepæler for Bambu Lab-printing
---

# Prestasjoner

Prestasjoner (achievements) er et gamification-element som belønner milepæler og spennende øyeblikk i printreisen din. Samle prestasjoner og se progresjon mot neste opplåsing.

Gå til: **https://localhost:3443/#achievements**

## Sjeldenhetsgrader

Prestasjoner er klassifisert i fire sjeldenhetsgrader:

| Grad | Farge | Beskrivelse |
|---|---|---|
| **Vanlig** | Grå | Enkle milepæler, lett å oppnå |
| **Uvanlig** | Grønn | Krever litt innsats eller tid |
| **Sjelden** | Blå | Krever dedikert innsats over tid |
| **Legendarisk** | Gull | Ekstraordinære bragder |

## Eksempler på prestasjoner

### Printing-milepæler (Vanlig / Uvanlig)
| Prestasjon | Krav |
|---|---|
| Første print | Fullfør din aller første print |
| En hel dag | Printer i mer enn 24 timer totalt |
| Høy suksessrate | 10 vellykkede prints på rad |
| Filament-samler | Registrer 10 ulike filamenttyper |
| Flerfarger | Fullfør en multicolor-print |

### Volum-prestasjoner (Uvanlig / Sjelden)
| Prestasjon | Krav |
|---|---|
| Kilogrammet | Bruk 1 kg filament totalt |
| 10 kg | Bruk 10 kg filament totalt |
| 100 prints | 100 vellykkede prints |
| 500 timer | 500 akkumulerte print-timer |
| Nattskiftet | Fullfør en print som varer mer enn 20 timer |

### Vedlikehold og omsorg (Uvanlig / Sjelden)
| Prestasjon | Krav |
|---|---|
| Pliktoppfyllende | Logg en vedlikeholdsoppgave |
| Printerpleier | 10 vedlikeholdsoppgaver logget |
| Ingen avfall | Skap en print med > 90 % materialeffektivitet |
| Mesterdyser | Bytt dyse 5 ganger (dokumentert) |

### Legendariske prestasjoner
| Prestasjon | Krav |
|---|---|
| Utrettelig | 1000 vellykkede prints |
| Filament-titan | 50 kg totalt filamentforbruk |
| Feilfri uke | 7 dager uten en eneste mislykket print |
| Print-bibliotekar | 100 ulike modeller i filbiblioteket |

## Se prestasjoner

Prestasjonssiden viser:

- **Opplåst** — prestasjoner du har oppnådd (med dato)
- **Nær** — prestasjoner du er nær å oppnå (progresjonsbar)
- **Låst** — alle prestasjoner du ennå ikke har oppnådd

Filtrer etter **Grad**, **Kategori** eller **Status** (opplåst / i prosess / låst).

## Progresjonsbar

For prestasjoner med telling vises en progresjonsbar:

```
Kilogrammet — 1 kg filament
[████████░░] 847 g / 1000 g (84.7 %)
```

## Varsler

Du varsles automatisk når du oppnår en ny prestasjon:
- **Browser-popup** med prestasjonsnavn og grafikk
- Valgfritt: varsel via Telegram / Discord (konfigurer under **Innstillinger → Varsler → Prestasjoner**)

## Flerbrukerstøtte

I systemer med flere brukere har hver bruker sin egen prestasjonsprofil. En **toppliste** (leaderboard) viser rangering etter:

- Totalt antall opplåste prestasjoner
- Totalt antall prints
- Totale print-timer

:::tip Privat modus
Slå av topplisten under **Innstillinger → Prestasjoner → Skjul fra toppliste** for å holde profilen privat.
:::
