---
sidebar_position: 7
title: Özel Malzemeler
description: ASA, PC, PP, PVA, HIPS ve gelişmiş uygulamalar için diğer özel malzemeler
---

# Özel Malzemeler

Yaygın malzemelerin ötesinde, belirli kullanım durumları için bir dizi özel malzeme mevcuttur — UV dayanımlı dış mekan parçalarından suda çözünür destek malzemesine kadar. İşte pratik bir genel bakış.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA, dış mekan kullanımı için ABS'nin en iyi alternatifidir. ABS'ye neredeyse özdeş şekilde baskı alır, ancak güneş ışığını ve hava koşullarını çok daha iyi tolere eder.

### Ayarlar

| Parametre | Değer |
|-----------|-------|
| Nozzle sıcaklığı | 240–260 °C |
| Tabla sıcaklığı | 90–110 °C |
| Kabin sıcaklığı | 45–55 °C |
| Parça soğutma | %0–20 |
| Kurutma | Önerilen (70 °C / 4–6 sa) |

### Özellikler

- **UV dayanımlı:** Uzun süreli güneş maruziyeti için sararmadan veya çatlamadan özel olarak tasarlanmıştır
- **Isıya kararlı:** Cam geçiş sıcaklığı ~100 °C
- **Darbeye dayanıklı:** ABS'den daha iyi darbe dayanımı
- **Kabin gerekli:** ABS ile aynı şekilde eğilir — X1C/P1S en iyi sonuçları verir

:::tip Dışarıda ABS yerine ASA
Parça Avrupa iklimiyle dışarıda mı yaşayacak (güneş, yağmur, don)? ABS yerine ASA seçin. ASA yıllarca görünür bozunma olmadan dayanır. ABS aylar içinde çatlamaya ve sararmaya başlar.
:::

### Kullanım alanları
- Dış mekan braketleri, muhafazalar ve bağlantı noktaları
- Araç aerodinamik parçaları, anten tutucuları
- Bahçe mobilyaları ve dış mekan ortamları
- Binaların dışındaki tabelalar ve dağıtıcılar

---

## PC (Polikarbonat)

Polikarbonat, 3D baskı yapılabilen en güçlü ve darbeye dayanıklı plastiklerden biridir. Şeffaftır ve aşırı sıcaklıklara dayanır.

### Ayarlar

| Parametre | Değer |
|-----------|-------|
| Nozzle sıcaklığı | 260–310 °C |
| Tabla sıcaklığı | 100–120 °C |
| Kabin sıcaklığı | 50–70 °C |
| Parça soğutma | %0–20 |
| Kurutma | Gerekli (80 °C / 8–12 sa) |

:::danger PC all-metal hotend ve yüksek sıcaklık gerektirir
PC standart PLA sıcaklıklarında erimez. Doğru nozzle kurulumuna sahip Bambu X1C, PC'yi kaldırır. Hotend'deki PTFE bileşenlerinin sıcaklığınıza dayanıp dayanamayacağını her zaman kontrol edin — standart PTFE sürekli 240–250 °C'nin üzerine dayanamaz.
:::

### Özellikler

- **Çok darbeye dayanıklı:** Düşük sıcaklıklarda bile kırılmaya karşı dirençlidir
- **Şeffaf:** Pencereler, lensler ve optik bileşenler için kullanılabilir
- **Isıya kararlı:** Cam geçiş sıcaklığı ~147 °C — yaygın malzemelerin en yükseği
- **Higroskopik:** Nemi hızla emer — her zaman iyice kurutun
- **Eğilme:** Güçlü büzülme — kabin ve brim gerektirir

### Kullanım alanları
- Güvenlik siperliği ve koruyucu kapaklar
- Isıya dayanıklı elektrik muhafazaları
- Lens tutucuları ve optik bileşenler
- Robot çerçeveleri ve dron gövdeleri

---

## PP (Polipropilen)

Polipropilen, baskı yapılması en zor malzemelerden biridir, ancak başka hiçbir plastik malzemenin sağlayamayacağı benzersiz özellikler sunar.

### Ayarlar

| Parametre | Değer |
|-----------|-------|
| Nozzle sıcaklığı | 220–250 °C |
| Tabla sıcaklığı | 80–100 °C |
| Parça soğutma | %20–50 |
| Kurutma | Önerilen (70 °C / 6 sa) |

### Özellikler

- **Kimyasal dirençli:** Güçlü asitlere, bazlara, alkole ve çoğu çözücüye dayanır
- **Hafif ve esnek:** Düşük yoğunluk, tekrarlanan bükülmeye dayanır (canlı menteşe etkisi)
- **Düşük yapışma:** Kendisine ve yapı plakasına kötü yapışır — zorluk budur
- **Toksik değil:** Gıda teması için güvenli (renge ve katkı maddelerine bağlı)

:::warning PP her şeye kötü yapışır
PP, yapı plakasına yapışmamasıyla ünlüdür. Engineering Plate üzerinde PP bandı (Tesa bandı veya özel PP bandı gibi) kullanın ya da PP için özel formüle edilmiş yapıştırıcı kalemi kullanın. 15–20 mm brim gereklidir.
:::

### Kullanım alanları
- Laboratuvar şişeleri ve kimyasal kaplar
- Gıda depolama ve mutfak ekipmanları
- Canlı menteşeler (binlerce açma/kapama döngüsüne dayanıklı kutu kapakları)
- Kimyasallara dayanıklı otomotiv bileşenleri

---

## PVA (Polyvinyl Alcohol) — suda çözünür destek malzemesi

PVA, yalnızca destek malzemesi olarak kullanılan özel bir malzemedir. Suda çözünür ve model üzerinde temiz bir yüzey bırakır.

### Ayarlar

| Parametre | Değer |
|-----------|-------|
| Nozzle sıcaklığı | 180–220 °C |
| Tabla sıcaklığı | 35–60 °C |
| Kurutma | Kritik (55 °C / 6–8 sa) |

:::danger PVA son derece higroskopiktir
PVA, diğer yaygın filamentlerden daha hızlı nem emer. Baskıdan ÖNCE PVA'yı iyice kurutun ve her zaman silika jelli kapalı kutuda saklayın. Nemli PVA nozzle'da yapışır ve çıkarmak çok zordur.
:::

### Kullanım ve çözme

1. PVA'yı destek malzemesi olarak kullanarak modeli baskı alın (çok malzemeli yazıcı gerektirir — AMS)
2. Bitmiş baskıyı ılık suya (30–40 °C) koyun
3. Gerekirse suyu değiştirerek 30–120 dakika bekleyin
4. Temiz suyla durulayın ve kurumaya bırakın

Mümkünse **PVA için her zaman özel bir ekstrüder kullanın** — standart bir ekstrüderdeki PVA kalıntıları bir sonraki baskıyı mahvedebilir.

### Kullanım alanları
- Manuel olarak çıkarılması imkânsız karmaşık destek yapıları
- Yüzeyde belirgin iz bırakmadan iç askı desteği
- Boşlukları ve iç kanalları olan modeller

---

## HIPS (High Impact Polystyrene) — çözücüde çözünür destek malzemesi

HIPS, ABS ile kullanılmak üzere tasarlanmış başka bir destek malzemesidir. **Limonende** (narenciye çözücüsü) çözünür.

### Ayarlar

| Parametre | Değer |
|-----------|-------|
| Nozzle sıcaklığı | 220–240 °C |
| Tabla sıcaklığı | 90–110 °C |
| Kabin sıcaklığı | 45–55 °C |
| Kurutma | Önerilen (65 °C / 4–6 sa) |

### ABS ile kullanım

HIPS, ABS ile aynı sıcaklıklarda baskı alır ve ona iyi yapışır. Baskı sonrası HIPS, baskıyı D-limonene 30–60 dakika bırakarak çözülür.

:::warning Limonene su değildir
D-limonene, portakal kabuklarından elde edilen bir çözücüdür. Görece zararsızdır, ancak yine de eldiven kullanın ve havalandırmalı ortamda çalışın. Kullanılmış limoneni lavaboya dökmeyın — atık toplama merkezine götürün.
:::

### Karşılaştırma: PVA vs HIPS

| Özellik | PVA | HIPS |
|----------|-----|------|
| Çözücü | Su | D-limonene |
| Uyumlu malzeme | PLA uyumlu | ABS uyumlu |
| Nem hassasiyeti | Son derece yüksek | Orta |
| Maliyet | Yüksek | Orta |
| Bulunabilirlik | İyi | Orta |

---

## PVB / Fibersmooth — etanol ile düzeltilebilen malzeme

PVB (Polyvinyl Butyral), **etanol (alkol) ile düzeltilebilen** benzersiz bir malzemedir — ABS'nin aseton ile düzeltilebilmesine benzer şekilde, ancak çok daha güvenli.

### Ayarlar

| Parametre | Değer |
|-----------|-------|
| Nozzle sıcaklığı | 190–210 °C |
| Tabla sıcaklığı | 35–55 °C |
| Parça soğutma | %80–100 |
| Kurutma | Önerilen (55 °C / 4 sa) |

### Etanol ile düzeltme

1. Standart PVB ayarlarında modeli baskı alın
2. Fırça ile %99 izopropil alkol (IPA) veya etanol sürün
3. 10–15 dakika kurumaya bırakın — yüzey düzgün şekilde akar
4. Daha düzgün yüzey için gerekirse tekrarlayın
5. Alternatif: Sürun ve buhar işlemi için 5 dakika kapalı kapta bırakın

:::tip Asetona göre daha güvenli
IPA/etanol, asetondan çok daha güvenli kullanılır. Parlama noktası daha yüksek ve buharları çok daha az toksiktir. Yine de iyi havalandırma önerilir.
:::

### Kullanım alanları
- Düz yüzeyin istendiği figürler ve dekorasyonlar
- Sunum için prototipler
- Boyanacak parçalar — düzgün yüzey daha iyi boya sağlar

---

## Özel malzemeler için önerilen yapı plakaları

| Malzeme | Önerilen plaka | Yapıştırıcı kalemi? |
|---------|---------------|---------------------|
| ASA | Engineering Plate / High Temp Plate | Evet |
| PC | High Temp Plate | Evet (gerekli) |
| PP | Engineering Plate + PP bandı | PP'ye özel bant |
| PVA | Cool Plate / Textured PEI | Hayır |
| HIPS | Engineering Plate / High Temp Plate | Evet |
| PVB | Cool Plate / Textured PEI | Hayır |
