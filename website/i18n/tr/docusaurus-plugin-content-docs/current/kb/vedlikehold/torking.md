---
sidebar_position: 5
title: Filament Kurutma
description: Filamenti neden, ne zaman ve nasıl kurutacaksınız — tüm malzemeler için sıcaklıklar, süreler ve depolama ipuçları
---

# Filament Kurutma

Nemli filament, kötü baskıların en yaygın ve en çok göz ardı edilen nedenlerinden biridir. Kuru görünen filament bile sonucu mahvedecek kadar nem emmiş olabilir — özellikle naylon ve PVA gibi malzemeler için.

## Filamenti neden kurutmalısınız?

Birçok plastik türü **higroskopiktir** — zamanla havadan nem emirler. Nemli filament sıcak nozzle'dan geçtiğinde, su aniden buharlaşır ve erimiş plastik içinde mikro kabarcıklar oluşturur. Sonuç:

- Baskı sırasında **çıtırtı ve patlama sesleri**
- Nozzle'dan görünür **buğu veya buhar**
- Ayarlarla giderilemeyen **stringing ve hairing**
- Üst katlarda özellikle belirgin **pürüzlü veya taneli yüzey**
- Zayıf katman yapışması ve mikro çatlaklarla **zayıf parçalar**
- Normalde parlak veya ipek görünmesi gereken malzemelerde **mat veya donuk bitiriş**

:::warning Ayarları düzenlemeden ÖNCE filamenti kurutun
Birçok kişi nemli filament nedeniyle iyileşme görmeksizin saatlerce retraksiyon ve sıcaklık ayarı yapar. Baskı ayarlarını değiştirmeden önce her zaman filamenti kurutun ve yeniden test edin.
:::

## Hangi malzemelerin kurutulması gerekir?

Tüm plastik türleri nemlenebilir, ancak higroskopiklik derecesi büyük farklılıklar gösterir:

| Malzeme | Higroskopik | Kurutma sıcaklığı | Kurutma süresi | Öncelik |
|---|---|---|---|---|
| PLA | Düşük | 45–50 °C | 4–6 saat | İsteğe bağlı |
| PETG | Orta | 65 °C | 4–6 saat | Önerilen |
| ABS | Orta | 65–70 °C | 4 saat | Önerilen |
| TPU | Orta | 50–55 °C | 4–6 saat | Önerilen |
| ASA | Orta | 65 °C | 4 saat | Önerilen |
| PC | Yüksek | 70–80 °C | 6–8 saat | Gerekli |
| PA/Nylon | Aşırı yüksek | 70–80 °C | 8–12 saat | GEREKLİ |
| PA-CF | Aşırı yüksek | 70–80 °C | 8–12 saat | GEREKLİ |
| PVA | Aşırı yüksek | 45–50 °C | 4–6 saat | GEREKLİ |

:::tip Naylon ve PVA kritiktir
PA/Naylon ve PVA, normal iç mekân iklimiyle **birkaç saat** içinde baskı yapılamaz hale gelecek kadar nem emebilir. Bu malzemelerin yeni bir makarasını kurutmadan asla açmayın — ve her zaman kapalı bir kutu veya kurutucudan baskı alın.
:::

## Nemli filament belirtileri

Filamenti her zaman bir tabloya göre kurutmanız gerekmez. Belirtileri tanımayı öğrenin:

| Belirti | Nem? | Diğer olası nedenler |
|---|---|---|
| Çıtırtı/patlama sesleri | Evet, çok muhtemel | Kısmen tıkalı nozzle |
| Nozzle'dan buğu/buhar | Evet, neredeyse kesin | Başka neden yok |
| Pürüzlü, taneli yüzey | Evet, mümkün | Çok düşük sıcaklık, çok yüksek hız |
| Kaybolmayan stringing | Evet, mümkün | Yanlış retraksiyon, çok yüksek sıcaklık |
| Zayıf, kırılgan parçalar | Evet, mümkün | Çok düşük sıcaklık, yanlış dolgu |
| Renk değişimi veya mat bitiriş | Evet, mümkün | Yanlış sıcaklık, yanmış plastik |

## Kurutma yöntemleri

### Filament kurutucu (önerilen)

Özel filament kurutucular en basit ve güvenli çözümdür. Hassas sıcaklık tutarlar ve tüm iş boyunca doğrudan kurutucudan baskı almanıza izin verirler.

Popüler modeller:
- **eSun eBOX** — uygun fiyatlı, kutudan baskı alabilir, çoğu malzemeyi destekler
- **Bambu Lab Filament Dryer** — Bambu AMS için optimize edilmiş, yüksek sıcaklıkları destekler
- **Polymaker PolyDryer** — iyi termometre ve iyi sıcaklık kontrolü
- **Sunlu S2 / S4** — bütçe dostu, aynı anda birden fazla makara

İşlem:
```
1. Makaraları kurutucuya yerleştirin
2. Yukarıdaki tablodan sıcaklığı ayarlayın
3. Önerilen süre için zamanlayıcı ayarlayın
4. Bekleyin — işlemi erken kesmeyin
5. Doğrudan kurutucudan baskı alın veya hemen paketleyin
```

### Gıda kurutucu

Sıradan bir gıda kurutucu, filament kurutucu olarak şaşırtıcı derecede iyi çalışır:

- Satın almak için uygun fiyatlı
- İyi hava sirkülasyonu
- Birçok modelde 70–75 °C'ye kadar sıcaklıkları destekler

:::warning Kurutucunuzun maksimum sıcaklığını kontrol edin
Birçok ucuz gıda kurutucusu hassas olmayan termostatlarına sahiptir ve ±10 °C değişebilir. Yüksek ısı gerektiren PA ve PC için bir termometre ile gerçek sıcaklığı ölçün.
:::

### Fırın

Mutfak fırını acil durumlarda kullanılabilir, ancak dikkat gerektirir:

:::danger PLA için 60 °C üzerinde ASLA normal fırın kullanmayın — deforme olur!
PLA 55–60 °C'de zaten yumuşamaya başlar. Sıcak bir fırın makaraları hasar görebilir, çekirdeği eritebilir ve filamenti kullanılamaz hale getirebilir. Sıcaklığın 50 °C'nin altında hassasça kalibre edildiğinden emin olmadıkça PLA için asla fırın kullanmayın.
:::

Daha yüksek sıcaklıklara dayanabilen malzemeler için (ABS, ASA, PA, PC):
```
1. Fırını istenen sıcaklığa önceden ısıtın
2. Gerçek sıcaklığı doğrulamak için termometre kullanın
3. Makaraları bir ızgaraya yerleştirin (doğrudan fırın tabanına değil)
4. Nemi dışarı atmak için kapıyı aralık bırakın
5. Bu yöntemi ilk kez kullanırken gözetleyin
```

### Bambu Lab AMS

Bambu Lab AMS Lite ve AMS Pro yerleşik kurutma işlevine (düşük ısı + hava sirkülasyonu) sahiptir. Bu, tam kurutmanın yerini tutmaz, ancak baskı sırasında zaten kurutulmuş filamenti kuru tutar.

- AMS Lite: Pasif kurutma — nem emmeyi sınırlar, aktif olarak kurutmaz
- AMS Pro: Aktif ısıtma — bir miktar kurutma mümkün, ancak özel kurutucu kadar etkili değil

## Filament depolama

Kurutma sonrası doğru depolama, kurutma işleminin kendisi kadar önemlidir:

### En iyi çözümler

1. **Silika jelli kurutma dolabı** — higrometreli ve kurutuculu özel dolap. Nemi kararlı biçimde düşük tutar (ideal olarak %20 RH'nin altında)
2. **Vakum torbalar** — havayı çekip içinde kurutucu ile mühürleyin. En ucuz uzun vadeli depolama
3. **Ziplock torbalar ve kurutucu** — daha kısa süreler için basit ve etkili

### Silika jel ve kurutucular

- **Mavi/turuncu silika jel** doygunluk derecesini gösterir — renk değiştiğinde değiştirin veya yenileyin (120 °C'de fırında kurutun)
- **Granül silika jel** granülattan daha etkilidir
- **Filament üreticilerinin kurutucu paketleri** yenilenebilir ve yeniden kullanılabilir

### Depolama kutusunda higrometre

Ucuz bir dijital higrometre kutudaki gerçek nem oranını gösterir:

| Bağıl nem (RH) | Durum |
|---|---|
| %15'in altında | İdeal |
| %15–30 | Çoğu malzeme için iyi |
| %30–50 | PLA ve PETG için kabul edilebilir |
| %50'nin üzerinde | Sorunlu — özellikle PA, PVA, PC için |

## Pratik ipuçları

- **Baskıdan hemen ÖNCE kurutun** — kurutulmuş filament normal iç mekân iklimiyle günler içinde tekrar nemlenebilir
- PA, PC ve PVA için **kurutucudan baskı alın** — sadece kurutup kenara koymayın
- **Yeni makara ≠ kuru makara** — üreticiler kurutucu ile mühürler, ancak depolama zinciri başarısız olmuş olabilir. Higroskopik malzemelerin yeni makaralarını her zaman kurutun
- Kurutulmuş makaraları **kurutma tarihi** ile işaretleyin
- Kurutucu ile yazıcı arasında **özel PTFE boru**, baskı sırasında maruziyeti en aza indirir

## Bambu Dashboard ve kurutma durumu

Bambu Dashboard, filament profillerinde son kurutma tarihi dahil filament bilgilerini kaydetmenize olanak tanır. Hangi makaraların taze kurutulmuş, hangilerinin yeni bir tura ihtiyaç duyduğunu takip etmek için bunu kullanın.
