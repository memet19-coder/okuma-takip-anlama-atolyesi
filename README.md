# Okuma Takip ve Anlama Atölyesi

Ortaokul öğrencilerine düzenli okuma alışkanlığı kazandıran ve tamamlanan okumaları tarayıcıda saklayan React uygulaması.

## Özellikler

- 719 bağımsız metinden oluşan temizlenmiş okuma kütüphanesi
- 96 açık lisanslı kaynaktan hazırlanan, sanat, araştırma ve bilim alanlarında ortalama 279 kelimelik bütünlüklü metinler
- Sanat, araştırma ve bilim alanlarında 157-235 kelimelik 600 ek bağımsız okuma metni
- Kısa, orta ve uzun metin dengesi
- Özgün eğitim metinleri, tam hâli korunan kamu malı Ömer Seyfettin hikâyeleri ve halk masalları
- Günlük metin önerisi, arama, tür ve konu filtreleri
- Okundu işareti, favoriler ve sonra oku listesi
- Okunan metin, kelime ve süre takibi
- Her hafta 5 metinden oluşan açık uçlu okuma-anlama çalışmaları ve öğrenci öz değerlendirmesi
- Tamamlanan anlama çalışmaları ile karşılaştırma sonuçlarının öğretmen raporunda izlenmesi
- Öğrenci ilerleme ekranı ve öğretmen okuma raporu
- Kaynak, yazar ve lisans bilgilerinin metinlerle birlikte saklanması
- Açık ve koyu tema, ayarlanabilir yazı büyüklüğü

## Çalıştırma

```bash
pnpm install
pnpm dev
```

Üretim derlemesi:

```bash
pnpm build
```

## Metin Yapısı

Metinler `src/data/texts.json` dosyasında tutulur. Her kayıtta şu alanlar bulunur:

```json
{
  "id": "benzersiz-metin-kodu",
  "title": "Metin başlığı",
  "gradeLevel": [5, 6, 7, 8],
  "type": "Hikâye",
  "difficulty": "Orta",
  "topic": "Klasik Türk Edebiyatı",
  "estimatedReadingTime": 3,
  "wordCount": 320,
  "keywords": ["hikâye", "edebiyat"],
  "content": "Metnin tamamı...",
  "author": "Yazar adı",
  "source": "Kaynak adı",
  "sourceUrl": "https://...",
  "license": "Kamu malı eser; Vikikaynak metni CC BY-SA"
}
```

Uygulamada soru alanı ve soru akışı bulunmaz. Öğrenci metnin sonunda `Okudum, tamamla` düğmesini kullanarak okumasını kaydeder.

## Supabase Kurulumu

1. Supabase üzerinde yeni bir proje oluştur.
2. SQL Editor bölümünde `supabase/migrations/202607150001_student_progress.sql` dosyasını çalıştır.
3. Aynı SQL Editor ekranında en az 6 karakterlik öğretmen PIN'ini oluştur:

```sql
select public.configure_teacher_pin('BURAYA_GÜÇLÜ_BİR_PIN_YAZIN');
```

4. `.env.example` dosyasını `.env` adıyla çoğalt ve Supabase projesinin URL ile `anon` anahtarını ekle.
5. Uygulamayı yeniden başlat. Öğrenci ilerlemesi otomatik eşitlenir; öğretmen panelinde PIN girilerek bütün öğrencilerin okuduğu metinler görüntülenir.

Öğrenci tablosu doğrudan genel erişime açık değildir. Cihazlar yalnızca kendilerine ait gizli eşitleme anahtarıyla kayıt günceller; sınıf raporu öğretmen PIN'iyle çalışan güvenli bir veritabanı fonksiyonundan alınır.

## GitHub Pages Kurulumu

Proje Git deposu ve GitHub Pages yayın iş akışıyla hazırlanmıştır. GitHub deposunda:

1. `Settings > Pages` bölümünde kaynak olarak `GitHub Actions` seç.
2. `Settings > Secrets and variables > Actions` bölümüne `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` sırlarını ekle.
3. `main` dalına yapılan her gönderimde uygulama otomatik derlenir ve GitHub Pages'e yayınlanır.

## Kaynaklar

- Özgün başlangıç metinleri Okuma Atölyesi için hazırlanmıştır.
- Ömer Seyfettin’in telif süresi dolmuş eserleri Vikikaynak metinlerinden alınmıştır.
- Nasreddin Hoca fıkraları ve halk masalları anonim halk edebiyatı ürünleridir; metin sayfalarının bağlantıları kayıtlarda tutulur.
- Vikikaynak metinleri için kaynak bağlantısı ve CC BY-SA bilgisi her kayıtta yer alır.
