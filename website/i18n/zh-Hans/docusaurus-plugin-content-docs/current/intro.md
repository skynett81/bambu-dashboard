---
sidebar_position: 1
title: 欢迎使用 Bambu Dashboard
description: 适用于 Bambu Lab 3D 打印机的强大自托管仪表板
---

# 欢迎使用 Bambu Dashboard

**Bambu Dashboard** 是一款适用于 Bambu Lab 3D 打印机的自托管全功能控制面板。它让您从单个浏览器标签页就能全面了解和控制打印机、耗材库存、打印历史记录等所有内容。

## 什么是 Bambu Dashboard？

Bambu Dashboard 通过局域网 MQTT 直接连接到您的打印机，无需依赖 Bambu Lab 的服务器。您也可以连接 Bambu Cloud 以同步模型和打印历史记录。

### 主要功能

- **实时仪表板** — 实时温度、进度、摄像头、AMS 状态
- **耗材库存** — 跟踪所有线卷、颜色、AMS 同步、烘干
- **打印历史** — 带统计数据和导出功能的完整日志
- **调度器** — 日历视图和打印队列
- **打印机控制** — 温度、速度、风扇、G-code 控制台
- **通知** — 7 个频道（Telegram、Discord、电子邮件、ntfy、Pushover、短信、webhook）
- **多打印机** — 支持完整的 Bambu Lab 系列：X1C、X1E、P1S、P1P、P2S、A1、A1 mini、A1 Combo、H2S、H2D、H2C 等
- **自托管** — 无云依赖，您的数据在您自己的设备上

## 快速开始

| 任务 | 链接 |
|------|------|
| 安装仪表板 | [安装](./kom-i-gang/installasjon) |
| 配置第一台打印机 | [设置](./kom-i-gang/oppsett) |
| 连接 Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| 探索所有功能 | [功能](./funksjoner/oversikt) |
| API 文档 | [API](./avansert/api) |

:::tip 演示模式
您可以通过运行 `npm run demo` 在没有物理打印机的情况下体验仪表板。这将启动 3 台带有实时打印周期的模拟打印机。
:::

## 支持的打印机

- **X1 系列**：X1C、X1C Combo、X1E
- **P1 系列**：P1S、P1S Combo、P1P
- **P2 系列**：P2S、P2S Combo
- **A 系列**：A1、A1 Combo、A1 mini
- **H2 系列**：H2S、H2D（双喷嘴）、H2C（换刀装置，6 个打印头）

## 技术概述

Bambu Dashboard 使用 Node.js 22 和原生 HTML/CSS/JS 构建 — 没有重型框架，没有构建步骤。数据库是 Node.js 22 内置的 SQLite。详情请参阅[架构](./avansert/arkitektur)。
