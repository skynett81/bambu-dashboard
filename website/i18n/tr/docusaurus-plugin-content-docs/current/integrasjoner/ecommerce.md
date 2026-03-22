---
sidebar_position: 5
title: E-Ticaret
description: 3D baskı satışı için siparişleri, müşterileri ve faturalamayı yönetin — geektech.no'dan lisans gerektirir
---

# E-Ticaret

E-ticaret modülü, müşterileri, siparişleri ve faturalamayı yönetmek için eksiksiz bir sistem sunar — 3D baskıları profesyonel veya yarı profesyonel olarak satanlar için mükemmeldir.

Gidin: **https://localhost:3443/#orders**

:::danger E-Ticaret Lisansı Gereklidir
E-ticaret modülü geçerli bir lisans gerektirir. Lisanslar **yalnızca [geektech.no](https://geektech.no) üzerinden satın alınabilir**. Aktif lisans olmadan modül kilitlidir ve kullanılamaz.
:::

## Lisans — Satın Alma ve Aktivasyon

### Lisans Satın Alma

1. **[geektech.no](https://geektech.no)** adresine gidin ve bir hesap oluşturun
2. **Bambu Dashboard — E-Ticaret Lisansı**'nı seçin
3. Lisans türünü seçin:

| Lisans Türü | Açıklama | Yazıcılar |
|---|---|---|
| **Hobi** | Bir yazıcı, kişisel kullanım ve küçük satışlar | 1 |
| **Profesyonel** | 5 adede kadar yazıcı, ticari kullanım | 1–5 |
| **Kurumsal** | Sınırsız sayıda yazıcı, tam destek | Sınırsız |

4. Ödemeyi tamamlayın
5. E-posta ile bir **lisans anahtarı** alırsınız

### Lisans Aktivasyonu

1. Panoda **Ayarlar → E-Ticaret**'e gidin
2. Aşağıdaki alanları doldurun:

| Alan | Açıklama | Zorunlu |
|------|----------|---------|
| **Lisans anahtarı** | geektech.no'dan 32 karakterli onaltılık anahtar | ✅ Evet |
| **E-posta adresi** | Satın alma sırasında kullandığınız e-posta | ✅ Evet |
| **Alan adı** | Panonun çalıştığı alan adı (https:// olmadan) | Önerilen |
| **Telefon** | İletişim telefonu (ülke kodu ile, ör. +90) | İsteğe bağlı |

### Lisans Türü — Tanımlayıcı Bağlama

geektech.no, lisansı bir veya daha fazla tanımlayıcıya bağlar:

| Tür | Doğrulama Hedefi | Kullanım Durumu |
|-----|-----------------|----------------|
| **Alan adı** | Alan adı (ör. `dashboard.sirket.com.tr`) | Kendi alan adına sahip sabit sunucu |
| **IP** | Genel IP adresi/adresleri | Alan adı olmayan sunucu, sabit IP |
| **MAC** | Ağ kartının MAC adresi/adresleri | Donanım bağlama |
| **IP + MAC** | Hem IP hem MAC eşleşmeli | En yüksek güvenlik |

:::info Otomatik Tanımlama
Pano, her doğrulamada sunucunun IP adresini ve MAC adresini otomatik olarak gönderir. Bunları manuel olarak girmeniz gerekmez — geektech.no ilk aktivasyonda kaydeder.
:::

Birden fazla IP adresi ve MAC adresine izin verilebilir (geektech.no admin'de satır başına bir tane). Bu, birden fazla ağ kartı veya dinamik IP'ye sahip sunucular için kullanışlıdır.

3. **Lisansı Etkinleştir**'e tıklayın
4. Pano, geektech.no'ya aktivasyon isteği gönderir
5. Başarılı aktivasyonda şunlar gösterilir:
   - **Lisans türü** (Hobi / Profesyonel / Kurumsal)
   - **Son kullanma tarihi**
   - **Maksimum yazıcı sayısı**
   - **Lisans sahibi**
   - **Örnek Kimliği** (kurulumunuza özgü)

:::warning Lisans Anahtarı Alan Adınıza ve Kurulumunuza Bağlıdır
Anahtar, belirli bir Bambu Dashboard kurulumu ve alan adı için etkinleştirilir. Aşağıdaki durumlarda [geektech.no](https://geektech.no) desteğiyle iletişime geçin:
- Lisansı yeni bir sunucuya taşımak
- Alan adını değiştirmek
- Yazıcı sayısını artırmak
:::

### Lisans Doğrulaması

Lisans, geektech.no ile kimlik doğrulaması ve senkronizasyon yapar:

- **Başlangıçta doğrulama** — lisans otomatik olarak kontrol edilir
- **Sürekli doğrulama** — geektech.no'ya karşı her 24 saatte bir yeniden doğrulanır
- **Çevrimdışı mod** — ağ kesintisinde lisans, önbelleğe alınmış doğrulama ile en fazla **7 gün** çalışır
- **Süresi dolmuş lisans** → modül kilitlenir, ancak mevcut veriler (siparişler, müşteriler) korunur
- **PIN kodu** — geektech.no, PIN sistemi aracılığıyla lisansı kilitleyebilir/açabilir
- **Yenileme** — **[geektech.no](https://geektech.no)** → Lisanslarım → Yenile üzerinden

### Lisans Türleri ve Kısıtlamalar

| Plan | Yazıcılar | Platformlar | Ücret | Fiyat |
|------|-----------|-------------|-------|-------|
| **Hobi** | 1 | 1 (Shopify VEYA WooCommerce) | 5% | geektech.no'ya bakın |
| **Profesyonel** | 1–5 | Tümü | 5% | geektech.no'ya bakın |
| **Kurumsal** | Sınırsız | Tümü + API | 3% | geektech.no'ya bakın |

### Lisans Durumunu Kontrol Etme

**Ayarlar → E-Ticaret**'e gidin veya API'yi çağırın:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

Yanıt şunları içerir:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Şirket Adı",
  "email": "sirket@ornek.com.tr",
  "domain": "dashboard.sirketadi.com.tr",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Müşteriler

### Müşteri Oluşturma

1. **E-Ticaret → Müşteriler**'e gidin
2. **Yeni Müşteri**'ye tıklayın
3. Doldurun:
   - **Ad / Şirket Adı**
   - **İlgili Kişi** (şirketler için)
   - **E-posta adresi**
   - **Telefon**
   - **Adres** (fatura adresi)
   - **Vergi numarası / Kimlik numarası** (isteğe bağlı, KDV mükellefleri için)
   - **Not** — dahili not
4. **Oluştur**'a tıklayın

### Müşteri Genel Bakışı

Müşteri listesi şunları gösterir:
- Ad ve iletişim bilgileri
- Toplam sipariş sayısı
- Toplam gelir
- Son sipariş tarihi
- Durum (Aktif / Pasif)

Tüm sipariş ve fatura geçmişini görmek için bir müşteriye tıklayın.

## Sipariş Yönetimi

### Sipariş Oluşturma

1. **E-Ticaret → Siparişler**'e gidin
2. **Yeni Sipariş**'e tıklayın
3. Listeden **Müşteri** seçin
4. Sipariş satırları ekleyin:
   - Dosya kütüphanesinden dosya/model seçin veya serbest metin girişi ekleyin
   - Adet ve birim fiyatını belirtin
   - Projeye bağlıysa sistem maliyeti otomatik olarak hesaplar
5. **Teslim Tarihi**'ni belirtin (tahmini)
6. **Sipariş Oluştur**'a tıklayın

### Sipariş Durumu

| Durum | Açıklama |
|---|---|
| Talep | Talep alındı, onaylanmadı |
| Onaylandı | Müşteri onayladı |
| Üretimde | Baskılar devam ediyor |
| Teslime Hazır | Tamamlandı, teslim/gönderim bekliyor |
| Teslim Edildi | Sipariş tamamlandı |
| İptal Edildi | Müşteri veya siz tarafından iptal edildi |

Siparişe tıklayarak durumu güncelleyin → **Durumu Değiştir**.

### Baskıları Siparişe Bağlama

1. Siparişi açın
2. **Baskı Bağla**'ya tıklayın
3. Geçmişten baskıları seçin (çoklu seçim desteklenir)
4. Maliyet verileri baskı geçmişinden otomatik olarak alınır

## Faturalama

Ayrıntılı faturalama dokümantasyonu için [Projeler → Faturalama](../funksjoner/projects#fakturering) sayfasına bakın.

Fatura doğrudan bir siparişten oluşturulabilir:

1. Siparişi açın
2. **Fatura Oluştur**'a tıklayın
3. Tutarı ve KDV'yi kontrol edin
4. PDF'yi indirin veya müşterinin e-postasına gönderin

### Fatura Numarası Serisi

**Ayarlar → E-Ticaret** altında fatura numarası serisi ayarlayın:
- **Önek**: örn. `2026-`
- **Başlangıç numarası**: örn. `1001`
- Fatura numarası otomatik olarak artan sırada atanır

## Raporlama ve Ücretler

### Ücret Raporlaması

Sistem tüm işlem ücretlerini takip eder:
- **E-Ticaret → Ücretler** altında ücretleri görün
- Muhasebe amaçları için ücretleri raporlandı olarak işaretleyin
- Dönem başına ücret özetini dışa aktarın

### İstatistikler

**E-Ticaret → İstatistikler** altında:
- Aylık gelir (sütun grafiği)
- Gelire göre en iyi müşteriler
- En çok satılan modeller/malzemeler
- Ortalama sipariş büyüklüğü

Muhasebe sistemine aktarmak için CSV'ye dışa aktarın.

## Destek ve İletişim

:::info Yardıma mı İhtiyacınız Var?
- **Lisans soruları**: [geektech.no](https://geektech.no) desteğiyle iletişime geçin
- **Teknik sorunlar**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Özellik istekleri**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
