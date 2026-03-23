---
sidebar_position: 5
title: Séchage du filament
description: Pourquoi, quand et comment sécher le filament — températures, durées et conseils de stockage pour tous les matériaux
---

# Séchage du filament

Le filament humide est l'une des causes les plus fréquentes et les plus sous-estimées des impressions de mauvaise qualité. Même un filament qui semble sec peut avoir absorbé suffisamment d'humidité pour ruiner le résultat — surtout pour des matériaux comme le nylon et le PVA.

## Pourquoi sécher le filament ?

De nombreux types de plastique sont **hygroscopiques** — ils absorbent l'humidité de l'air au fil du temps. Lorsqu'un filament humide passe par la buse chaude, l'eau s'évapore brusquement et crée des microbulles dans le plastique fondu. Le résultat :

- **Craquements et pétillements** pendant l'impression
- **Brume ou vapeur** visible depuis la buse
- **Stringing et filins** qu'il est impossible de régler
- **Surface rugueuse ou granuleuse** — surtout sur les couches supérieures
- **Pièces faibles** avec une mauvaise adhésion entre couches et des microfissures
- **Finition mate ou terne** sur des matériaux qui devraient normalement être brillants ou soyeux

:::warning Sécher le filament AVANT d'ajuster les paramètres
Beaucoup d'utilisateurs passent des heures à régler la rétraction et la température sans voir d'amélioration — parce que la cause est un filament humide. Toujours sécher le filament et retester avant de modifier les paramètres d'impression.
:::

## Quels matériaux nécessitent un séchage ?

Tous les types de plastique peuvent devenir humides, mais le degré d'hygroscopicité varie énormément :

| Matériau | Hygroscopique | Temp. de séchage | Durée de séchage | Priorité |
|---|---|---|---|---|
| PLA | Faible | 45–50 °C | 4–6 heures | Optionnel |
| PETG | Moyen | 65 °C | 4–6 heures | Recommandé |
| ABS | Moyen | 65–70 °C | 4 heures | Recommandé |
| TPU | Moyen | 50–55 °C | 4–6 heures | Recommandé |
| ASA | Moyen | 65 °C | 4 heures | Recommandé |
| PC | Élevé | 70–80 °C | 6–8 heures | Requis |
| PA/Nylon | Extrêmement élevé | 70–80 °C | 8–12 heures | REQUIS |
| PA-CF | Extrêmement élevé | 70–80 °C | 8–12 heures | REQUIS |
| PVA | Extrêmement élevé | 45–50 °C | 4–6 heures | REQUIS |

:::tip Le nylon et le PVA sont critiques
Le PA/Nylon et le PVA peuvent absorber suffisamment d'humidité pour devenir impossibles à imprimer en **quelques heures** dans des conditions intérieures normales. N'ouvrez jamais une nouvelle bobine de ces matériaux sans la sécher immédiatement après — et imprimez toujours depuis une boîte fermée ou une boîte de séchage.
:::

## Signes d'un filament humide

Vous n'avez pas toujours besoin de sécher le filament selon un tableau. Apprenez à reconnaître les symptômes :

| Symptôme | Humidité ? | Autres causes possibles |
|---|---|---|
| Craquements/pétillements | Oui, très probable | Buse partiellement bouchée |
| Brume/vapeur depuis la buse | Oui, presque certain | Aucune autre cause |
| Surface rugueuse, granuleuse | Oui, possible | Temp. trop basse, vitesse trop élevée |
| Stringing qui ne disparaît pas | Oui, possible | Mauvaise rétraction, temp. trop élevée |
| Pièces faibles et cassantes | Oui, possible | Temp. trop basse, remplissage incorrect |
| Changement de couleur ou finition mate | Oui, possible | Mauvaise temp., plastique brûlé |

## Méthodes de séchage

### Séchoir à filament (recommandé)

Les séchoirs à filament dédiés sont la solution la plus simple et la plus sûre. Ils maintiennent une température précise et vous permettent d'imprimer directement depuis le séchoir pendant tout le travail.

Modèles populaires :
- **eSun eBOX** — abordable, peut imprimer depuis la boîte, supporte la plupart des matériaux
- **Bambu Lab Filament Dryer** — optimisé pour Bambu AMS, supporte les températures élevées
- **Polymaker PolyDryer** — bon thermomètre et bonne régulation de température
- **Sunlu S2 / S4** — économique, plusieurs bobines simultanément

Procédure :
```
1. Placer les bobines dans le séchoir
2. Régler la température selon le tableau ci-dessus
3. Régler la minuterie sur la durée recommandée
4. Attendre — ne pas interrompre le processus
5. Imprimer directement depuis le séchoir ou sceller immédiatement
```

### Déshydrateur alimentaire

Un déshydrateur alimentaire ordinaire fonctionne étonnamment bien comme séchoir à filament :

- Abordable à l'achat (disponible à partir de ~30 €)
- Bonne circulation d'air
- Supporte des températures jusqu'à 70–75 °C sur de nombreux modèles

:::warning Vérifier la température max de votre déshydrateur
De nombreux déshydrateurs alimentaires bon marché ont des thermostats imprécis et peuvent varier de ±10 °C. Mesurer la température réelle avec un thermomètre pour le PA et le PC qui nécessitent une chaleur élevée.
:::

### Four

Le four peut être utilisé en dernier recours, mais demande de la prudence :

:::danger N'utilisez JAMAIS un four ordinaire au-dessus de 60 °C pour le PLA — il se déforme !
Le PLA commence à ramollir à 55–60 °C. Un four chaud peut détruire des bobines, faire fondre le noyau et rendre le filament inutilisable. N'utilisez jamais le four pour le PLA, sauf si vous savez que la température est précisément calibrée et inférieure à 50 °C.
:::

Pour les matériaux qui tolèrent des températures plus élevées (ABS, ASA, PA, PC) :
```
1. Préchauffer le four à la température souhaitée
2. Vérifier la température réelle avec un thermomètre
3. Placer les bobines sur une grille (pas directement sur le fond du four)
4. Laisser la porte légèrement entrouverte pour laisser échapper l'humidité
5. Surveiller la première fois que vous utilisez cette méthode
```

### Bambu Lab AMS

Bambu Lab AMS Lite et AMS Pro disposent d'une fonction de séchage intégrée (chaleur faible + circulation d'air). Cela ne remplace pas un séchage complet, mais maintient le filament déjà séché au sec pendant l'impression.

- AMS Lite : Séchage passif — limite l'absorption d'humidité, ne sèche pas activement
- AMS Pro : Chauffage actif — quelque séchage possible, mais pas aussi efficace qu'un séchoir dédié

## Stockage du filament

Un stockage correct après le séchage est aussi important que le processus de séchage lui-même :

### Meilleures solutions

1. **Armoire à sec avec silica gel** — armoire dédiée avec hygromètre et dessiccant. Maintient l'humidité constamment basse (idéalement sous 20 % HR)
2. **Sachets sous vide** — retirer l'air et sceller avec du dessiccant à l'intérieur. Stockage à long terme le moins cher
3. **Sachets ziplock avec dessiccant** — simple et efficace pour des périodes plus courtes

### Silica gel et dessiccant

- **Silica gel bleu/orange** indique le niveau de saturation — remplacer ou régénérer (sécher au four à 120 °C) lorsque la couleur change
- **Silica gel en billes** est plus efficace que les granulés
- **Sachets de dessiccant** des fabricants de filament peuvent être régénérés et réutilisés

### Hygromètre dans la boîte de stockage

Un hygromètre numérique bon marché affiche l'humidité actuelle dans la boîte :

| Humidité relative (HR) | Statut |
|---|---|
| Sous 15 % | Idéal |
| 15–30 % | Bon pour la plupart des matériaux |
| 30–50 % | Acceptable pour PLA et PETG |
| Au-dessus de 50 % | Problématique — surtout pour PA, PVA, PC |

## Conseils pratiques

- **Sécher juste AVANT d'imprimer** — le filament séché peut redevenir humide en quelques jours dans des conditions intérieures normales
- **Imprimer depuis le séchoir** pour PA, PC et PVA — ne pas juste sécher et ranger
- **Nouvelle bobine ≠ bobine sèche** — les fabricants scellent avec du dessiccant, mais la chaîne d'approvisionnement peut avoir failli. Toujours sécher les nouvelles bobines de matériaux hygroscopiques
- **Étiqueter les bobines séchées** avec la date de séchage
- **Tube PTFE dédié** du séchoir à l'imprimante minimise l'exposition pendant l'impression

## Bambu Dashboard et statut de séchage

Bambu Dashboard vous permet d'enregistrer les informations sur le filament, y compris la dernière date de séchage dans les profils de filament. Utilisez cela pour savoir quelles bobines sont fraîchement séchées et lesquelles ont besoin d'un nouveau cycle.
