---
sidebar_position: 9
title: Comparaison des matériaux
description: Comparez tous les matériaux d'impression 3D côte à côte — résistance, température, prix, difficulté
---

# Comparaison des matériaux

Choisir le bon filament est aussi important que choisir le bon outil pour un travail. Cet article vous donne une vue d'ensemble complète — de la simple table de comparaison aux valeurs Shore, HDT et un guide de décision pratique.

## Grande table de comparaison

| Matériau | Résistance | Résist. temp | Flexibilité | Résist. UV | Résist. chim | Buse | Enceinte | Difficulté | Prix |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Laiton | Non | ★ Facile | Bas |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Laiton | Non | ★★ | Bas |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Laiton | OUI | ★★★ | Bas |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Laiton | OUI | ★★★ | Moyen |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Laiton | Non | ★★★ | Moyen |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Laiton | OUI | ★★★★ | Élevé |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Acier trempé | OUI | ★★★★ | Élevé |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Laiton | OUI | ★★★★ | Élevé |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Acier trempé | Non | ★★ | Moyen |

**Légende :**
- ★ = faible/bas/mauvais
- ★★★ = moyen/standard
- ★★★★★ = excellent/meilleur de sa catégorie

---

## Choisir le bon matériau — guide de décision

Vous ne savez pas quoi choisir ? Suivez ces questions :

### Doit-il résister à la chaleur ?
**Oui** → ABS, ASA, PC ou PA

- Un peu de chaleur (jusqu'à ~90 °C) : **ABS** ou **ASA**
- Beaucoup de chaleur (au-dessus de 100 °C) : **PC** ou **PA**
- Résistance maximale à la température : **PC** (jusqu'à ~120 °C) ou **PA-CF** (jusqu'à ~160 °C)

### Doit-il être flexible ?
**Oui** → **TPU**

- Très souple (comme le caoutchouc) : TPU 85A
- Flexible standard : TPU 95A
- Semi-flexible : PETG ou PA

### Sera-t-il utilisé en extérieur ?
**Oui** → **ASA** est le choix évident

L'ASA est développé spécifiquement pour l'exposition aux UV et est supérieur à l'ABS en extérieur. Le PETG est le deuxième meilleur choix si l'ASA n'est pas disponible.

### Nécessite-t-il une résistance maximale ?
**Oui** → **PA-CF** ou **PC**

- Composite léger le plus résistant : **PA-CF**
- Thermoplastique pur le plus résistant : **PC**
- Bonne résistance à moindre coût : **PA (Nylon)**

### Impression la plus simple possible ?
→ **PLA**

Le PLA est le matériau le plus facile à utiliser. Température la plus basse, pas d'exigence d'enceinte, risque minimal de gauchissement.

### Contact alimentaire ?
→ **PLA** (avec réserves)

Le PLA lui-même n'est pas toxique, mais :
- Utiliser une buse en acier inoxydable (pas en laiton — peut contenir du plomb)
- Les impressions FDM ne sont jamais vraiment « sans danger alimentaire » à cause de la surface poreuse — les bactéries peuvent se développer
- Éviter les environnements exigeants (acides, eau chaude, lave-vaisselle)
- Le PETG est une meilleure option pour le contact unique

---

## Dureté Shore expliquée

La dureté Shore est utilisée pour décrire la dureté et la rigidité des élastomères et des matériaux plastiques. Pour l'impression 3D, elle est particulièrement pertinente pour le TPU et les autres filaments flexibles.

### Shore A — matériaux flexibles

L'échelle Shore A va de 0 (extrêmement souple, presque comme un gel) à 100 (caoutchouc extrêmement dur). Les valeurs supérieures à 90A commencent à se rapprocher des matériaux plastiques rigides.

| Valeur Shore A | Dureté perçue | Exemple |
|---|---|---|
| 30A | Extrêmement souple | Silicone, gelée |
| 50A | Très souple | Caoutchouc mou, bouchons d'oreilles |
| 70A | Souple | Chambre à air de voiture, semelle intermédiaire de chaussure de course |
| 85A | Moyennement souple | Pneu de vélo, filament TPU souple |
| 95A | Semi-rigide | Filament TPU standard |
| 100A ≈ 55D | Limite entre les échelles | — |

**TPU 95A** est la norme industrielle pour l'impression 3D et offre un bon équilibre entre élasticité et imprimabilité. **TPU 85A** est très souple et demande plus de patience lors de l'impression.

### Shore D — matériaux rigides

Shore D est utilisé pour les thermoplastiques plus durs :

| Matériau | Shore D approximatif |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Pas la même échelle
Shore A 95 et Shore D 40 ne sont pas identiques, même si les chiffres peuvent sembler proches. Les échelles sont différentes et ne se chevauchent que partiellement autour de la limite 100A/55D. Vérifiez toujours quelle échelle le fournisseur indique.
:::

---

## Tolérances thermiques — HDT et VST

Savoir à quelle température un matériau commence à céder est crucial pour les pièces fonctionnelles. Deux mesures standard sont utilisées :

- **HDT (Heat Deflection Temperature)** — la température à laquelle le matériau fléchit de 0,25 mm sous une charge standardisée. Mesure de la température de service sous charge.
- **VST (Vicat Softening Temperature)** — la température à laquelle une aiguille standardisée pénètre de 1 mm dans le matériau. Mesure du point de ramollissement absolu sans charge.

| Matériau | HDT (°C) | VST (°C) | Temp. max pratique |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | variable | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA dans les environnements chauds
Des pièces en PLA dans une voiture en été, c'est une recette pour la catastrophe. Le tableau de bord d'une voiture garée peut atteindre 80–90 °C. Utilisez de l'ABS, de l'ASA ou du PETG pour tout ce qui peut rester au soleil ou dans la chaleur.
:::

:::info Les variantes de PA ont des propriétés très différentes
Le PA est une famille de matériaux, pas un seul matériau. Le PA6 a un HDT plus bas (~70 °C), tandis que le PA12 et le PA6-CF peuvent être à 160–200 °C. Vérifiez toujours la fiche de données pour exactement le filament que vous utilisez.
:::

---

## Exigences de buse

### Buse en laiton (standard)

Fonctionne pour tous les matériaux **sans** charge en fibre de carbone ou de verre :
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Le laiton est doux et s'usera rapidement avec des matériaux abrasifs

### Buse en acier trempé (obligatoire pour les composites)

**OBLIGATOIRE** pour :
- PLA-CF (PLA fibre de carbone)
- PETG-CF
- PA-CF
- ABS-GF (ABS fibre de verre)
- PPA-CF, PPA-GF
- Tous les filaments avec « -CF », « -GF », « -HF » ou « fibre de carbone » dans le nom

L'acier trempé a une conductivité thermique plus faible que le laiton — compenser avec +5–10 °C sur la température de buse.

:::danger Les filaments en fibre de carbone détruisent rapidement les buses en laiton
Une buse en laiton peut s'user de manière perceptible après seulement quelques centaines de grammes de filament CF. Le résultat est une sous-extrusion progressive et des dimensions inexactes. Investissez dans l'acier trempé si vous imprimez des composites.
:::

---

## Aperçu rapide des matériaux par cas d'utilisation

| Cas d'utilisation | Matériau recommandé | Alternative |
|---|---|---|
| Décoration, figurines | PLA, PLA Silk | PETG |
| Pièces fonctionnelles intérieures | PETG | PLA+ |
| Exposition extérieure | ASA | PETG |
| Pièces flexibles, coques | TPU 95A | TPU 85A |
| Compartiment moteur, environnements chauds | PA-CF, PC | ABS |
| Construction légère et rigide | PLA-CF | PA-CF |
| Matériau de support (soluble) | PVA | HIPS |
| Contact alimentaire (limité) | PLA (buse inox) | — |
| Résistance maximale | PA-CF | PC |
| Transparent | PETG transparent | PC transparent |

Consultez les articles sur chaque matériau pour des informations détaillées sur les paramètres de température, le dépannage et les profils recommandés pour les imprimantes Bambu Lab.
