---
sidebar_position: 9
title: Malzeme Karşılaştırması
description: Tüm 3D baskı malzemelerini yan yana karşılaştırın — mukavemet, sıcaklık, fiyat, zorluk derecesi
---

# Malzeme Karşılaştırması

Doğru filamenti seçmek, bir iş için doğru aleti seçmek kadar önemlidir. Bu makale size tam resmi sunar — basit bir karşılaştırma tablosundan Shore sertliği, HDT değerleri ve pratik bir karar kılavuzuna kadar.

## Büyük karşılaştırma tablosu

| Malzeme | Mukavemet | Isı direnç | Esneklik | UV direnç | Kimyasal direnç | Nozzle gereksinim | Kabin | Zorluk | Fiyat |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Pirinç | Hayır | ★ Kolay | Düşük |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Pirinç | Hayır | ★★ | Düşük |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Pirinç | EVET | ★★★ | Düşük |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Pirinç | EVET | ★★★ | Orta |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Pirinç | Hayır | ★★★ | Orta |
| PA (Naylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Pirinç | EVET | ★★★★ | Yüksek |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Sertleştirilmiş çelik | EVET | ★★★★ | Yüksek |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Pirinç | EVET | ★★★★ | Yüksek |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Sertleştirilmiş çelik | Hayır | ★★ | Orta |

**Açıklama:**
- ★ = zayıf/düşük/kötü
- ★★★ = orta/standart
- ★★★★★ = mükemmel/sınıfının en iyisi

---

## Doğru malzemeyi seçin — karar kılavuzu

Ne seçeceğinizden emin değil misiniz? Bu soruları takip edin:

### Isıya dayanması gerekiyor mu?
**Evet** → ABS, ASA, PC veya PA

- Biraz ısı (~90 °C'ye kadar): **ABS** veya **ASA**
- Çok ısı (100 °C üzeri): **PC** veya **PA**
- Maksimum sıcaklık direnci: **PC** (~120 °C'ye kadar) veya **PA-CF** (~160 °C'ye kadar)

### Esnek olması gerekiyor mu?
**Evet** → **TPU**

- Çok yumuşak (lastik gibi): TPU 85A
- Standart esnek: TPU 95A
- Yarı esnek: PETG veya PA

### Dışarıda mı kullanılacak?
**Evet** → **ASA** açık seçimdir

ASA özellikle UV maruziyeti için geliştirilmiştir ve dışarıda ABS'den üstündür. ASA mevcut değilse PETG ikinci en iyi seçimdir.

### Maksimum mukavemet gerekiyor mu?
**Evet** → **PA-CF** veya **PC**

- En güçlü hafif kompozit: **PA-CF**
- En güçlü saf termoplastik: **PC**
- Daha düşük fiyata iyi mukavemet: **PA (Naylon)**

### Mümkün olan en basit baskı?
→ **PLA**

PLA, mevcut en affedici malzemedir. En düşük sıcaklık, kabin gereksinimleri yok, düşük eğilme riski.

### Gıda teması?
→ **PLA** (çekincelerle)

PLA kendi başına toksik değildir, ancak:
- Paslanmaz çelik nozzle kullanın (pirinç değil — kurşun içerebilir)
- FDM baskılar gözenekli yüzey nedeniyle asla "gıda güvenli" değildir — bakteriler büyüyebilir
- Zorlu ortamlardan kaçının (asit, sıcak su, bulaşık makinesi)
- PETG tek kullanımlık temas için daha iyi bir alternatiftir

---

## Shore sertliği açıklandı

Shore sertliği, elastomerlerin ve plastik malzemelerin sertlik ve rijitliğini tanımlamak için kullanılır. 3D baskı için TPU ve diğer esnek filamentlerde özellikle önemlidir.

### Shore A — esnek malzemeler

Shore A ölçeği 0'dan (son derece yumuşak, neredeyse jel gibi) 100'e (son derece sert lastik) kadar uzanır. 90A üzerindeki değerler katı plastik malzemelere yaklaşmaya başlar.

| Shore A değeri | Hissedilen sertlik | Örnek |
|---|---|---|
| 30A | Son derece yumuşak | Silikon, jöle |
| 50A | Çok yumuşak | Yumuşak lastik, kulak tıkaçları |
| 70A | Yumuşak | Araba lastiği, koşu ayakkabısı iç tabanı |
| 85A | Orta yumuşak | Bisiklet lastiği, yumuşak TPU filamentler |
| 95A | Yarı sert | Standart TPU filament |
| 100A ≈ 55D | Ölçekler arası sınır | — |

**TPU 95A**, 3D baskı için endüstri standardıdır ve elastikiyet ile baskı kolaylığı arasında iyi bir denge sağlar. **TPU 85A** çok yumuşaktır ve baskı sırasında daha fazla sabır gerektirir.

### Shore D — sert malzemeler

Shore D daha sert termoplastikler için kullanılır:

| Malzeme | Yaklaşık Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Naylon) | ~70–75D |

:::tip Aynı şey değil
Shore A 95 ve Shore D 40, sayılar yakın görünse de aynı şey değildir. Ölçekler farklıdır ve yalnızca 100A/55D sınırı civarında kısmen örtüşür. Tedarikçinin hangi ölçeği belirttiğini her zaman kontrol edin.
:::

---

## Sıcaklık toleransları — HDT ve VST

Bir malzemenin hangi sıcaklıkta bozulmaya başladığını bilmek, fonksiyonel parçalar için kritiktir. İki standart ölçüm kullanılır:

- **HDT (Heat Deflection Temperature)** — malzemenin standartlaştırılmış bir yük altında 0,25 mm büküldüğü sıcaklık. Yük altında kullanım sıcaklığı ölçüsü.
- **VST (Vicat Softening Temperature)** — standartlaştırılmış bir iğnenin malzemeye 1 mm battığı sıcaklık. Yüksüz mutlak yumuşama noktası ölçüsü.

| Malzeme | HDT (°C) | VST (°C) | Pratik maks. sıcaklık |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | değişir | ~60 °C |
| PA (Naylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning Sıcak ortamlarda PLA
Yazın bir arabadaki PLA parçalar bir felakettir. Park edilmiş bir arabanın ön panosu 80–90 °C'ye ulaşabilir. Güneş veya ısıda durabilecek her şey için ABS, ASA veya PETG kullanın.
:::

:::info PA varyantlarının çok farklı özellikleri vardır
PA tek bir malzeme değil, malzeme ailesidir. PA6 daha düşük HDT'ye (~70 °C) sahipken, PA12 ve PA6-CF 160–200 °C'de olabilir. Kullandığınız filament için her zaman veri sayfasını kontrol edin.
:::

---

## Nozzle gereksinimleri

### Pirinç nozzle (standart)

Karbon fiber veya cam elyafı dolgusu **olmayan** tüm malzemeler için çalışır:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Pirinç yumuşaktır ve aşındırıcı malzemelerle hızla aşınır

### Sertleştirilmiş çelik nozzle (kompozitler için zorunlu)

**ZORUNLU** şunlar için:
- PLA-CF (karbon fiber PLA)
- PETG-CF
- PA-CF
- ABS-GF (cam elyaflı ABS)
- PPA-CF, PPA-GF
- Adında "-CF", "-GF", "-HF" veya "karbon fiber" olan tüm filamentler

Sertleştirilmiş çelik, pirinçten daha düşük ısı iletkenliğine sahiptir — nozzle sıcaklığında +5–10 °C telafi edin.

:::danger Karbon fiber filamentler pirinç nozzle'ları hızla bozar
Pirinç nozzle, yalnızca birkaç yüz gram CF filamentten sonra belirgin şekilde aşınabilir. Sonuç kademeli yetersiz ekstrüzyon ve hassas olmayan boyutlardır. Kompozit baskı alıyorsanız sertleştirilmiş çeliğe yatırım yapın.
:::

---

## Kullanım alanına göre kısa malzeme özeti

| Kullanım alanı | Önerilen malzeme | Alternatif |
|---|---|---|
| Dekorasyon, figürler | PLA, PLA Silk | PETG |
| Fonksiyonel iç parçalar | PETG | PLA+ |
| Dış mekan maruziyeti | ASA | PETG |
| Esnek parçalar, kılıflar | TPU 95A | TPU 85A |
| Motor bölmesi, sıcak ortamlar | PA-CF, PC | ABS |
| Hafif, sert yapı | PLA-CF | PA-CF |
| Destek malzemesi (çözünür) | PVA | HIPS |
| Gıda teması (sınırlı) | PLA (paslanmaz çelik nozzle) | — |
| Maksimum mukavemet | PA-CF | PC |
| Şeffaf | PETG şeffaf | PC şeffaf |

Bambu Lab yazıcıları için sıcaklık ayarları, sorun giderme ve önerilen profiller hakkında ayrıntılı bilgi için bireysel malzeme makalelerine bakın.
