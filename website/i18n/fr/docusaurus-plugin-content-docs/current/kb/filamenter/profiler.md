---
sidebar_position: 8
title: Profils d'impression et paramètres
description: Comprendre et personnaliser les profils d'impression dans Bambu Studio — vitesse, température, rétraction et paramètres de qualité
---

# Profils d'impression et paramètres

Un profil d'impression est un ensemble de paramètres qui détermine exactement comment l'imprimante travaille — de la température et la vitesse à la rétraction et la hauteur de couche. Le bon profil fait la différence entre une impression parfaite et un échec.

## Qu'est-ce qu'un profil d'impression ?

Bambu Studio distingue trois types de profils :

- **Profil de filament** — température, refroidissement, rétraction et séchage pour un matériau spécifique
- **Profil de processus** — hauteur de couche, vitesse, remplissage et paramètres de support
- **Profil d'imprimante** — paramètres spécifiques à la machine (définis automatiquement pour les imprimantes Bambu Lab)

Bambu Studio fournit des profils génériques pour tous les filaments Bambu Lab et une gamme de matériaux tiers. Des fournisseurs tiers comme Polyalkemi, eSUN et Fillamentum créent également des profils optimisés et finement réglés pour leur filament spécifique.

Les profils peuvent être importés, exportés et partagés librement entre les utilisateurs.

## Importer des profils dans Bambu Studio

1. Télécharger le profil (fichier JSON) depuis le site du fournisseur ou MakerWorld
2. Ouvrir Bambu Studio
3. Aller dans **Fichier → Importer → Importer la configuration**
4. Sélectionner le fichier téléchargé
5. Le profil apparaît sous la sélection de filament dans le slicer

:::tip Organisation
Donnez aux profils un nom descriptif, par exemple « Polyalkemi PLA HF 0,20mm Balanced », pour retrouver facilement le bon profil la prochaine fois.
:::

## Paramètres importants expliqués

### Température

La température est le paramètre individuel le plus important. Une température trop basse entraîne une mauvaise adhésion entre couches et un sous-remplissage. Une température trop haute provoque du stringing, une surface bouillonnante et du filament brûlé.

| Paramètre | Description | PLA typique | PETG typique | ABS typique |
|---|---|---|---|---|
| Température de buse | Température de fusion | 200–220 °C | 230–250 °C | 240–260 °C |
| Température de plateau | Chaleur du plateau de construction | 55–65 °C | 70–80 °C | 90–110 °C |
| Température de chambre | Temp. de l'enceinte | Pas nécessaire | Optionnel | 40–60 °C recommandé |

Bambu Lab X1C et la série P1 ont un chauffage de chambre actif. Pour l'ABS et l'ASA, c'est crucial pour éviter le gauchissement et la délamination.

### Vitesse

Les imprimantes Bambu Lab peuvent fonctionner extrêmement vite, mais une vitesse plus élevée ne signifie pas toujours un meilleur résultat. C'est surtout la vitesse de la paroi extérieure qui affecte la surface.

| Paramètre | Ce qu'il affecte | Mode qualité | Équilibré | Rapide |
|---|---|---|---|---|
| Paroi extérieure | Résultat de surface | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Paroi intérieure | Résistance structurelle | 100 mm/s | 150 mm/s | 200+ mm/s |
| Remplissage | Remplissage intérieur | 150 mm/s | 200 mm/s | 300+ mm/s |
| Couche supérieure | Surface supérieure | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Couche inférieure | Première couche | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip La vitesse de paroi extérieure est la clé de la qualité de surface
Réduire la vitesse de paroi extérieure à 45–60 mm/s pour une finition soyeuse. Cela s'applique en particulier au PLA Silk et aux filaments mat. Les parois intérieures et le remplissage peuvent continuer à tourner vite sans affecter la surface.
:::

### Rétraction

La rétraction tire légèrement le filament en arrière dans la buse lorsque l'imprimante se déplace sans extruder. Cela empêche le stringing (fins fils entre les pièces). Des paramètres de rétraction incorrects causent soit du stringing (trop peu) soit des bourrages (trop).

| Matériau | Distance de rétraction | Vitesse de rétraction | Remarques |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Standard pour la plupart |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Trop = bourrage |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Similaire au PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimal ! Ou désactiver |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Nécessite un filament sec |

:::warning Rétraction TPU
Pour le TPU et les autres matériaux flexibles : utiliser une rétraction minimale (0–1 mm) ou désactiver complètement. Une rétraction trop importante provoque le flambage du filament souple et son blocage dans le tube Bowden, entraînant un bourrage.
:::

### Hauteur de couche

La hauteur de couche détermine l'équilibre entre le niveau de détail et la vitesse d'impression. Une faible hauteur de couche donne des détails plus fins et des surfaces plus lisses, mais prend beaucoup plus de temps.

| Hauteur de couche | Description | Cas d'utilisation |
|---|---|---|
| 0,08 mm | Ultrafin | Figurines miniatures, modèles détaillés |
| 0,12 mm | Fin | Qualité visuelle, texte, logos |
| 0,16 mm | Haute qualité | Standard pour la plupart des impressions |
| 0,20 mm | Équilibré | Bon équilibre temps/qualité |
| 0,28 mm | Rapide | Pièces fonctionnelles, prototypes |

Bambu Studio fonctionne avec des paramètres de processus tels que « 0,16mm High Quality » et « 0,20mm Balanced Quality » — ceux-ci définissent la hauteur de couche et ajustent automatiquement la vitesse et le refroidissement.

### Remplissage (Infill)

Le remplissage détermine la quantité de matériau qui remplit l'intérieur de l'impression. Plus de remplissage = plus résistant, plus lourd et temps d'impression plus long.

| Pourcentage | Cas d'utilisation | Motif recommandé |
|---|---|---|
| 10–15 % | Décoration, visuel | Gyroïde |
| 20–30 % | Usage général | Cubic, Gyroïde |
| 40–60 % | Pièces fonctionnelles | Cubic, Honeycomb |
| 80–100 % | Résistance maximale | Rectilinear |

:::tip Le gyroïde est roi
Le motif gyroïde offre le meilleur rapport résistance/poids et est isotrope — également résistant dans toutes les directions. Il est également plus rapide à imprimer que le nid d'abeille et a fière allure sur les modèles ouverts. Choix par défaut pour la plupart des situations.
:::

## Conseils de profil par matériau

### PLA — Axé sur la qualité

Le PLA est indulgent et facile à travailler. Focus sur la qualité de surface :

- **Paroi extérieure :** 60 mm/s pour une surface parfaite, surtout avec Silk PLA
- **Ventilateur de refroidissement :** 100 % à partir de la couche 3 — critique pour des détails nets et des ponts
- **Brim :** Pas nécessaire avec du PLA propre sur un plateau correctement calibré
- **Hauteur de couche :** 0,16 mm High Quality offre un bon équilibre pour les pièces décoratives

### PETG — Équilibre

Le PETG est plus résistant que le PLA, mais plus exigeant à régler finement :

- **Paramètre de processus :** 0,16 mm High Quality ou 0,20 mm Balanced Quality
- **Ventilateur de refroidissement :** 30–50 % — trop de refroidissement entraîne une mauvaise adhésion entre couches et des impressions cassantes
- **Z-hop :** Activer pour éviter que la buse ne racle la surface lors des déplacements
- **Stringing :** Ajuster la rétraction et imprimer légèrement plus chaud plutôt que plus froid

### ABS — L'enceinte est tout

L'ABS s'imprime bien, mais nécessite un environnement contrôlé :

- **Ventilateur de refroidissement :** ÉTEINT (0 %) — absolument critique ! Le refroidissement provoque la délamination et le gauchissement
- **Enceinte :** Fermer les portes et laisser la chambre chauffer à 40–60 °C avant le début de l'impression
- **Brim :** 5–8 mm recommandé pour les grandes pièces plates — évite le gauchissement aux coins
- **Ventilation :** Assurer une bonne ventilation de la pièce — l'ABS dégage des vapeurs de styrène

### TPU — Lent et prudent

Les matériaux flexibles nécessitent une approche totalement différente :

- **Vitesse :** Max 30 mm/s — une impression trop rapide provoque le flambage du filament
- **Rétraction :** Minimale (0–1 mm) ou désactiver complètement
- **Direct drive :** Le TPU fonctionne uniquement sur les machines Bambu Lab avec direct drive intégré
- **Hauteur de couche :** 0,20 mm Balanced donne une bonne fusion des couches sans trop de tension

### Nylon — Le filament sec est tout

Le nylon est hygroscopique et absorbe l'humidité en quelques heures :

- **Toujours sécher :** 70–80 °C pendant 8–12 heures avant l'impression
- **Enceinte :** Faire passer depuis la boîte de séchage directement dans l'AMS pour garder le filament sec
- **Rétraction :** Modérée (1,0–2,0 mm) — le nylon humide produit beaucoup plus de stringing
- **Plateau de construction :** Engineering Plate avec colle, ou plateau Garolite pour la meilleure adhérence

## Préréglages intégrés Bambu Lab

Bambu Studio dispose de profils intégrés pour toute la gamme de produits Bambu Lab :

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Matériaux de support Bambu Lab (Support W, Support G)
- Bambu Lab Spécialité (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Profils génériques (Generic PLA, Generic PETG, etc.) servant de point de départ pour les filaments tiers

Les profils génériques sont un bon point de départ. Affiner la température de ±5 °C en fonction du filament réel.

## Profils tiers

De nombreux fournisseurs de premier plan proposent des profils Bambu Studio prêts à l'emploi optimisés pour leur filament spécifique :

| Fournisseur | Profils disponibles | Téléchargement |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Profils Bambu Lab](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [Profils eSUN](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Profils Fillamentum](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Profils Spectrum](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Profils Fiberlogy](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [Profils add:north](https://addnorth.com/printing-profiles) |

:::info Où trouver des profils ?
- **Bambu Studio :** Profils intégrés pour les matériaux Bambu Lab et de nombreux tiers
- **Site web du fournisseur :** Rechercher « Bambu Studio profile » ou « JSON profile » dans les téléchargements
- **Bambu Dashboard :** Dans le panneau Profils d'impression de la section Outils
- **MakerWorld :** Les profils sont souvent partagés avec les modèles par d'autres utilisateurs
:::

## Exporter et partager des profils

Les profils personnalisés peuvent être exportés et partagés avec d'autres :

1. Aller dans **Fichier → Exporter → Exporter la configuration**
2. Sélectionner les profils (filament, processus, imprimante) à exporter
3. Enregistrer en fichier JSON
4. Partager le fichier directement ou télécharger sur MakerWorld

Ceci est particulièrement utile si vous avez affiné un profil au fil du temps et souhaitez le conserver lors de la réinstallation de Bambu Studio.

---

## Dépannage avec les profils

### Stringing

Fins fils entre les pièces imprimées — essayer dans cet ordre :

1. Augmenter la distance de rétraction de 0,5 mm
2. Réduire la température d'impression de 5 °C
3. Activer « Wipe on retract »
4. Vérifier que le filament est sec

### Sous-remplissage / vides dans les parois

L'impression ne semble pas solide ou présente des vides :

1. Vérifier que le paramètre de diamètre de filament est correct (1,75 mm)
2. Calibrer le débit dans Bambu Studio (Calibrage → Débit)
3. Augmenter la température de 5 °C
4. Vérifier la présence d'une buse partiellement bouchée

### Mauvaise adhésion entre couches

Les couches ne tiennent pas bien ensemble :

1. Augmenter la température de 5–10 °C
2. Réduire le ventilateur de refroidissement (surtout PETG et ABS)
3. Réduire la vitesse d'impression
4. Vérifier que l'enceinte est assez chaude (pour ABS/ASA)
