---
sidebar_position: 5
title: PWA
description: Bambu Dashboard'u uygulama benzeri deneyim, çevrimdışı mod ve arka plan bildirimleri için Progresif Web Uygulaması olarak yükleyin
---

# PWA (Progresif Web Uygulaması)

Bambu Dashboard, bir Progresif Web Uygulaması (PWA) olarak yüklenebilir — uygulama mağazası olmadan doğrudan tarayıcıdan uygulama benzeri bir deneyim. Daha hızlı erişim, arka planda anlık bildirimler ve sınırlı çevrimdışı işlevsellik elde edersiniz.

## Uygulama Olarak Yükleme

### Masaüstü (Chrome / Edge / Chromium)

1. Tarayıcıda `https://localhost:3443`'ü açın
2. Adres çubuğunda **Yükle** simgesini arayın (ekran simgeli aşağı ok)
3. Üzerine tıklayın
4. İletişim kutusunda **Yükle**'ye tıklayın
5. Bambu Dashboard tarayıcı arayüzü olmadan ayrı bir pencerede açılır

Alternatif olarak: Üç noktaya (⋮) tıklayın → **Bambu Dashboard'u yükle...**

### Masaüstü (Firefox)

Firefox tam PWA yüklemesini doğrudan desteklemez. En iyi deneyim için Chrome veya Edge kullanın.

### Mobil (Android – Chrome)

1. Chrome'da **https://sunucu-ip:3443** adresini açın
2. Üç noktaya → **Ana ekrana ekle**'ye dokunun
3. Uygulamaya bir ad verin ve **Ekle**'ye dokunun
4. Simge ana ekranda görünür — uygulama tarayıcı arayüzü olmadan tam ekranda açılır

### Mobil (iOS – Safari)

1. Safari'de **https://sunucu-ip:3443** adresini açın
2. **Paylaş** simgesine dokunun (yukarı oklu kare)
3. Aşağı kaydırın ve **Ana Ekrana Ekle**'yi seçin
4. **Ekle**'ye dokunun

:::warning iOS Kısıtlamaları
iOS'ta sınırlı PWA desteği vardır. Anlık bildirimler yalnızca iOS 16.4 ve sonrasında çalışır. Çevrimdışı mod sınırlıdır.
:::

## Çevrimdışı Mod

PWA, sınırlı çevrimdışı kullanım için gerekli kaynakları önbelleğe alır:

| Özellik | Çevrimdışı Kullanılabilir |
|---|---|
| Son bilinen yazıcı durumu | ✅ (önbellekten) |
| Baskı geçmişi | ✅ (önbellekten) |
| Filament deposu | ✅ (önbellekten) |
| Gerçek zamanlı durum (MQTT) | ❌ Bağlantı gerektirir |
| Kamera akışı | ❌ Bağlantı gerektirir |
| Yazıcıya komut gönderme | ❌ Bağlantı gerektirir |

Çevrimdışı görünüm en üstte bir banner gösterir: «Bağlantı kesildi — son bilinen veriler gösteriliyor».

## Arka Planda Anlık Bildirimler

PWA, uygulama açık olmasa bile anlık bildirimler gönderebilir:

1. PWA'yı açın
2. **Ayarlar → Bildirimler → Tarayıcı Push**'a gidin
3. **Anlık Bildirimleri Etkinleştir**'e tıklayın
4. İzin iletişim kutusunu kabul edin
5. Bildirimler işletim sisteminin bildirim merkezine iletilir

Anlık bildirimler, [Bildirimler](../funksjoner/notifications) bölümünde yapılandırılan tüm olaylar için çalışır.

:::info Service Worker
Anlık bildirimler, tarayıcının arka planda çalışmasını gerektirir (tam sistem kapatma yok). PWA, alma için bir Service Worker kullanır.
:::

## Uygulama Simgesi ve Görünüm

PWA, Bambu Dashboard simgesini otomatik olarak kullanır. Özelleştirmek için:

1. **Ayarlar → Sistem → PWA**'ya gidin
2. Özel bir simge yükleyin (minimum 512×512 piksel PNG)
3. **Uygulama adını** ve **Kısa adı** belirtin (mobilde simgenin altında gösterilir)
4. Mobilde durum çubuğu için **Tema rengini** seçin

## PWA'yı Güncelleme

PWA, sunucu güncellendiğinde otomatik olarak güncellenir:

- Ayrı bir banner gösterilir: «Yeni sürüm mevcut — güncellemek için tıklayın»
- Yeni sürümü yüklemek için banner'a tıklayın
- Manuel yeniden yükleme gerekmez
