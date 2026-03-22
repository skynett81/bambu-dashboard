---
sidebar_position: 1
title: Bambu Dashboardへようこそ
description: Bambu Lab 3DプリンターのためのパワフルなセルフホステッドDashboard
---

# Bambu Dashboardへようこそ

**Bambu Dashboard**は、Bambu Lab 3Dプリンター向けのセルフホステッド型フル機能コントロールパネルです。プリンター、フィラメント在庫、印刷履歴などを完全に把握・管理できます — すべて1つのブラウザタブから。

## Bambu Dashboardとは?

Bambu DashboardはLAN経由のMQTTでプリンターに直接接続し、Bambu Labのサーバーに依存しません。モデルや印刷履歴の同期のためにBambu Cloudにも接続できます。

### 主な機能

- **ライブダッシュボード** — リアルタイムの温度、進捗、カメラ、AMSステータス
- **フィラメント在庫** — すべてのスプール、色、AMS同期、乾燥の追跡
- **印刷履歴** — 統計とエクスポート付きの完全なログ
- **スケジューラー** — カレンダービューと印刷キュー
- **プリンター制御** — 温度、速度、ファン、G-codeコンソール
- **通知** — 7チャンネル（Telegram、Discord、メール、ntfy、Pushover、SMS、webhook）
- **マルチプリンター** — Bambu Lab全シリーズ対応: X1C、X1E、P1S、P1P、P2S、A1、A1 mini、A1 Combo、H2S、H2D、H2Cなど
- **セルフホステッド** — クラウド依存なし、データは自分のマシンに

## クイックスタート

| タスク | リンク |
|--------|--------|
| ダッシュボードのインストール | [インストール](./kom-i-gang/installasjon) |
| 最初のプリンターを設定する | [セットアップ](./kom-i-gang/oppsett) |
| Bambu Cloudに接続する | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| すべての機能を探索する | [機能](./funksjoner/oversikt) |
| APIドキュメント | [API](./avansert/api) |

:::tip デモモード
`npm run demo`を実行することで、物理的なプリンターなしにダッシュボードを試すことができます。これによりライブ印刷サイクルを持つ3台のシミュレートされたプリンターが起動します。
:::

## 対応プリンター

- **X1シリーズ**: X1C、X1C Combo、X1E
- **P1シリーズ**: P1S、P1S Combo、P1P
- **P2シリーズ**: P2S、P2S Combo
- **Aシリーズ**: A1、A1 Combo、A1 mini
- **H2シリーズ**: H2S、H2D（デュアルノズル）、H2C（ツールチェンジャー、6ヘッド）

## 技術概要

Bambu DashboardはNode.js 22とバニラHTML/CSS/JSで構築されています — 重いフレームワークなし、ビルドステップなし。データベースはNode.js 22に組み込まれたSQLiteです。詳細は[アーキテクチャ](./avansert/arkitektur)をご覧ください。
