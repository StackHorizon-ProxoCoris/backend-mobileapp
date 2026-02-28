-- ============================================================
-- Migrasi: Buat tabel info_articles
-- Menyimpan artikel untuk fitur Info & Edukasi
-- ============================================================

CREATE TABLE IF NOT EXISTS info_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Field dasar
  type VARCHAR(50) NOT NULL DEFAULT 'BookOpenText',
  title VARCHAR(255) NOT NULL,
  subtitle TEXT DEFAULT '',
  category VARCHAR(50) NOT NULL DEFAULT 'edukasi',
  source VARCHAR(100) DEFAULT '',
  color VARCHAR(20) DEFAULT '#3b82f6',
  bg VARCHAR(20) DEFAULT '#eff6ff',
  gradient VARCHAR(20) DEFAULT '#3b82f6',
  
  -- Konten
  content JSONB NOT NULL DEFAULT '[]',
  photo_urls JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  tips JSONB NOT NULL DEFAULT '[]',
  related_links JSONB NOT NULL DEFAULT '[]',
  
  -- Penulis
  author_name VARCHAR(100) DEFAULT '',
  author_initials VARCHAR(10) DEFAULT '',
  author_role VARCHAR(100) DEFAULT '',
  author_organization VARCHAR(100) DEFAULT '',
  
  -- Statistik
  stats_views INT DEFAULT 0,
  stats_shares INT DEFAULT 0,
  stats_bookmarks INT DEFAULT 0,
  
  -- Verifikasi
  verified BOOLEAN DEFAULT false,
  verified_by VARCHAR(100) DEFAULT NULL,
  
  -- Metadata
  read_time VARCHAR(20) DEFAULT '3 menit',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Data Awal: 3 contoh artikel dari data dummy
-- ============================================================

INSERT INTO info_articles (id, type, title, subtitle, category, source, color, bg, gradient, content, photo_urls, tags, tips, related_links, author_name, author_initials, author_role, author_organization, stats_views, stats_shares, stats_bookmarks, verified, verified_by, read_time, published_at, updated_at)
VALUES 
(
  'a0000000-0000-0000-0000-000000000001',
  'CloudRain',
  'Prakiraan Cuaca: Hujan Lebat di Bandung Selatan',
  'Waspada potensi banjir dan longsor di kawasan dataran rendah',
  'cuaca',
  'BMKG • Hari ini',
  '#3b82f6',
  '#eff6ff',
  '#3b82f6',
  '["Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) merilis peringatan dini cuaca untuk wilayah Bandung Selatan. Berdasarkan analisis citra satelit dan model cuaca numerik, diprediksi akan terjadi hujan lebat disertai petir dan angin kencang pada hari ini.","Intensitas hujan diperkirakan mencapai 50-100 mm per hari, yang tergolong dalam kategori hujan lebat. Wilayah yang paling terdampak meliputi Kecamatan Dayeuhkolot, Baleendah, Bojongsoang, dan Margahayu.","Masyarakat yang tinggal di daerah rawan banjir disarankan untuk mempersiapkan langkah-langkah antisipasi, termasuk memindahkan barang berharga ke tempat yang lebih tinggi dan menyiapkan tas darurat berisi dokumen penting.","Kondisi cuaca ini diperkirakan akan berlangsung hingga 3 hari ke depan. BMKG akan terus memperbarui informasi setiap 6 jam sekali melalui aplikasi dan kanal resmi. Pantau terus perkembangan cuaca di wilayah Anda."]'::jsonb,
  '["https://placehold.co/400x250/3b82f6/fff?text=Peta+Cuaca","https://placehold.co/400x250/3b82f6/fff?text=Citra+Satelit","https://placehold.co/400x250/3b82f6/fff?text=Prakiraan+Hujan"]'::jsonb,
  '["Cuaca","Peringatan Dini","Hujan Lebat","Bandung Selatan"]'::jsonb,
  '[{"icon":"Umbrella","title":"Bawa Payung","desc":"Selalu siapkan payung atau jas hujan saat keluar rumah"},{"icon":"Warning","title":"Hindari Genangan","desc":"Jangan melintas di area genangan air yang dalam"},{"icon":"Lightning","title":"Waspada Petir","desc":"Jauhi pohon tinggi dan tiang listrik saat hujan petir"},{"icon":"House","title":"Siapkan Darurat","desc":"Siapkan senter, makanan, dan obat-obatan darurat"}]'::jsonb,
  '[{"title":"Website resmi BMKG","url":"https://bmkg.go.id"},{"title":"Info prakiraan cuaca harian","url":"https://cuaca.bmkg.go.id"}]'::jsonb,
  'Dr. Andi Prasetyo', 'AP', 'Kepala Bidang Prakiraan', 'BMKG Stasiun Bandung',
  1240, 89, 156, true, 'BMKG Stasiun Geofisika Bandung', '3 menit',
  '2026-02-21 06:00:00+07', '2026-02-21 08:30:00+07'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'BookOpenText',
  '5 Langkah Mitigasi Banjir untuk Warga',
  'Panduan praktis kesiapsiagaan banjir untuk rumah tangga',
  'edukasi',
  'Edukasi • 2 hari lalu',
  '#10b981',
  '#ecfdf5',
  '#10b981',
  '["Banjir merupakan salah satu bencana alam yang paling sering terjadi di Indonesia, terutama saat musim penghujan. Kesiapsiagaan yang baik dapat meminimalkan kerugian material dan menyelamatkan nyawa.","Langkah pertama adalah mengenali tanda-tanda banjir. Perhatikan curah hujan yang tinggi secara terus-menerus, naiknya permukaan air sungai, dan peringatan dini dari BMKG. Jangan abaikan informasi dari RT/RW setempat.","Langkah kedua, siapkan tas darurat (go-bag) berisi dokumen penting, obat-obatan, pakaian ganti, senter, power bank, dan makanan tahan lama minimal untuk 3 hari. Simpan di tempat yang mudah dijangkau.","Langkah ketiga, pastikan saluran air di sekitar rumah tidak tersumbat. Bersihkan got, selokan, dan drainase secara berkala. Sampah yang menumpuk di saluran air adalah penyebab utama banjir lokal.","Langkah keempat, tentukan titik kumpul dan jalur evakuasi bersama keluarga. Pastikan semua anggota keluarga tahu ke mana harus pergi jika banjir datang. Simpan nomor darurat yang penting.","Langkah kelima, ikut serta dalam kegiatan gotong royong lingkungan. Pencegahan banjir adalah tanggung jawab bersama. Berpartisipasi dalam kerja bakti bersih-bersih sungai dan perawatan drainase."]'::jsonb,
  '["https://placehold.co/400x250/10b981/fff?text=Mitigasi+Banjir","https://placehold.co/400x250/10b981/fff?text=Tas+Darurat","https://placehold.co/400x250/10b981/fff?text=Jalur+Evakuasi"]'::jsonb,
  '["Edukasi","Mitigasi","Banjir","Kesiapsiagaan"]'::jsonb,
  '[{"icon":"Backpack","title":"Siapkan Go-Bag","desc":"Tas darurat untuk keluarga berisi kebutuhan 3 hari"},{"icon":"Drop","title":"Bersihkan Drainase","desc":"Cek dan bersihkan saluran air rumah setiap minggu"},{"icon":"MapTrifold","title":"Cari Jalur Evakuasi","desc":"Tentukan rute evakuasi dan titik kumpul keluarga"},{"icon":"Phone","title":"Simpan Nomor Darurat","desc":"112 (Darurat), 113 (Pemadam), 118 (Ambulance)"}]'::jsonb,
  '[{"title":"Panduan BNPB tentang banjir","url":"https://bnpb.go.id"},{"title":"Checklist tas darurat","url":"https://siaga.bnpb.go.id"}]'::jsonb,
  'Tim Redaksi ProxoCoris', 'PC', 'Tim Edukasi', 'ProxoCoris',
  3420, 245, 512, true, 'BPBD Kota Bandung', '5 menit',
  '2026-02-19 10:00:00+07', '2026-02-19 10:00:00+07'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'MegaphoneSimple',
  'Perbaikan Jalan Sudirman Dimulai 20 Feb',
  'Pengalihan lalu lintas selama proses perbaikan 14 hari',
  'pengumuman',
  'Pengumuman • Dinas PU',
  '#f59e0b',
  '#fffbeb',
  '#f59e0b',
  '["Dinas Pekerjaan Umum (PU) Kota Bandung mengumumkan dimulainya proyek perbaikan Jl. Sudirman pada tanggal 20 Februari 2026. Proyek ini mencakup perbaikan aspal, penataan trotoar, dan perbaikan saluran drainase sepanjang 1.2 kilometer.","Pekerjaan akan dilakukan secara bertahap, dimulai dari segmen depan Halte Dago hingga Simpang Dago. Estimasi waktu pengerjaan adalah 14 hari kerja, dengan target penyelesaian pada 10 Maret 2026.","Selama masa perbaikan, akan diberlakukan pengalihan arus lalu lintas. Kendaraan dari arah utara dialihkan melalui Jl. Riau, sementara dari arah selatan melalui Jl. Diponegoro. Rambu pengalihan sudah dipasang di titik-titik strategis.","Dinas PU memastikan pekerjaan akan dilakukan pada jam 08:00 - 17:00 WIB untuk meminimalkan gangguan. Pada jam sibuk pagi dan sore, sebagian jalur tetap dibuka untuk arus kendaraan. Warga dimohon kesabarannya selama proses perbaikan berlangsung."]'::jsonb,
  '["https://placehold.co/400x250/f59e0b/fff?text=Peta+Pengalihan","https://placehold.co/400x250/f59e0b/fff?text=Jalan+Rusak","https://placehold.co/400x250/f59e0b/fff?text=Proses+Perbaikan"]'::jsonb,
  '["Pengumuman","Infrastruktur","Jalan Sudirman","Pengalihan Lalu Lintas"]'::jsonb,
  '[{"icon":"NavigationArrow","title":"Rute Alternatif","desc":"Gunakan Jl. Riau atau Jl. Diponegoro sebagai alternatif"},{"icon":"Clock","title":"Jam Kerja","desc":"Pekerjaan berlangsung 08:00 - 17:00 WIB"},{"icon":"CalendarBlank","title":"Durasi Proyek","desc":"20 Feb - 10 Mar 2026 (14 hari kerja)"},{"icon":"WarningCircle","title":"Hati-hati","desc":"Perhatikan rambu pengalihan dan petugas lapangan"}]'::jsonb,
  '[{"title":"Peta pengalihan lalu lintas","url":"#"},{"title":"Info proyek Dinas PU","url":"#"}]'::jsonb,
  'Ir. Bambang Sutopo', 'BS', 'Kepala Bidang Bina Marga', 'Dinas PU Kota Bandung',
  2180, 167, 298, true, 'Dinas PU Kota Bandung', '4 menit',
  '2026-02-18 14:00:00+07', '2026-02-20 09:00:00+07'
)
ON CONFLICT (id) DO NOTHING;
