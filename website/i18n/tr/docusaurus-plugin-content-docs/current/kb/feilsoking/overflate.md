---
sidebar_position: 4
title: Yüzey Hataları
description: Yaygın yüzey sorunlarının teşhisi ve giderilmesi — blobs, zits, katman çizgileri, elephant foot ve daha fazlası
---

# Yüzey Hataları

Bir 3D baskının yüzeyi, sistemde neler olduğu hakkında çok şey anlatır. Yüzey hatalarının çoğunun bir veya iki net nedeni vardır — doğru teşhisle düzeltmek şaşırtıcı derecede kolaydır.

## Hızlı teşhis özeti

| Belirti | En yaygın neden | İlk adım |
|---|---|---|
| Blobs ve zits | Aşırı ekstrüzyon, dikiş konumu | Dikişi ayarlayın, akışı kalibre edin |
| Görünür katman çizgileri | Z-wobble, çok kalın katmanlar | Daha ince katmanlara geçin, Z eksenini kontrol edin |
| Elephant foot | İlk katman çok geniş | Elephant foot telafisi |
| Ringing/ghosting | Yüksek hızda titreşimler | Hızı azaltın, input shaper'ı etkinleştirin |
| Yetersiz ekstrüzyon | Tıkalı nozzle, çok düşük sıcaklık | Nozzle'ı temizleyin, sıcaklığı artırın |
| Aşırı ekstrüzyon | Çok yüksek akış hızı | Akış hızını kalibre edin |
| Pillowing | Çok az üst katman, çok az soğutma | Üst katman sayısını artırın, soğutma fanını artırın |
| Katman ayrılması | Çok düşük sıcaklık, çok fazla soğutma | Sıcaklığı artırın, fanı azaltın |

---

## Blobs ve zits

Blobs, yüzeydeki düzensiz topaklanmalardır. Zits ise iğne ucu gibi noktalardır — genellikle dikiş çizgisi boyunca.

### Nedenler

- **Aşırı ekstrüzyon** — çok fazla plastik ekstrüde edilir ve yana itilir
- **Kötü dikiş konumu** — standart "nearest" dikişi tüm geçişleri aynı yere toplar
- **Geri çekme sorunu** — yetersiz geri çekme nozzle'da basınç birikişi oluşturur
- **Nemli filament** — nem mikro kabarcıklar ve damlama oluşturur

### Çözümler

**Bambu Studio'da dikiş ayarları:**
```
Bambu Studio → Kalite → Dikiş konumu
- Aligned: Tüm dikişler aynı yerde (görünür ama düzenli)
- Nearest: En yakın nokta (blobs'ları rastgele dağıtır)
- Back: Nesnenin arkası (görsel kalite için önerilir)
- Random: Rastgele dağılım (dikişi en iyi maskeler)
```

**Akış hızı kalibrasyonu:**
```
Bambu Studio → Kalibrasyon → Akış hızı
Blobs kaybolana kadar ±%2 adımlarla ayarlayın
```

:::tip Görsel kalite için dikiş "Back" konumunda
Dikişi nesnenin arka tarafına yerleştirerek en az görünür hale getirin. Daha temiz bir dikiş bitişi için "Wipe on retract" ile birleştirin.
:::

---

## Görünür katman çizgileri

Tüm FDM baskıların katman çizgileri vardır, ancak bunlar normal baskılarda tutarlı ve neredeyse görünmez olmalıdır. Anormal görünürlük somut sorunlara işaret eder.

### Nedenler

- **Z-wobble** — Z ekseni titreşiyor veya düz değil, tüm yükseklikte dalgalı desen oluşturur
- **Çok kalın katmanlar** — 0,28 mm üzerindeki katman yüksekliği mükemmel baskılarda bile fark edilir
- **Sıcaklık dalgalanmaları** — tutarsız erime sıcaklığı değişken katman genişliği oluşturur
- **Tutarsız filament çapı** — değişken çaplı ucuz filament

### Çözümler

**Z-wobble:**
- Z mili (Z-leadscrew) temiz ve yağlı mı kontrol edin
- Milin eğri olup olmadığını kontrol edin (döndürürken görsel inceleme)
- [Z ekseni yağlama](/docs/kb/vedlikehold/smoring) için bakım makalesine bakın

**Katman yüksekliği:**
- Daha düzgün yüzey için 0,12 mm veya 0,16 mm'ye geçin
- Katman yüksekliğini yarıya indirmenin baskı süresini iki katına çıkardığını unutmayın

**Sıcaklık dalgalanmaları:**
- PID kalibrasyonu kullanın (Bambu Studio bakım menüsünden erişilebilir)
- Baskı sırasında nozzle'ı soğutan hava akımlarından kaçının

---

## Elephant foot

Elephant foot, ilk katmanın nesnenin geri kalanından daha geniş olduğu durumdur — nesne tabanda "açılıyor" gibi görünür.

### Nedenler

- İlk katman tablaya çok sert bastırılıyor (Z-offset çok yakın)
- Çok yüksek tabla sıcaklığı plastiği çok uzun süre yumuşak ve akışkan tutar
- İlk kattaki yetersiz soğutma plastiğin yayılması için daha fazla zaman verir

### Çözümler

**Bambu Studio'da Elephant foot telafisi:**
```
Bambu Studio → Kalite → Elephant foot telafisi
0,1–0,2 mm ile başlayın ve ayak kaybolana kadar ayarlayın
```

**Z-offset:**
- İlk katman yüksekliğini yeniden kalibre edin
- Ayak kaybolana kadar Z-offset'i 0,05 mm artırın

**Tabla sıcaklığı:**
- Tabla sıcaklığını 5–10 °C azaltın
- PLA için: 55 °C genellikle yeterlidir — 65 °C elephant foot'a neden olabilir

:::warning Çok fazla telafi etmeyin
Çok yüksek elephant foot telafisi, ilk katman ile geri kalan arasında boşluk oluşturabilir. 0,05 mm adımlarla dikkatli ayarlayın.
:::

---

## Ringing ve ghosting

Ringing (aynı zamanda "ghosting" veya "echoing" olarak da adlandırılır), keskin kenarlar veya köşelerden hemen sonra yüzeyde bir dalga desenidir. Desen kenardan "yankılanır".

### Nedenler

- **Titreşimler** — köşelerde hızlı ivmelenme ve yavaşlama çerçeve boyunca titreşimler gönderir
- **Çok yüksek hız** — özellikle 100 mm/s üzerindeki dış duvar hızı belirgin ringing oluşturur
- **Gevşek parçalar** — gevşek makara, titreşen kablo kılavuzu veya düzgün takılmamış yazıcı

### Çözümler

**Bambu Lab input shaper (Rezonans telafisi):**
```
Bambu Studio → Yazıcı → Rezonans telafisi
Bambu Lab X1C ve P1S yerleşik ivmeölçere sahiptir ve bunu otomatik kalibre eder
```

**Hızı azaltın:**
```
Dış duvar: 60–80 mm/s'ye düşürün
İvme: Standarttan 3000–5000 mm/s²'ye düşürün
```

**Mekanik kontrol:**
- Yazıcının sabit bir yüzeyde durduğunu kontrol edin
- Makaranın makara tutucusunda titreşip titreşmediğini kontrol edin
- Çerçevenin dış panellerindeki tüm erişilebilir vidaları sıkıştırın

:::tip X1C ve P1S ringing'i otomatik olarak kalibre eder
Bambu Lab X1C ve P1S, başlangıçta otomatik olarak çalışan yerleşik ivmeölçer kalibrasyonuna sahiptir. Bir süre sonra ringing ortaya çıkarsa bakım menüsünden "Tam kalibrasyon" çalıştırın.
:::

---

## Yetersiz ekstrüzyon

Yetersiz ekstrüzyon, yazıcının çok az plastik ekstrüde ettiği durumdur. Sonuç ince, zayıf duvarlar, katmanlar arasında görünür boşluklar ve "düzensiz" yüzeydir.

### Nedenler

- **Kısmen tıkalı nozzle** — karbon birikimi akışı azaltır
- **Çok düşük nozzle sıcaklığı** — plastik yeterince akışkan değil
- **Ekstrüder mekanizmasındaki yıpranmış dişli** filamenti yeterince kavramıyor
- **Çok yüksek hız** — ekstrüder istenen akışa yetişemiyor

### Çözümler

**Soğuk çekme (Cold pull):**
```
1. Nozzle'ı 220 °C'ye ısıtın
2. Filamenti manuel olarak itin
3. Basınç uygularken nozzle'ı 90 °C'ye (PLA) soğutun
4. Filamenti hızla çıkarın
5. Çıkarılan malzeme temiz olana kadar tekrarlayın
```

**Sıcaklık ayarı:**
- Nozzle sıcaklığını 5–10 °C artırın ve tekrar test edin
- Çok düşük sıcaklık, yetersiz ekstrüzyonun yaygın bir nedenidir

**Akış hızı kalibrasyonu:**
```
Bambu Studio → Kalibrasyon → Akış hızı
Yetersiz ekstrüzyon kaybolana kadar kademeli olarak artırın
```

**Ekstrüder dişlisini kontrol edin:**
- Filamenti çıkarın ve dişliyi inceleyin
- Dişlerde filament tozu varsa küçük bir fırçayla temizleyin

---

## Aşırı ekstrüzyon

Aşırı ekstrüzyon çok geniş bir iplik üretir — yüzey gevşek, parlak veya düzensiz görünür, blobs eğilimindedir.

### Nedenler

- **Çok yüksek akış hızı** (EM — Ekstrüzyon Çarpanı)
- **Yanlış filament çapı** — 2,85 mm filament ile 1,75 mm profil büyük aşırı ekstrüzyona neden olur
- **Çok yüksek nozzle sıcaklığı** plastiği çok akışkan yapar

### Çözümler

**Akış hızı kalibrasyonu:**
```
Bambu Studio → Kalibrasyon → Akış hızı
Yüzey düzgün ve mat olana kadar %2 adımlarla azaltın
```

**Filament çapını doğrulayın:**
- Filament boyunca 5–10 noktada kumpas ile gerçek filament çapını ölçün
- 0,05 mm üzerindeki ortalama sapma düşük kaliteli filamente işaret eder

---

## Pillowing

Pillowing, üst katmanlar arasında plastik "yastıklar" ile kabarık, düzensiz üst katlardır. Özellikle düşük dolgu ve çok az üst katmanla belirgindir.

### Nedenler

- **Çok az üst katman** — dolgunun üzerindeki plastik deliklere çöker
- **Çok az soğutma** — plastik dolgu deliklerinin üzerinde köprü kuracak kadar hızlı sertleşmiyor
- **Çok düşük dolgu** — dolgunun içindeki büyük boşlukları kapatmak zordur

### Çözümler

**Üst katman sayısını artırın:**
```
Bambu Studio → Kalite → Üst kabuk katmanları
Minimum: 4 katman
Düzgün yüzey için önerilen: 5–6 katman
```

**Soğutmayı artırın:**
- PLA, 3. katmandan itibaren %100 soğutma fanına sahip olmalıdır
- Yetersiz soğutma pillowing'in en yaygın nedenidir

**Dolguyu artırın:**
- Pillowing devam ederse %10–15'ten %20–25'e çıkın
- Gyroid deseni çizgilerden daha düzgün köprü yüzeyi sağlar

:::tip Ütüleme (Ironing)
Bambu Studio'nun "ironing" işlevi, yüzeyi düzeltmek için nozzle'ı üst katman üzerinde bir kez daha geçirir. En iyi üst katman bitişi için Kalite → Ironing altında etkinleştirin.
:::

---

## Katman ayrılması (Layer separation / delamination)

Katman ayrılması, katmanların birbirine yeterince yapışmadığı durumdur. En kötü durumda baskı katman çizgileri boyunca çatlar.

### Nedenler

- **Çok düşük nozzle sıcaklığı** — plastik altındaki katmana yeterince iyi erimez
- **Çok fazla soğutma** — plastik birleşmeden önce çok hızlı sertleşir
- **Çok büyük katman kalınlığı** — nozzle çapının %80'inin üzerinde kötü füzyon oluşur
- **Çok yüksek hız** — mm yol başına azaltılmış erime süresi

### Çözümler

**Sıcaklığı artırın:**
- Standartın +10 °C üzerini deneyin ve gözlemleyin
- ABS ve ASA özellikle hassastır — kontrollü kabin ısıtması gerektirir

**Soğutmayı azaltın:**
- ABS: soğutma fanı KAPALI (%0)
- PETG: maksimum %20–40
- PLA: tam soğutmayı tolere edebilir, ancak katman ayrılması oluşursa azaltın

**Katman kalınlığı:**
- Nozzle çapının maksimum %75'ini kullanın
- 0,4 mm nozzle ile: önerilen maksimum katman yüksekliği 0,30 mm

**Kabin yeterince sıcak mı kontrol edin (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Baskı başlamadan önce kabini 40–60 °C'ye ısınmaya bırakın
— baskı sırasında kapıyı açmayın
```

---

## Genel sorun giderme ipuçları

1. **Her seferinde bir şey değiştirin** — her değişiklik arasında küçük bir kalibrasyon baskısıyla test edin
2. **Önce filamenti kurulayın** — birçok yüzey hatası aslında nem belirtisidir
3. **Nozzle'ı temizleyin** — kısmi tıkanma, teşhis edilmesi zor tutarsız yüzey hatalarına neden olur
4. **Büyük ayarlamalardan sonra** Bambu Studio bakım menüsünden tam kalibrasyon çalıştırın
5. **Bambu Dashboard'u kullanın** zamanla hangi ayarların en iyi sonucu verdiğini takip etmek için
