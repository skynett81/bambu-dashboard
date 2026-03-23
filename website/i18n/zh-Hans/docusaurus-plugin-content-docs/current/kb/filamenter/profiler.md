---
sidebar_position: 8
title: 打印配置文件和设置
description: 理解和自定义 Bambu Studio 中的打印配置文件 — 速度、温度、回抽和质量设置
---

# 打印配置文件和设置

打印配置文件是一组精确决定打印机工作方式的设置 — 从温度和速度到回抽和层高。正确的配置文件是完美打印和失败打印之间的区别。

## 什么是打印配置文件？

Bambu Studio 区分三种类型的配置文件：

- **耗材配置文件** — 特定材料的温度、冷却、回抽和干燥
- **流程配置文件** — 层高、速度、填充和支撑设置
- **打印机配置文件** — 机器特定设置（Bambu Lab 打印机自动设置）

Bambu Studio 为所有 Bambu Lab 耗材和许多第三方材料提供通用配置文件。Polyalkemi、eSUN 和 Fillamentum 等第三方供应商还创建了专门针对其耗材优化的配置文件。

配置文件可以在用户之间自由导入、导出和共享。

## 在 Bambu Studio 中导入配置文件

1. 从供应商网站或 MakerWorld 下载配置文件（JSON 文件）
2. 打开 Bambu Studio
3. 转到**文件 → 导入 → 导入配置**
4. 选择下载的文件
5. 配置文件将出现在切片器的耗材选择中

:::tip 整理
给配置文件起一个描述性名称，例如"Polyalkemi PLA HF 0.20mm Balanced"，以便下次轻松找到正确的配置文件。
:::

## 重要设置解释

### 温度

温度是最重要的单一设置。温度过低导致层粘合不良和欠填充。温度过高导致拉丝、气泡表面和耗材烧焦。

| 设置 | 描述 | 典型 PLA | 典型 PETG | 典型 ABS |
|---|---|---|---|---|
| 喷嘴温度 | 熔化温度 | 200–220 °C | 230–250 °C | 240–260 °C |
| 床温 | 打印板加热 | 55–65 °C | 70–80 °C | 90–110 °C |
| 腔室温度 | 密封空间温度 | 不需要 | 可选 | 40–60 °C 推荐 |

Bambu Lab X1C 和 P1 系列具有主动腔室加热功能。对于 ABS 和 ASA，这对于避免翘边和层分离至关重要。

### 速度

Bambu Lab 打印机可以运行得非常快，但更高速度并不总是意味着更好的结果。外壁速度特别影响表面效果。

| 设置 | 影响 | 质量模式 | 平衡 | 快速 |
|---|---|---|---|---|
| 外壁 | 表面结果 | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| 内壁 | 结构强度 | 100 mm/s | 150 mm/s | 200+ mm/s |
| 填充 | 内部填充 | 150 mm/s | 200 mm/s | 300+ mm/s |
| 顶层 | 顶面 | 45–60 mm/s | 80 mm/s | 100 mm/s |
| 底层 | 第一层 | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip 外壁速度是表面质量的关键
将外壁速度降至 45–60 mm/s 以获得丝绸光泽表面。这特别适用于 Silk PLA 和哑光耗材。内壁和填充仍然可以快速运行而不影响表面效果。
:::

### 回抽

回抽在打印机移动而不挤出时将耗材稍微收回喷嘴中。这防止了拉丝（部件之间的细线）。错误的回抽设置会产生拉丝（太少）或卡料（太多）。

| 材料 | 回抽距离 | 回抽速度 | 备注 |
|---|---|---|---|
| PLA | 0.8–2.0 mm | 30–50 mm/s | 大多数标准 |
| PETG | 1.0–3.0 mm | 20–40 mm/s | 太多 = 卡料 |
| ABS | 0.5–1.5 mm | 30–50 mm/s | 类似 PLA |
| TPU | 0–1.0 mm | 10–20 mm/s | 最小化！或禁用 |
| 尼龙 | 1.0–2.0 mm | 30–40 mm/s | 需要干燥耗材 |

:::warning TPU 回抽
对于 TPU 和其他柔性材料：使用最小回抽（0–1 mm）或完全禁用。回抽太多会导致柔软耗材弯曲并堵塞在 Bowden 管中，导致卡料。
:::

### 层高

层高决定了细节级别和打印速度之间的平衡。低层高产生更细的细节和更光滑的表面，但需要更多时间。

| 层高 | 描述 | 用途 |
|---|---|---|
| 0.08 mm | 超细 | 微缩模型、详细模型 |
| 0.12 mm | 细 | 视觉质量、文字、徽标 |
| 0.16 mm | 高质量 | 大多数打印的标准 |
| 0.20 mm | 平衡 | 时间/质量的良好平衡 |
| 0.28 mm | 快速 | 功能性部件、原型 |

Bambu Studio 使用"0.16mm High Quality"和"0.20mm Balanced Quality"等流程设置 — 这些设置层高并自动调整速度和冷却。

### 填充

填充决定了填充打印内部的材料量。更多填充 = 更强、更重、打印时间更长。

| 百分比 | 用途 | 推荐图案 |
|---|---|---|
| 10–15% | 装饰、视觉 | Gyroid |
| 20–30% | 一般用途 | Cubic、Gyroid |
| 40–60% | 功能性部件 | Cubic、Honeycomb |
| 80–100% | 最大强度 | Rectilinear |

:::tip Gyroid 是王者
Gyroid 图案提供最佳的强度重量比，是各向同性的 — 在所有方向上同样坚固。它打印速度也比 Honeycomb 快，在开放模型上看起来很好。大多数情况下的标准选择。
:::

## 材料配置文件技巧

### PLA — 质量专注

PLA 宽容且易于使用。专注于表面质量：

- **外壁：** 60 mm/s 获得完美表面，特别是 Silk PLA
- **冷却风扇：** 从第 3 层起 100% — 对尖锐细节和桥接至关重要
- **裙边：** 在正确校准的打印板上纯 PLA 不需要
- **层高：** 0.16mm High Quality 为装饰部件提供良好平衡

### PETG — 平衡

PETG 比 PLA 更强，但更难微调：

- **流程设置：** 0.16mm High Quality 或 0.20mm Balanced Quality
- **冷却风扇：** 30–50% — 冷却太多导致层粘合不良和易碎打印件
- **Z 跳升：** 启用以防止喷嘴在移动时拖拉表面
- **拉丝：** 调整回抽并稍微提高温度而不是降低

### ABS — 腔室就是一切

ABS 打印效果很好，但需要受控环境：

- **冷却风扇：** 关闭（0%）— 绝对关键！冷却会导致层分离和翘边
- **腔室：** 关上门让腔室在打印开始前加热至 40–60 °C
- **裙边：** 大而平的部件推荐 5–8 mm — 避免角落翘边
- **通风：** 确保房间通风良好 — ABS 释放苯乙烯蒸气

### TPU — 慢而谨慎

柔性材料需要完全不同的方法：

- **速度：** 最快 30 mm/s — 打印太快会使耗材弯曲
- **回抽：** 最小（0–1 mm）或完全禁用
- **直驱：** TPU 只能在具有内置直驱的 Bambu Lab 机器上工作
- **层高：** 0.20mm Balanced 在不过度张力的情况下提供良好层熔合

### 尼龙 — 干燥耗材就是一切

尼龙具有吸湿性，会在几小时内吸收湿气：

- **始终干燥：** 打印前在 70–80 °C 下 8–12 小时
- **腔室：** 直接从干燥箱运行到 AMS 以保持耗材干燥
- **回抽：** 适中（1.0–2.0 mm）— 湿润尼龙产生更多拉丝
- **打印板：** 带胶的工程板，或 Garolite 板以获得最佳粘附

## Bambu Lab 预设

Bambu Studio 内置了整个 Bambu Lab 产品系列的配置文件：

- Bambu Lab Basic PLA、PETG、ABS、TPU、PVA、PA、PC、ASA
- Bambu Lab 支撑材料（Support W、Support G）
- Bambu Lab Specialty（PLA-CF、PETG-CF、ABS-GF、PA-CF、PPA-CF、PPA-GF）
- 通用配置文件（Generic PLA、Generic PETG 等）— 作为第三方耗材的起点

通用配置文件是一个好的起点。根据实际耗材以 ±5 °C 微调温度。

## 第三方配置文件

许多领先供应商提供专门针对其耗材优化的现成 Bambu Studio 配置文件：

| 供应商 | 可用配置文件 | 下载 |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA、PLA High Speed、PETG、PETG-CF、ABS | [Bambu Lab 配置文件](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+、ePLA-Lite、PETG、eABS | [eSUN 配置文件](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA、PLA、PET-G | [Fillamentum 配置文件](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0、PETG-HT100 | [Spectrum 配置文件](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG、Matte-PETG、TPU 30D | [Fiberlogy 配置文件](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA、PETG、AduraX、X-PLA | [add:north 配置文件](https://addnorth.com/printing-profiles) |

:::info 在哪里找到配置文件？
- **Bambu Studio：** Bambu Lab 材料和许多第三方的内置配置文件
- **供应商网站：** 在下载区搜索"Bambu Studio profile"或"JSON profile"
- **Bambu Dashboard：** 工具部分的打印配置文件面板
- **MakerWorld：** 配置文件经常与其他用户的模型一起共享
:::

## 导出和共享配置文件

个人配置文件可以导出并与他人共享：

1. 转到**文件 → 导出 → 导出配置**
2. 选择要导出的配置文件（耗材、流程、打印机）
3. 保存为 JSON 文件
4. 直接共享文件或上传到 MakerWorld

如果您已经长时间微调了配置文件并希望在重新安装 Bambu Studio 时保存它，这特别有用。

---

## 使用配置文件的故障排除

### 拉丝

打印部件之间的细线 — 按此顺序尝试：

1. 将回抽距离增加 0.5 mm
2. 将打印温度降低 5 °C
3. 启用"Wipe on retract"
4. 检查耗材是否干燥

### 欠填充/墙壁中的孔

打印件看起来不坚实或有孔：

1. 检查耗材直径设置是否正确（1.75 mm）
2. 在 Bambu Studio 中校准流量率（校准 → Flow Rate）
3. 将温度提高 5 °C
4. 检查是否有部分喷嘴堵塞

### 层粘合不良

层之间连接不好：

1. 将温度提高 5–10 °C
2. 减少冷却风扇（特别是 PETG 和 ABS）
3. 降低打印速度
4. 检查腔室是否足够热（对于 ABS/ASA）
