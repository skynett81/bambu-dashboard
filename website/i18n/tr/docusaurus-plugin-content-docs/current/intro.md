---
sidebar_position: 1
title: Bambu Dashboard'a Hoş Geldiniz
description: Bambu Lab 3D yazıcılar için güçlü, kendi kendine barındırılan bir dashboard
---

# Bambu Dashboard'a Hoş Geldiniz

**Bambu Dashboard**, Bambu Lab 3D yazıcılar için kendi kendine barındırılan, tam özellikli bir kontrol panelidir. Yazıcınız, filament envanteriniz, baskı geçmişiniz ve daha fazlası üzerinde tam görünürlük ve kontrol sağlar — hepsi tek bir tarayıcı sekmesinden.

## Bambu Dashboard nedir?

Bambu Dashboard, Bambu Lab'ın sunucularına bağımlı olmaksızın LAN üzerinden MQTT aracılığıyla yazıcınıza doğrudan bağlanır. Model ve baskı geçmişi senkronizasyonu için Bambu Cloud'a da bağlanabilirsiniz.

### Temel özellikler

- **Canlı dashboard** — gerçek zamanlı sıcaklık, ilerleme, kamera, AMS durumu
- **Filament envanteri** — tüm makaraları, renkleri, AMS senkronizasyonunu, kurutmayı takip edin
- **Baskı geçmişi** — istatistikler ve dışa aktarma ile eksiksiz günlük
- **Zamanlayıcı** — takvim görünümü ve baskı kuyruğu
- **Yazıcı kontrolü** — sıcaklık, hız, fanlar, G-code konsolu
- **Bildirimler** — 7 kanal (Telegram, Discord, e-posta, ntfy, Pushover, SMS, webhook)
- **Çoklu yazıcı** — tüm Bambu Lab serisini destekler: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C ve daha fazlası
- **Kendi kendine barındırılan** — bulut bağımlılığı yok, verileriniz kendi makinenizde

## Hızlı başlangıç

| Görev | Bağlantı |
|-------|----------|
| Dashboard'u yükleyin | [Kurulum](./kom-i-gang/installasjon) |
| İlk yazıcıyı yapılandırın | [Ayarlar](./kom-i-gang/oppsett) |
| Bambu Cloud'a bağlanın | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Tüm özellikleri keşfedin | [Özellikler](./funksjoner/oversikt) |
| API belgeleri | [API](./avansert/api) |

:::tip Demo modu
`npm run demo` çalıştırarak fiziksel bir yazıcı olmadan dashboard'u deneyebilirsiniz. Bu, canlı baskı döngüleri ile 3 simüle edilmiş yazıcı başlatır.
:::

## Desteklenen yazıcılar

- **X1 serisi**: X1C, X1C Combo, X1E
- **P1 serisi**: P1S, P1S Combo, P1P
- **P2 serisi**: P2S, P2S Combo
- **A serisi**: A1, A1 Combo, A1 mini
- **H2 serisi**: H2S, H2D (çift nozül), H2C (alet değiştirici, 6 kafa)

## Teknik genel bakış

Bambu Dashboard, Node.js 22 ve saf HTML/CSS/JS ile oluşturulmuştur — ağır çerçeveler yok, derleme adımı yok. Veritabanı, Node.js 22'ye entegre edilmiş SQLite'dır. Ayrıntılar için [Mimari](./avansert/arkitektur) sayfasına bakın.
