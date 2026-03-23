---
sidebar_position: 4
title: Défauts de surface
description: Diagnostiquer et corriger les problèmes de surface courants — blobs, zits, lignes de couche, pied d'éléphant et plus
---

# Défauts de surface

La surface d'une impression 3D révèle beaucoup de ce qui se passe à l'intérieur du système. La plupart des défauts de surface ont une ou deux causes clairement identifiables — avec le bon diagnostic, ils sont étonnamment faciles à corriger.

## Aperçu rapide du diagnostic

| Symptôme | Cause la plus fréquente | Première action |
|---|---|---|
| Blobs et zits | Surextrusion, placement du joint | Ajuster le joint, calibrer le flux |
| Lignes de couche visibles | Z-wobble, couches trop épaisses | Passer à des couches plus fines, vérifier l'axe Z |
| Pied d'éléphant | Première couche trop large | Compensation du pied d'éléphant |
| Ringing/ghosting | Vibrations à haute vitesse | Réduire la vitesse, activer l'input shaper |
| Sous-extrusion | Buse bouchée, température trop basse | Nettoyer la buse, augmenter la temp |
| Sur-extrusion | Débit trop élevé | Calibrer le débit |
| Pillowing | Trop peu de couches supérieures, refroidissement insuffisant | Augmenter les couches supérieures, augmenter le ventilateur |
| Délamination | Température trop basse, trop de refroidissement | Augmenter la temp, réduire le ventilateur |

---

## Blobs et Zits

Les blobs sont des bosses irrégulières sur la surface. Les zits sont des points en forme d'épingle — souvent le long de la ligne de joint.

### Causes

- **Surextrusion** — trop de plastique est extrudé et poussé sur le côté
- **Mauvais placement du joint** — le joint « nearest » par défaut accumule toutes les transitions au même endroit
- **Problèmes de rétraction** — une rétraction insuffisante crée une accumulation de pression dans la buse
- **Filament humide** — l'humidité crée des microbulles et des gouttes

### Solutions

**Paramètres de joint dans Bambu Studio :**
```
Bambu Studio → Qualité → Position du joint
- Aligned : Tous les joints au même endroit (visible mais ordonné)
- Nearest : Point le plus proche (répartit les blobs aléatoirement)
- Back : Derrière l'objet (recommandé pour la qualité visuelle)
- Random : Répartition aléatoire (meilleur camouflage du joint)
```

**Calibration du débit :**
```
Bambu Studio → Calibrage → Débit
Ajuster par pas de ±2 % jusqu'à disparition des blobs
```

:::tip Joint sur « Back » pour la qualité visuelle
Placez le joint derrière l'objet pour qu'il soit le moins visible. Combinez avec « Wipe on retract » pour une finition de joint plus nette.
:::

---

## Lignes de couche visibles

Toutes les impressions FDM ont des lignes de couche, mais elles doivent être constantes et à peine visibles sur les impressions normales. Une visibilité anormale indique des problèmes spécifiques.

### Causes

- **Z-wobble** — l'axe Z vibre ou n'est pas droit, créant un motif ondulé sur toute la hauteur
- **Couches trop épaisses** — une hauteur de couche supérieure à 0,28 mm est perceptible même sur les impressions parfaites
- **Fluctuations de température** — une température de fusion inconstante entraîne une largeur de couche variable
- **Diamètre de filament inconstant** — filament bon marché avec un diamètre variable

### Solutions

**Z-wobble :**
- Vérifier que la vis mère Z (Z-leadscrew) est propre et lubrifiée
- Contrôler que la vis n'est pas fléchie (inspection visuelle en rotation)
- Voir l'article de maintenance pour la [lubrification de l'axe Z](/docs/kb/vedlikehold/smoring)

**Hauteur de couche :**
- Passer à 0,12 mm ou 0,16 mm pour une surface plus lisse
- N'oubliez pas que diviser la hauteur de couche par deux double le temps d'impression

**Fluctuations de température :**
- Utiliser la calibration PID (disponible via le menu de maintenance de Bambu Studio)
- Éviter les courants d'air qui refroidissent la buse pendant l'impression

---

## Pied d'éléphant

Le pied d'éléphant se produit quand la première couche est plus large que le reste de l'objet — comme si l'objet « s'étalait » à la base.

### Causes

- La première couche s'écrase trop fort contre le plateau (Z-offset trop serré)
- La température de plateau trop élevée maintient le plastique mou et fluide trop longtemps
- Un refroidissement insuffisant sur la première couche donne au plastique plus de temps pour s'étaler

### Solutions

**Compensation du pied d'éléphant dans Bambu Studio :**
```
Bambu Studio → Qualité → Compensation du pied d'éléphant
Commencer par 0,1–0,2 mm et ajuster jusqu'à disparition du pied
```

**Z-offset :**
- Recalibrer la hauteur de la première couche
- Relever le Z-offset de 0,05 mm à la fois jusqu'à disparition du pied

**Température de plateau :**
- Réduire la température de plateau de 5–10 °C
- Pour le PLA : 55 °C suffit souvent — 65 °C peut provoquer un pied d'éléphant

:::warning Ne pas trop compenser
Une compensation de pied d'éléphant trop élevée peut créer un vide entre la première couche et le reste. Ajuster prudemment par pas de 0,05 mm.
:::

---

## Ringing et Ghosting

Le ringing (aussi appelé « ghosting » ou « echoing ») est un motif ondulé dans la surface juste après les arêtes vives ou les coins. Le motif « se répercute » depuis l'arête.

### Causes

- **Vibrations** — l'accélération et la décélération rapides aux coins envoient des vibrations dans le cadre
- **Vitesse trop élevée** — notamment la vitesse de la paroi extérieure au-dessus de 100 mm/s produit un ringing marqué
- **Pièces desserrées** — bobine lâche, chaîne de câble vibrante ou imprimante mal fixée

### Solutions

**Bambu Lab input shaper (Compensation de résonance) :**
```
Bambu Studio → Imprimante → Compensation de résonance
Bambu Lab X1C et P1S ont un accéléromètre intégré et s'auto-calibrent
```

**Réduire la vitesse :**
```
Paroi extérieure : Réduire à 60–80 mm/s
Accélération : Réduire du standard à 3000–5000 mm/s²
```

**Vérification mécanique :**
- Vérifier que l'imprimante repose sur une surface stable
- Contrôler que la bobine ne vibre pas dans son support
- Serrer toutes les vis accessibles sur les panneaux extérieurs du cadre

:::tip X1C et P1S auto-calibrent le ringing
Bambu Lab X1C et P1S ont une calibration d'accéléromètre intégrée qui s'exécute automatiquement au démarrage. Exécuter « Calibration complète » depuis le menu de maintenance si le ringing apparaît après une période d'utilisation.
:::

---

## Sous-extrusion

La sous-extrusion se produit quand l'imprimante extrude trop peu de plastique. Le résultat est des parois fines et faibles, des vides visibles entre les couches, et une surface hirsute.

### Causes

- **Buse partiellement bouchée** — l'accumulation de carbone réduit le débit
- **Température de buse trop basse** — le plastique n'est pas assez fluide
- **Engrenage usé** dans le mécanisme de l'extrudeur qui ne saisit pas assez bien le filament
- **Vitesse trop élevée** — l'extrudeur ne peut pas suivre le débit souhaité

### Solutions

**Cold pull :**
```
1. Chauffer la buse à 220 °C
2. Pousser le filament manuellement
3. Refroidir la buse à 90 °C (PLA) en maintenant la pression
4. Tirer le filament rapidement
5. Répéter jusqu'à ce que ce qui ressort soit propre
```

**Ajustement de température :**
- Augmenter la température de la buse de 5–10 °C et retester
- Fonctionner à une température trop basse est une cause courante de sous-extrusion

**Calibration du débit :**
```
Bambu Studio → Calibrage → Débit
Augmenter progressivement jusqu'à disparition de la sous-extrusion
```

**Vérifier l'engrenage de l'extrudeur :**
- Retirer le filament et inspecter l'engrenage
- Nettoyer avec une petite brosse s'il y a de la poudre de filament dans les dents

---

## Sur-extrusion

La sur-extrusion produit un cordon trop large — la surface paraît lâche, brillante ou inégale, avec une tendance aux blobs.

### Causes

- **Débit trop élevé** (EM — Multiplicateur d'extrusion)
- **Mauvais diamètre de filament** — filament de 2,85 mm avec un profil 1,75 mm cause une sur-extrusion massive
- **Température de buse trop élevée** rend le plastique trop fluide

### Solutions

**Calibration du débit :**
```
Bambu Studio → Calibrage → Débit
Réduire par pas de 2 % jusqu'à ce que la surface soit uniforme et mate
```

**Vérifier le diamètre du filament :**
- Mesurer le diamètre réel du filament avec un pied à coulisse en 5–10 endroits le long du filament
- Un écart moyen supérieur à 0,05 mm indique un filament de mauvaise qualité

---

## Pillowing

Le pillowing est caractérisé par des couches supérieures boursouflées et inégales avec des « oreillers » de plastique entre les couches supérieures. Particulièrement visible avec un faible taux de remplissage et trop peu de couches supérieures.

### Causes

- **Trop peu de couches supérieures** — le plastique au-dessus du remplissage s'effondre dans les vides
- **Refroidissement insuffisant** — le plastique ne se solidifie pas assez vite pour faire le pont au-dessus des vides du remplissage
- **Remplissage trop faible** — de grands vides dans le remplissage sont difficiles à traverser

### Solutions

**Augmenter le nombre de couches supérieures :**
```
Bambu Studio → Qualité → Couches de coque supérieures
Minimum : 4 couches
Recommandé pour une surface lisse : 5–6 couches
```

**Augmenter le refroidissement :**
- Le PLA devrait avoir le ventilateur de refroidissement à 100 % à partir de la couche 3
- Un refroidissement insuffisant est la cause la plus fréquente du pillowing

**Augmenter le remplissage :**
- Passer de 10–15 % à 20–25 % si le pillowing persiste
- Le motif gyroïde donne une surface de pont plus uniforme que les lignes

:::tip Repassage (Ironing)
La fonction « ironing » de Bambu Studio fait passer la buse une fois de plus sur la couche supérieure pour lisser la surface. Activer sous Qualité → Ironing pour la meilleure finition de couche supérieure.
:::

---

## Délamination (séparation des couches)

La délamination se produit quand les couches n'adhèrent pas correctement les unes aux autres. Dans le pire des cas, l'impression se fissure le long des lignes de couche.

### Causes

- **Température de buse trop basse** — le plastique ne fond pas assez bien dans la couche inférieure
- **Trop de refroidissement** — le plastique se solidifie trop rapidement avant d'avoir le temps de fusionner
- **Épaisseur de couche trop grande** — au-delà de 80 % du diamètre de la buse, la fusion est médiocre
- **Vitesse trop élevée** — temps de fusion réduit par mm de trajet

### Solutions

**Augmenter la température :**
- Essayer +10 °C par rapport au standard et observer
- L'ABS et l'ASA sont particulièrement sensibles — nécessitent un chauffage de chambre contrôlé

**Réduire le refroidissement :**
- ABS : ventilateur de refroidissement ÉTEINT (0 %)
- PETG : 20–40 % max
- PLA : peut tolérer un refroidissement complet, mais réduire si la délamination survient

**Épaisseur de couche :**
- Utiliser max 75 % du diamètre de la buse
- Avec une buse de 0,4 mm : hauteur de couche max recommandée de 0,30 mm

**Vérifier que l'enceinte est assez chaude (ABS/ASA/PA/PC) :**
```
Bambu Lab X1C/P1S : Laisser la chambre chauffer à 40–60 °C
avant le début de l'impression — ne pas ouvrir la porte pendant l'impression
```

---

## Conseils généraux de dépannage

1. **Changer une chose à la fois** — tester avec une petite impression de calibration entre chaque changement
2. **Sécher le filament en premier** — de nombreux défauts de surface sont en réalité des symptômes d'humidité
3. **Nettoyer la buse** — un bouchage partiel produit des défauts de surface incohérents difficiles à diagnostiquer
4. **Effectuer une calibration complète** depuis le menu de maintenance de Bambu Studio après des ajustements importants
5. **Utiliser Bambu Dashboard** pour suivre quels paramètres ont donné les meilleurs résultats dans le temps
