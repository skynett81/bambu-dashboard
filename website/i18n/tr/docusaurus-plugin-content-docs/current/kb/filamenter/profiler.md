---
sidebar_position: 8
title: Baskı Profilleri ve Ayarlar
description: Bambu Studio'da baskı profillerini anlama ve özelleştirme — hız, sıcaklık, retraksiyon ve kalite ayarları
---

# Baskı Profilleri ve Ayarlar

Baskı profili, yazıcının tam olarak nasıl çalışacağını belirleyen ayarlar bütünüdür — sıcaklık ve hızdan retraksiyona ve katman yüksekliğine kadar. Doğru profil, mükemmel bir baskı ile başarısız bir baskı arasındaki farktır.

## Baskı profili nedir?

Bambu Studio üç tür profili birbirinden ayırır:

- **Filament profili** — belirli bir malzeme için sıcaklık, soğutma, retraksiyon ve kurutma
- **İşlem profili** — katman yüksekliği, hız, dolgu ve destek ayarları
- **Yazıcı profili** — makineye özel ayarlar (Bambu Lab yazıcıları için otomatik olarak ayarlanır)

Bambu Studio, tüm Bambu Lab filamentleri ve bir dizi üçüncü taraf malzeme için genel profiller sağlar. Polyalkemi, eSUN ve Fillamentum gibi üçüncü taraf tedarikçiler, tam olarak kendi filamentleri için ince ayar yapılmış optimize edilmiş profiller de oluşturur.

Profiller, kullanıcılar arasında serbestçe içe ve dışa aktarılabilir ve paylaşılabilir.

## Bambu Studio'da profil içe aktarma

1. Profili (JSON dosyası) tedarikçinin web sitesinden veya MakerWorld'den indirin
2. Bambu Studio'yu açın
3. **Dosya → İçe Aktar → Yapılandırmayı İçe Aktar** gidin
4. İndirilen dosyayı seçin
5. Profil dilimleyicide filament seçiminin altında görünür

:::tip Organizasyon
Profillere "Polyalkemi PLA HF 0.20mm Balanced" gibi açıklayıcı isimler verin, böylece bir sonraki seferde doğru profili kolayca bulursunuz.
:::

## Önemli ayarlar açıklandı

### Sıcaklık

Sıcaklık, en önemli tek ayardır. Çok düşük sıcaklık kötü katman yapışması ve yetersiz dolguya neden olur. Çok yüksek stringing, kabarcıklı yüzey ve yanmış filamente neden olur.

| Ayar | Açıklama | Tipik PLA | Tipik PETG | Tipik ABS |
|---|---|---|---|---|
| Nozzle sıcaklığı | Erime sıcaklığı | 200–220 °C | 230–250 °C | 240–260 °C |
| Tabla sıcaklığı | Yapı plakası ısısı | 55–65 °C | 70–80 °C | 90–110 °C |
| Kabin sıcaklığı | Muhafaza sıcaklığı | Gerekli değil | İsteğe bağlı | 40–60 °C önerilen |

Bambu Lab X1C ve P1 serisi aktif kabin ısıtmasına sahiptir. ABS ve ASA için bu, eğilme ve katman ayrılmasını önlemek için kritiktir.

### Hız

Bambu Lab yazıcıları son derece hızlı çalışabilir, ancak daha yüksek hız her zaman daha iyi sonuç anlamına gelmez. Özellikle dış duvar hızı yüzeyi etkiler.

| Ayar | Neyi etkiliyor | Kalite modu | Dengeli | Hızlı |
|---|---|---|---|---|
| Dış duvar | Yüzey sonucu | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| İç duvar | Yapısal mukavemet | 100 mm/s | 150 mm/s | 200+ mm/s |
| Dolgu | İç dolgu | 150 mm/s | 200 mm/s | 300+ mm/s |
| Üst katman | Üst yüzey | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Alt katman | İlk katman | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Dış duvar hızı yüzey kalitesinin anahtarıdır
İpeksi bitiş için dış duvar hızını 45–60 mm/s'ye düşürün. Bu özellikle Silk PLA ve mat filamentler için geçerlidir. İç duvarlar ve dolgu, yüzeyi etkilemeden hızlı çalışmaya devam edebilir.
:::

### Retraksiyon (geri çekme)

Retraksiyon, yazıcı ekstrüzyon yapmadan hareket ettiğinde filamenti nozzle içinde biraz geri çeker. Bu, stringing'i (parçalar arasındaki ince iplikler) önler. Yanlış retraksiyon ayarları ya stringing'e (az) ya da tıkanmaya (çok) neden olur.

| Malzeme | Retraksiyon mesafesi | Retraksiyon hızı | Not |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Çoğu için standart |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Fazlası = tıkanma |
| ABS | 0,5–1,5 mm | 30–50 mm/s | PLA'ya benzer |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimum! Veya devre dışı bırakın |
| Naylon | 1,0–2,0 mm | 30–40 mm/s | Kuru filament gerektirir |

:::warning TPU retraksiyonu
TPU ve diğer esnek malzemeler için: minimum retraksiyon (0–1 mm) kullanın veya tamamen devre dışı bırakın. Fazla retraksiyon, yumuşak filamentin Bowden borusunda bükülmesine ve tıkanmasına neden olur.
:::

### Katman yüksekliği

Katman yüksekliği, detay düzeyi ile baskı hızı arasındaki dengeyi belirler. Düşük katman yüksekliği daha ince detaylar ve daha düzgün yüzeyler verir, ancak çok daha uzun sürer.

| Katman yüksekliği | Açıklama | Kullanım alanı |
|---|---|---|
| 0,08 mm | Ultra ince | Minyatür figürler, detaylı modeller |
| 0,12 mm | İnce | Görsel kalite, metin, logolar |
| 0,16 mm | Yüksek kalite | Çoğu baskı için standart |
| 0,20 mm | Dengeli | İyi süre/kalite dengesi |
| 0,28 mm | Hızlı | Fonksiyonel parçalar, prototipler |

Bambu Studio, "0.16mm High Quality" ve "0.20mm Balanced Quality" gibi işlem ayarlarıyla çalışır — bunlar katman yüksekliğini ayarlar ve hız ile soğutmayı otomatik olarak uyarlar.

### Dolgu (Infill)

Dolgu, baskının içini dolduran malzeme miktarını belirler. Daha fazla dolgu = daha güçlü, daha ağır ve daha uzun baskı süresi.

| Yüzde | Kullanım alanı | Önerilen desen |
|---|---|---|
| %10–15 | Dekorasyon, görsel | Gyroid |
| %20–30 | Genel kullanım | Cubic, Gyroid |
| %40–60 | Fonksiyonel parçalar | Cubic, Honeycomb |
| %80–100 | Maksimum mukavemet | Rectilinear |

:::tip Gyroid kraldır
Gyroid deseni en iyi mukavemet-ağırlık oranını sağlar ve izotropiktir — tüm yönlerde eşit güçlü. Ayrıca honeycomb'dan daha hızlı baskı alır ve açık modellerde iyi görünür. Çoğu durum için standart seçim.
:::

## Malzemeye göre profil ipuçları

### PLA — kalite odaklı

PLA affedicidir ve çalışması kolaydır. Yüzey kalitesine odaklanın:

- **Dış duvar:** Mükemmel yüzey için 60 mm/s, özellikle Silk PLA ile
- **Soğutma fanı:** 3. katmandan sonra %100 — keskin detaylar ve köprüler için kritik
- **Brim:** Doğru kalibre edilmiş plakayla saf PLA için gerekli değil
- **Katman yüksekliği:** 0,16 mm High Quality, dekoratif parçalar için iyi denge sağlar

### PETG — denge

PETG, PLA'dan daha güçlüdür ancak ince ayar için daha zorludur:

- **İşlem ayarı:** 0,16 mm High Quality veya 0,20 mm Balanced Quality
- **Soğutma fanı:** %30–50 — çok fazla soğutma kötü katman yapışması ve kırılgan baskılara neden olur
- **Z-hop:** Hareket sırasında nozzle'ın yüzeyde sürüklenmesini önlemek için etkinleştirin
- **Stringing:** Daha soğuk değil, biraz daha sıcak bastırarak retraksiyonu ayarlayın

### ABS — kabin her şeydir

ABS iyi baskı alır, ancak kontrollü ortam gerektirir:

- **Soğutma fanı:** KAPALI (%0) — kesinlikle kritik! Soğutma katman ayrılmasına ve eğilmeye neden olur
- **Kabin:** Kapıları kapatın ve baskı başlamadan önce kabinin 40–60 °C'ye ısınmasına izin verin
- **Brim:** Büyük ve düz parçalar için 5–8 mm önerilir — köşelerde eğilmeyi önler
- **Havalandırma:** Odada iyi havalandırma sağlayın — ABS stiren buharları yayar

### TPU — yavaş ve dikkatli

Esnek malzemeler tamamen farklı bir yaklaşım gerektirir:

- **Hız:** Maks. 30 mm/s — çok hızlı baskı filamentin bükülmesine neden olur
- **Retraksiyon:** Minimum (0–1 mm) veya tamamen devre dışı
- **Direct drive:** TPU yalnızca yerleşik direct drive ile Bambu Lab makinelerinde çalışır
- **Katman yüksekliği:** 0,20 mm Balanced, aşırı gerilme olmadan iyi katman füzyonu sağlar

### Naylon — kuru filament her şeydir

Naylon higroskopiktir ve saatler içinde nem emer:

- **Her zaman kurutun:** Baskıdan önce 70–80 °C'de 8–12 saat
- **Kabin:** Filamenti kuru tutmak için kurutucudan doğrudan AMS'ye yazdırın
- **Retraksiyon:** Orta düzey (1,0–2,0 mm) — nemli naylon çok daha fazla stringing üretir
- **Yapı plakası:** En iyi yapışma için yapıştırıcılı Engineering Plate veya Garolite plaka

## Bambu Lab ön ayarları

Bambu Studio, tüm Bambu Lab ürün ailesi için yerleşik profillere sahiptir:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Bambu Lab Destek malzemeleri (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Üçüncü taraf filamentler için başlangıç noktası olarak işlev gören Genel profiller (Generic PLA, Generic PETG, vb.)

Genel profiller iyi bir başlangıç noktasıdır. Gerçek filamene göre ±5 °C sıcaklık ayarlayın.

## Üçüncü taraf profilleri

Birçok önde gelen tedarikçi, tam olarak kendi filamentleri için optimize edilmiş hazır Bambu Studio profilleri sunar:

| Tedarikçi | Mevcut profiller | İndir |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Bambu Lab profilleri](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [eSUN profilleri](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Fillamentum profilleri](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Spectrum profilleri](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Fiberlogy profilleri](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [add:north profilleri](https://addnorth.com/printing-profiles) |

:::info Profiller nerede bulunur?
- **Bambu Studio:** Bambu Lab malzemeleri ve birçok üçüncü taraf için yerleşik profiller
- **Tedarikçinin web sitesi:** İndirmeler bölümünde "Bambu Studio profile" veya "JSON profile" arayın
- **Bambu Dashboard:** Araçlar bölümündeki Baskı Profilleri panelinde
- **MakerWorld:** Profiller genellikle diğer kullanıcılar tarafından modellerle birlikte paylaşılır
:::

## Profilleri dışa aktarma ve paylaşma

Kendi profilleriniz dışa aktarılabilir ve başkalarıyla paylaşılabilir:

1. **Dosya → Dışa Aktar → Yapılandırmayı Dışa Aktar** gidin
2. Hangi profilleri (filament, işlem, yazıcı) dışa aktarmak istediğinizi seçin
3. JSON dosyası olarak kaydedin
4. Dosyayı doğrudan paylaşın veya MakerWorld'e yükleyin

Bu, zaman içinde bir profili ince ayar yaptıysanız ve Bambu Studio'yu yeniden yüklediğinizde korumak istiyorsanız özellikle kullanışlıdır.

---

## Profillerde sorun giderme

### Stringing

Baskılı parçalar arasındaki ince iplikler — bu sırayla deneyin:

1. Retraksiyon mesafesini 0,5 mm artırın
2. Baskı sıcaklığını 5 °C düşürün
3. "Wipe on retract" etkinleştirin
4. Filamentin kuru olup olmadığını kontrol edin

### Yetersiz dolgu / duvarlarda delikler

Baskı katı görünmüyor veya deliklere sahip:

1. Filament çapı ayarının doğru olup olmadığını kontrol edin (1,75 mm)
2. Bambu Studio'da akış hızını kalibre edin (Kalibrasyon → Akış Hızı)
3. Sıcaklığı 5 °C artırın
4. Kısmi nozzle tıkanması olup olmadığını kontrol edin

### Kötü katman yapışması

Katmanlar birbirine iyi yapışmıyor:

1. Sıcaklığı 5–10 °C artırın
2. Soğutma fanını azaltın (özellikle PETG ve ABS)
3. Baskı hızını azaltın
4. Kabinin yeterince sıcak olup olmadığını kontrol edin (ABS/ASA için)
