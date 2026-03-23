---
sidebar_position: 7
title: Matériaux spéciaux
description: ASA, PC, PP, PVA, HIPS et autres matériaux spéciaux pour des cas d'utilisation avancés
---

# Matériaux spéciaux

Au-delà des matériaux courants, il existe un certain nombre de matériaux spéciaux pour des cas d'utilisation spécifiques — des pièces extérieures résistantes aux UV aux matériaux de support hydrosolubles. Voici un aperçu pratique.

---

## ASA (Acrylonitrile Styrène Acrylate)

L'ASA est la meilleure alternative à l'ABS pour un usage extérieur. Il s'imprime presque à l'identique de l'ABS, mais supporte bien mieux la lumière du soleil et les intempéries.

### Paramètres

| Paramètre | Valeur |
|-----------|--------|
| Température de buse | 240–260 °C |
| Température de plateau | 90–110 °C |
| Température de chambre | 45–55 °C |
| Refroidissement de pièce | 0–20% |
| Séchage | Recommandé (70 °C / 4–6 h) |

### Propriétés

- **Résistant aux UV :** Conçu spécifiquement pour une exposition prolongée au soleil sans jaunir ni se fissurer
- **Stable à la chaleur :** Température de transition vitreuse ~100 °C
- **Résistant aux chocs :** Meilleure résistance aux chocs que l'ABS
- **Enceinte nécessaire :** Se déforme de la même façon que l'ABS — X1C/P1S donne les meilleurs résultats

:::tip ASA au lieu d'ABS en extérieur
La pièce va-t-elle vivre en extérieur dans toutes les conditions météo (soleil, pluie, gel) ? Choisissez ASA plutôt qu'ABS. L'ASA supporte de nombreuses années sans dégradation visible. L'ABS commence à se fissurer et à jaunir après quelques mois.
:::

### Cas d'utilisation
- Supports, boîtiers et points de fixation extérieurs
- Pièces de carrosserie, supports d'antenne
- Mobilier de jardin et environnements extérieurs
- Signalisation et distributeurs à l'extérieur des bâtiments

---

## PC (Polycarbonate)

Le polycarbonate est l'un des plastiques les plus résistants et les plus résistants aux chocs pouvant être imprimés en 3D. Il est transparent et supporte des températures extrêmes.

### Paramètres

| Paramètre | Valeur |
|-----------|--------|
| Température de buse | 260–310 °C |
| Température de plateau | 100–120 °C |
| Température de chambre | 50–70 °C |
| Refroidissement de pièce | 0–20% |
| Séchage | Requis (80 °C / 8–12 h) |

:::danger Le PC nécessite un hotend tout métal et une haute température
Le PC ne fond pas aux températures standard du PLA. Le Bambu X1C avec le bon ensemble de buse prend en charge le PC. Vérifiez toujours que les composants PTFE du hotend supportent votre température — le PTFE standard ne supporte pas au-delà de 240–250 °C en continu.
:::

### Propriétés

- **Très résistant aux chocs :** Résistant à la rupture même à basses températures
- **Transparent :** Peut être utilisé pour des fenêtres, lentilles et composants optiques
- **Stable à la chaleur :** Température de transition vitreuse ~147 °C — la plus élevée des matériaux courants
- **Hygroscopique :** Absorbe rapidement l'humidité — toujours sécher soigneusement
- **Gauchissement :** Fort retrait — nécessite une enceinte et un brim

### Cas d'utilisation
- Visières de sécurité et couvercles de protection
- Boîtiers électriques résistant à la chaleur
- Porte-objectifs et composants optiques
- Châssis de robots et corps de drones

---

## PP (Polypropylène)

Le polypropylène est l'un des matériaux les plus difficiles à imprimer, mais offre des propriétés uniques qu'aucun autre matériau plastique ne peut égaler.

### Paramètres

| Paramètre | Valeur |
|-----------|--------|
| Température de buse | 220–250 °C |
| Température de plateau | 80–100 °C |
| Refroidissement de pièce | 20–50% |
| Séchage | Recommandé (70 °C / 6 h) |

### Propriétés

- **Résistant chimiquement :** Supporte les acides forts, bases, alcool et la plupart des solvants
- **Léger et flexible :** Faible densité, supporte des flexions répétées (effet de charnière vivante)
- **Mauvaise adhérence :** Adhère mal à lui-même et au plateau — c'est le défi
- **Non toxique :** Sans danger pour le contact alimentaire (selon la couleur et les additifs)

:::warning Le PP adhère mal à tout
Le PP est réputé pour ne pas adhérer au plateau. Utiliser du ruban PP (comme le Tesa ou un ruban PP dédié) sur l'Engineering Plate, ou un bâton de colle spécialement formulé pour le PP. Un brim de 15–20 mm est nécessaire.
:::

### Cas d'utilisation
- Bouteilles de laboratoire et conteneurs à produits chimiques
- Pièces de conservation alimentaire et ustensiles de cuisine
- Charnières vivantes (couvercles de boîtes supportant des milliers de cycles ouverture/fermeture)
- Composants automobiles résistant aux produits chimiques

---

## PVA (Alcool polyvinylique) — matériau de support hydrosoluble

Le PVA est un matériau spécial utilisé exclusivement comme matériau de support. Il se dissout dans l'eau et laisse une surface propre sur le modèle.

### Paramètres

| Paramètre | Valeur |
|-----------|--------|
| Température de buse | 180–220 °C |
| Température de plateau | 35–60 °C |
| Séchage | Critique (55 °C / 6–8 h) |

:::danger Le PVA est extrêmement hygroscopique
Le PVA absorbe l'humidité plus rapidement que tout autre filament courant. Sécher le PVA soigneusement AVANT l'impression, et toujours stocker dans une boîte hermétique avec de la silice. Le PVA humide colle dans la buse et est très difficile à enlever.
:::

### Utilisation et dissolution

1. Imprimer le modèle avec le PVA comme matériau de support (nécessite une imprimante multi-matériaux — AMS)
2. Placer l'impression finie dans de l'eau tiède (30–40 °C)
3. Laisser reposer 30–120 minutes, changer l'eau si nécessaire
4. Rincer à l'eau propre et laisser sécher

**Toujours utiliser un extrudeur dédié pour le PVA** si possible — les résidus de PVA dans un extrudeur standard peuvent gâcher l'impression suivante.

### Cas d'utilisation
- Structures de support complexes impossibles à enlever manuellement
- Support de surplomb interne sans marque visible en surface
- Modèles avec cavités et canaux internes

---

## HIPS (Polystyrène haute résistance) — matériau de support soluble dans les solvants

Le HIPS est un autre matériau de support, conçu pour être utilisé avec l'ABS. Il se dissout dans le **limonène** (solvant aux agrumes).

### Paramètres

| Paramètre | Valeur |
|-----------|--------|
| Température de buse | 220–240 °C |
| Température de plateau | 90–110 °C |
| Température de chambre | 45–55 °C |
| Séchage | Recommandé (65 °C / 4–6 h) |

### Utilisation avec l'ABS

Le HIPS s'imprime aux mêmes températures que l'ABS et y adhère bien. Après l'impression, le HIPS se dissout en plaçant l'impression dans du D-limonène pendant 30–60 minutes.

:::warning Le limonène n'est pas de l'eau
Le D-limonène est un solvant extrait de peaux d'orange. Il est relativement inoffensif, mais portez quand même des gants et travaillez dans un espace ventilé. Ne jetez pas le limonène usagé dans les égouts — déposez-le dans un centre de recyclage.
:::

### Comparaison : PVA vs HIPS

| Propriété | PVA | HIPS |
|-----------|-----|------|
| Solvant | Eau | D-limonène |
| Matériau compatible | Compatible PLA | Compatible ABS |
| Sensibilité à l'humidité | Extrêmement élevée | Modérée |
| Coût | Élevé | Modéré |
| Disponibilité | Bonne | Modérée |

---

## PVB / Fibersmooth — matériau lissable à l'éthanol

Le PVB (Polyvinyl butyral) est un matériau unique qui peut être **lissé avec de l'éthanol (alcool)** — de la même façon que l'ABS peut être lissé avec de l'acétone, mais bien plus sûr.

### Paramètres

| Paramètre | Valeur |
|-----------|--------|
| Température de buse | 190–210 °C |
| Température de plateau | 35–55 °C |
| Refroidissement de pièce | 80–100% |
| Séchage | Recommandé (55 °C / 4 h) |

### Lissage à l'éthanol

1. Imprimer le modèle avec les paramètres PVB standard
2. Appliquer de l'alcool isopropylique (IPA) à 99 % ou de l'éthanol avec un pinceau
3. Laisser sécher 10–15 minutes — la surface s'uniformise
4. Répéter si nécessaire pour une surface plus lisse
5. Alternative : appliquer et placer dans un récipient fermé 5 minutes pour un traitement à la vapeur

:::tip Plus sûr que l'acétone
L'IPA/éthanol est bien plus sûr à manipuler que l'acétone. Le point d'éclair est plus élevé et les vapeurs sont bien moins toxiques. Une bonne ventilation est néanmoins recommandée.
:::

### Cas d'utilisation
- Figurines et décorations où une surface lisse est souhaitée
- Prototypes à présenter
- Pièces à peindre — une surface lisse donne une meilleure adhérence de la peinture

---

## Plateaux de construction recommandés pour les matériaux spéciaux

| Matériau | Plateau recommandé | Bâton de colle ? |
|----------|-------------------|-----------------|
| ASA | Engineering Plate / High Temp Plate | Oui |
| PC | High Temp Plate | Oui (requis) |
| PP | Engineering Plate + ruban PP | Ruban spécifique PP |
| PVA | Cool Plate / Textured PEI | Non |
| HIPS | Engineering Plate / High Temp Plate | Oui |
| PVB | Cool Plate / Textured PEI | Non |
