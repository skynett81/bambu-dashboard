---
sidebar_position: 5
title: Achievements
description: Gamification system with unlockable achievements, rarity tiers, and milestones for Bambu Lab printing
---

# Achievements

Achievements are a gamification element that rewards milestones and exciting moments in your printing journey. Collect achievements and track your progress toward the next unlock.

Go to: **https://localhost:3443/#achievements**

## Rarity tiers

Achievements are classified into four rarity tiers:

| Tier | Color | Description |
|---|---|---|
| **Common** | Gray | Simple milestones, easy to achieve |
| **Uncommon** | Green | Requires some effort or time |
| **Rare** | Blue | Requires dedicated effort over time |
| **Legendary** | Gold | Extraordinary feats |

## Example achievements

### Printing milestones (Common / Uncommon)
| Achievement | Requirement |
|---|---|
| First print | Complete your very first print |
| Full day | Print for more than 24 hours total |
| High success rate | 10 successful prints in a row |
| Filament collector | Register 10 different filament types |
| Multicolor | Complete a multicolor print |

### Volume achievements (Uncommon / Rare)
| Achievement | Requirement |
|---|---|
| The kilogram | Use 1 kg of filament total |
| 10 kg | Use 10 kg of filament total |
| 100 prints | 100 successful prints |
| 500 hours | 500 accumulated print hours |
| Night shift | Complete a print that lasts more than 20 hours |

### Maintenance and care (Uncommon / Rare)
| Achievement | Requirement |
|---|---|
| Diligent | Log a maintenance task |
| Printer caretaker | 10 maintenance tasks logged |
| Zero waste | Create a print with > 90% material efficiency |
| Master of nozzles | Change nozzle 5 times (documented) |

### Legendary achievements
| Achievement | Requirement |
|---|---|
| Tireless | 1000 successful prints |
| Filament titan | 50 kg total filament consumption |
| Error-free week | 7 days without a single failed print |
| Print librarian | 100 different models in the file library |

## Viewing achievements

The achievements page shows:

- **Unlocked** — achievements you have earned (with date)
- **Near** — achievements you are close to unlocking (progress bar)
- **Locked** — all achievements you have not yet earned

Filter by **Tier**, **Category**, or **Status** (unlocked / in progress / locked).

## Progress bar

For achievements with a count, a progress bar is shown:

```
The kilogram — 1 kg filament
[████████░░] 847 g / 1000 g (84.7%)
```

## Notifications

You are automatically notified when you earn a new achievement:
- **Browser popup** with achievement name and graphic
- Optional: notification via Telegram / Discord (configure under **Settings → Notifications → Achievements**)

## Multi-user support

In systems with multiple users, each user has their own achievement profile. A **leaderboard** shows ranking by:

- Total number of unlocked achievements
- Total number of prints
- Total print hours

:::tip Private mode
Disable the leaderboard under **Settings → Achievements → Hide from leaderboard** to keep your profile private.
:::
