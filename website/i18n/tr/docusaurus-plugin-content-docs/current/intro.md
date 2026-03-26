---
sidebar_position: 1
title: Bambu Dashboard'a Hoş Geldiniz
description: Bambu Lab 3D yazıcılar için güçlü, kendi kendine barındırılan bir dashboard
---

# Bambu Dashboard'a Hoş Geldiniz

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard**, Bambu Lab 3D yazıcılar için kendi kendine barındırılan, tam özellikli bir kontrol panelidir. Yazıcınız, filament envanteriniz, baskı geçmişiniz ve daha fazlası üzerinde tam görünürlük ve kontrol sağlar — hepsi tek bir tarayıcı sekmesinden.

## Bambu Dashboard nedir?

Bambu Dashboard, Bambu Lab'ın sunucularına bağımlı olmaksızın LAN üzerinden MQTT aracılığıyla yazıcınıza doğrudan bağlanır. Model ve baskı geçmişi senkronizasyonu için Bambu Cloud'a da bağlanabilirsiniz.

### Temel özellikler

- **Canlı dashboard** — gerçek zamanlı sıcaklık, ilerleme, kamera, LIVE göstergeli AMS durumu
- **Filament envanteri** — AMS senkronizasyonu, EXT makara desteği, malzeme bilgisi, tabla uyumluluğu ve kurutma kılavuzu ile tüm makaraları yönetin
- **Filament takibi** — 4 seviyeli yedek ile hassas takip (AMS sensörü → EXT tahmini → cloud → süre)
- **Malzeme kılavuzu** — sıcaklıklar, tabla uyumluluğu, kurutma, özellikler ve ipuçlarıyla 15 malzeme
- **Baskı geçmişi** — model adları, MakerWorld bağlantıları, filament tüketimi ve maliyetlerle eksiksiz günlük
- **Planlayıcı** — takvim görünümü, yük dengeleme ve filament kontrolü ile baskı kuyruğu
- **Yazıcı kontrolü** — sıcaklık, hız, fanlar, G-code konsolu
- **Print Guard** — xcam + 5 sensör monitörü ile otomatik koruma
- **Maliyet tahmini** — malzeme, elektrik, işçilik, aşınma, markup ve satış fiyatı önerisi
- **Bakım** — KB tabanlı aralıklar, nozul ömrü, tabla ömrü ve kılavuz ile takip
- **Ses uyarıları** — özel ses yükleme ve yazıcı hoparlörü (M300) destekli 9 yapılandırılabilir olay
- **Etkinlik günlüğü** — tüm olayların (baskılar, hatalar, bakım, filament) kalıcı zaman çizelgesi
- **Bildirimler** — 7 kanal (Telegram, Discord, e-posta, ntfy, Pushover, SMS, webhook)
- **Çoklu yazıcı** — tüm Bambu Lab serisini destekler
- **17 dil** — Norveççe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Japonca, Korece, Hollandaca, Lehçe, Portekizce, İsveççe, Türkçe, Ukraynaca, Çince, Çekçe, Macarca
- **Kendi kendine barındırılan** — bulut bağımlılığı yok, verileriniz kendi makinenizde

### v1.1.13'teki yenilikler

- **EXT makara tespiti** MQTT eşleme alanı üzerinden P2S/A1 için — harici makara için filament tüketimi doğru şekilde izlenir
- **Filament malzeme veritabanı** 15 malzeme, tabla uyumluluğu, kurutma kılavuzu ve özelliklerle
- **Bakım paneli** KB tabanlı aralıklar, 4 yeni nozul tipi, belge bağlantılarıyla kılavuz sekmesi
- **Ses uyarıları** 9 olay, özel yükleme (MP3/OGG/WAV, maks. 10sn), ses kontrolü ve yazıcı hoparlörü
- **Etkinlik günlüğü** — sayfa açık olmasa bile tüm veritabanlarından kalıcı zaman çizelgesi
- **HMS hata kodları** 270'den fazla koddan okunabilir açıklamalarla
- **Tam i18n** — 17 dile çevrilmiş 2944 anahtarın tamamı
- **Otomatik derleme belgeleri** — kurulum ve sunucu başlangıcında belgeler otomatik olarak derlenir

## Hızlı başlangıç

| Görev | Bağlantı |
|-------|----------|
| Dashboard'u yükleyin | [Kurulum](./kom-i-gang/installasjon) |
| İlk yazıcıyı yapılandırın | [Ayarlar](./kom-i-gang/oppsett) |
| Bambu Cloud'a bağlanın | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Tüm özellikleri keşfedin | [Özellikler](./funksjoner/oversikt) |
| Filament kılavuzu | [Malzeme kılavuzu](./kb/filamenter/guide) |
| Bakım kılavuzu | [Bakım](./kb/vedlikehold/dyse) |
| API belgeleri | [API](./avansert/api) |

:::tip Demo modu
`npm run demo` çalıştırarak fiziksel bir yazıcı olmadan dashboard'u deneyebilirsiniz. Bu, canlı baskı döngüleri ile 3 simüle edilmiş yazıcı başlatır.
:::

## Desteklenen yazıcılar

LAN modundaki tüm Bambu Lab yazıcıları:

- **X1 serisi**: X1C, X1C Combo, X1E
- **P1 serisi**: P1S, P1S Combo, P1P
- **P2 serisi**: P2S, P2S Combo
- **A serisi**: A1, A1 Combo, A1 mini
- **H2 serisi**: H2S, H2D (çift nozül), H2C (alet değiştirici, 6 kafa)

## Ayrıntılı özellikler

### Filament takibi

Dashboard, filament tüketimini 4 seviyeli yedek ile otomatik olarak izler:

1. **AMS sensör farkı** — en doğru, başlangıç/bitiş remain% değerlerini karşılaştırır
2. **EXT doğrudan** — vt_tray'siz P2S/A1 için, cloud tahmini kullanır
3. **Cloud tahmini** — Bambu Cloud baskı işi verilerinden
4. **Süre tahmini** — son yedek olarak yaklaşık 30g/saat

Başarısız baskılardan sonra oluşabilecek hataları önlemek için tüm değerler, AMS sensörü ile makara veritabanının minimumu olarak gösterilir.

### Malzeme kılavuzu

15 malzeme içeren yerleşik veritabanı:
- Sıcaklıklar (nozül, tabla, hazne)
- Tabla uyumluluğu (Cool, Engineering, High Temp, Textured PEI)
- Kurutma bilgileri (sıcaklık, süre, higroskopiklik)
- 8 özellik (sağlamlık, esneklik, ısı direnci, UV, yüzey, kullanım kolaylığı)
- Zorluk derecesi ve özel gereksinimler (sertleştirilmiş nozül, muhafaza)

### Ses uyarıları

Aşağıdakileri destekleyen 9 yapılandırılabilir olay:
- **Özel ses klipleri** — MP3/OGG/WAV yükleyin (maks. 10 saniye, 500 KB)
- **Yerleşik tonlar** — Web Audio API ile oluşturulmuş metalik/synth sesler
- **Yazıcı hoparlörü** — yazıcının buzzeri'na doğrudan M300 G-code melodileri
- **Geri sayım** — baskıda 1 dakika kaldığında ses uyarısı

### Bakım

Kapsamlı bakım sistemi:
- Bileşen takibi (nozül, PTFE tüp, miller, yataklar, AMS, tabla, kurutma)
- Belgelerden KB tabanlı aralıklar
- Tipe göre nozül ömrü (pirinç, sertleştirilmiş çelik, HS01)
- Tipe göre tabla ömrü (Cool, Engineering, High Temp, Textured PEI)
- Tam belgelere ipuçları ve bağlantılar içeren kılavuz sekmesi

## Teknik genel bakış

Bambu Dashboard, Node.js 22 ve saf HTML/CSS/JS ile oluşturulmuştur — ağır çerçeveler yok, derleme adımı yok. Veritabanı, Node.js 22'ye entegre edilmiş SQLite'dır.

- **Backend**: yalnızca 3 npm paketiyle Node.js 22 (mqtt, ws, basic-ftp)
- **Frontend**: Saf HTML/CSS/JS, derleme adımı yok
- **Veritabanı**: Node.js 22 yerleşik `--experimental-sqlite` üzerinden SQLite
- **Belgeler**: 17 dilli Docusaurus, kurulumda otomatik derlenir
- **API**: 177+ endpoint, `/api/docs`'ta OpenAPI belgeleri

Ayrıntılar için [Mimari](./avansert/arkitektur) sayfasına bakın.
