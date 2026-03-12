# SIAGA Backend API

[English](README.md) | [Bahasa Indonesia](README.id.md)

Server REST API untuk **SIAGA** (Sistem Informasi dan Aksi untuk Gerakan Aman) — platform civic technology yang menghubungkan warga dan pemerintah daerah untuk manajemen masalah lingkungan dan sosial yang transparan.

> Untuk gambaran umum proyek lengkap, fitur, dan dokumentasi teknis, lihat [Repositori Frontend](https://github.com/orgs/StackHorizon-ProxoCoris/repositories).

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Repositori Terkait](#repositori-terkait)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Environment Variables](#environment-variables)
- [Menjalankan Server](#menjalankan-server)
- [Struktur Proyek](#struktur-proyek)
- [Endpoint API](#endpoint-api)
- [Database](#database)
- [Dokumentasi Teknis](#dokumentasi-teknis)
- [Tim](#tim)

---

## Tech Stack

| Teknologi | Versi | Tujuan |
|---|---|---|
| Express.js | 5 | Server HTTP dan framework REST API |
| TypeScript | 5.9 | Pengembangan server dengan tipe data aman |
| Supabase JS | 2.97 | Klien PostgreSQL, autentikasi, dan Realtime |
| Google Gemini AI | 1.43 | Asisten chat AI (edukasi bencana/keselamatan) |
| Expo Server SDK | 6.0 | Pengiriman notifikasi push ke klien mobile |
| Helmet | 8.1 | Header keamanan HTTP |
| Morgan | 1.10 | Request logging |
| Express Rate Limit | 8.2 | API rate limiting (200 req/15mnt produksi) |
| Multer | 2.0 | Penanganan unggahan file multipart |
| fast-xml-parser | 5.4 | Parsing data XML BMKG |

---

## Repositori Terkait

| Repositori | Deskripsi |
|---|---|
| [Aplikasi Frontend](https://github.com/orgs/StackHorizon-ProxoCoris/repositories) | Aplikasi mobile React Native / Expo |
| **Backend API (repo ini)** | Server REST API Express.js |

---

## Prasyarat

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Proyek [Supabase](https://supabase.com) dengan database PostgreSQL
- API key [Google AI Studio](https://aistudio.google.com) untuk Gemini

---

## Instalasi

Karena SIAGA bergantung pada aplikasi frontend dan API backend, **Anda harus mengatur dan menjalankan backend terlebih dahulu** sebelum frontend dapat berfungsi dengan baik.

### Bagian 1: Persiapan Backend (Repositori Ini)

1. Clone repositori:
```bash
git clone https://github.com/StackHorizon-ProxoCoris/backend-mobileapp.git
cd backend-mobileapp
```

2. Instal dependensi:
```bash
npm install
```

3. Konfigurasi environment variables:
```bash
cp .env.example .env
```
Edit `.env` dengan kredensial Anda (lihat [Environment Variables](#environment-variables)).

4. Jalankan migrasi database:

> [!NOTE]
> File migrasi berada di `src/database/migrations/`. Eksekusi secara berurutan (001–015) pada database PostgreSQL Supabase Anda menggunakan Supabase SQL Editor atau klien PostgreSQL lainnya.

> [!IMPORTANT]
> Migrasi `008` (tabel budget) telah dihapus dari codebase. Jika database Anda dibuat sebelum perubahan ini, Anda dapat menghapus tabel `budget_projects` dan `budget_dinas` dengan aman. Migrasi `015` menambahkan kolom bukti resolusi ke tabel `reports` — pastikan untuk menjalankannya agar fitur Gov Resolution berfungsi.

### Bagian 2: Persiapan Frontend

Setelah backend dikonfigurasi, buka terminal baru untuk mengatur frontend:

1. Clone repositori frontend:
```bash
git clone https://github.com/StackHorizon-ProxoCoris/frontend-mobileapp.git
cd frontend-mobileapp
```

2. Instal dependensi:
```bash
npm install
```

3. Konfigurasi Supabase Realtime untuk frontend (instruksi tersedia di [Frontend README](https://github.com/StackHorizon-ProxoCoris/frontend-mobileapp/blob/development/README.md)).

4. Jalankan dev server Expo (pastikan server backend sudah berjalan!):
```bash
npx expo start
```

---

## Environment Variables

Buat file `.env` berdasarkan `.env.example`:

| Variabel | Wajib | Deskripsi |
|---|---|---|
| `PORT` | Tidak | Port server (default: `3000`) |
| `NODE_ENV` | Tidak | `development` atau `production` (default: `development`) |
| `SUPABASE_URL` | Ya | URL proyek Supabase |
| `SUPABASE_ANON_KEY` | Ya | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Supabase service role key (operasi sisi server) |
| `JWT_SECRET` | Ya | Rahasia untuk validasi token JWT (min 32 karakter) |
| `CORS_ORIGIN` | Tidak | Origin CORS yang diizinkan (default: `http://localhost:8081`) |
| `GEMINI_API_KEY` | Ya | API key Google AI Studio untuk chat Gemini |

> [!CAUTION]
> Jangan pernah meng-commit file `.env` ke version control. File `.gitignore` sudah mengecualikannya.

---

## Menjalankan Server

Mulai server pengembangan dengan hot-reload:

```bash
npm run dev
```

Server akan mulai di `http://localhost:3000` secara default.

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Server pengembangan dengan hot-reload (tsx watch) |
| `npm run build` | Kompilasi TypeScript ke JavaScript |
| `npm start` | Jalankan build produksi yang telah dikompilasi |
| `npm run lint` | Cek tipe data tanpa mem-build |

> [!TIP]
> Dalam mode pengembangan, rate limiter mengizinkan 1000 request per 15 menit per IP. Di produksi, batas ini dikurangi menjadi 200 untuk mencegah penyalahgunaan.

---

## Struktur Proyek

```
backend-mobileapp/
├── src/
│   ├── index.ts                  # Titik masuk server dan pengaturan middleware
│   ├── config/
│   │   └── env.ts                # Konfigurasi environment variabel
│   ├── controllers/              # Request handlers (logika bisnis)
│   │   ├── auth.controller.ts    #   Autentikasi (login, daftar, profil)
│   │   ├── report.controller.ts  #   CRUD laporan, vote, verifikasi, bukti resolusi
│   │   ├── action.controller.ts  #   CRUD aksi positif, gabung/keluar
│   │   ├── comment.controller.ts #   Pembuatan dan daftar komentar
│   │   ├── chat.controller.ts    #   Integrasi chat Google Gemini AI
│   │   ├── bmkg.controller.ts    #   Proxy data gempa BMKG
│   │   ├── notification.controller.ts  # Manajemen kotak masuk notifikasi
│   │   ├── device-token.controller.ts  # Registrasi token notifikasi push
│   │   ├── activity.controller.ts      # Riwayat aktivitas pengguna
│   │   ├── area-status.controller.ts   # Status keamanan area tingkat kecamatan
│   │   ├── admin.controller.ts         # Super-admin: dasbor, pengguna, moderasi
│   │   ├── info.controller.ts          # Artikel info dan konten edukasi
│   │   ├── bookmark.controller.ts      # Bookmark laporan/aksi
│   │   ├── feedback.controller.ts      # Pengiriman feedback pengguna
│   │   └── upload.controller.ts        # Unggahan file ke Supabase Storage
│   ├── routes/                   # Definisi rute (pemetaan endpoint)
│   │   ├── auth.routes.ts
│   │   ├── report.routes.ts
│   │   ├── action.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── bmkg.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── device-token.routes.ts
│   │   ├── activity.routes.ts
│   │   ├── area-status.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── info.routes.ts
│   │   ├── bookmark.routes.ts
│   │   ├── feedback.routes.ts
│   │   ├── upload.routes.ts
│   │   └── health.routes.ts
│   ├── services/                 # Lapisan layanan (integrasi eksternal)
│   │   ├── ai.service.ts         #   Klien Google Gemini AI
│   │   ├── notification.service.ts  # Pembuatan notifikasi & radius targeting
│   │   ├── push.service.ts       #   Pengiriman push notification via Expo
│   │   └── ecopoints.service.ts  #   Penambahan poin atomik via RPC
│   ├── middleware/               # Middleware Express
│   │   ├── auth.middleware.ts    #   Verifikasi token JWT
│   │   ├── role.middleware.ts    #   Kontrol akses basis peran (user/pemerintah/admin)
│   │   ├── validate.middleware.ts #  Validasi request body
│   │   └── error.middleware.ts   #   Handler error global
│   ├── database/
│   │   └── migrations/           # File migrasi SQL (001–015)
│   └── types/                    # Definisi tipe TypeScript
├── .env.example                  # Template environment variables
├── package.json
└── tsconfig.json
```

---

## Endpoint API

Hampir semua endpoint diawali dengan `/api`.

### Autentikasi

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Daftar pengguna baru |
| `POST` | `/api/auth/login` | No | Login dengan email dan password |
| `GET` | `/api/auth/me` | Yes | Dapatkan profil akun saat ini |
| `PATCH` | `/api/auth/profile` | Yes | Perbarui profil |
| `POST` | `/api/auth/change-password` | Yes | Ubah sandi |
| `PATCH` | `/api/auth/settings` | Yes | Perbarui pengaturan |

### Laporan

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/reports` | Yes | Daftar laporan (dengan filter) |
| `GET` | `/api/reports/stats` | Yes | Statistik laporan (total, menunggu, selesai) |
| `GET` | `/api/reports/:id` | Yes | Detail laporan |
| `POST` | `/api/reports` | Yes | Buat laporan baru |
| `PATCH` | `/api/reports/:id/status` | Yes | Ubah status laporan (gov only) |
| `POST` | `/api/reports/:id/vote` | Yes | Berikan/tarik dukungan pada laporan |
| `POST` | `/api/reports/:id/verify` | Yes | Verifikasi laporan |

### Aksi Positif

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/actions` | Yes | Daftar aksi positif |
| `GET` | `/api/actions/:id` | Yes | Detail aksi |
| `POST` | `/api/actions` | Yes | Buat aksi baru |
| `POST` | `/api/actions/:id/join` | Yes | Bergabung ke aksi |
| `DELETE` | `/api/actions/:id/leave` | Yes | Keluar dari aksi |

### Admin (Khusus Super-Admin)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Ringkasan dasbor sistem |
| `GET` | `/api/admin/activity-log` | Admin | Log aktivitas sistem |
| `GET` | `/api/admin/users` | Admin | Daftar semua pengguna |
| `POST` | `/api/admin/users` | Admin | Buat akun pengguna baru |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Ubah peran pengguna |
| `PATCH` | `/api/admin/users/:id/suspend` | Admin | Suspend atau aktifkan pengguna |

> Lihat [`docs/API_DOCUMENTATION.md`](https://github.com/StackHorizon-ProxoCoris/frontend-mobileapp/blob/development/docs/API_DOCUMENTATION.md) di direktori frontend untuk referensi lengkap Endpoint API.

---

## Database

SIAGA menggunakan **Supabase** (PostgreSQL) dengan file migrasi yang mendefinisikan skema (migrasi 008 telah dihapus saat Budget Watch dihentikan):

| Migrasi | Tabel/Fungsi | Deskripsi |
|---|---|---|
| `001` | `users_metadata` | Profil diperluas (kecamatan, poin, field gov) |
| `002` | `reports` | Laporan masalah beserta koordinat GPS |
| `003` | `actions` | Aksi komunitas positif |
| `004` | `comments` | Komentar pada laporan dan aksi |
| `005` | `report_votes` | Dukungan user untuk laporan |
| `006` | `feedbacks` | Feedback sistem dari user |
| `007` | `notifications` | Sistem notifikasi bawaan |
| `009` | — | Penambahan kolom peran pengguna (role) |
| `010` | `report_verifications`, dll. | Tabel verifikasi, join, dan bookmark |
| `011` | `info_articles` | Artikel informasi edukasi |
| `012` | `device_tokens` | Pendaftaran token presensi push notifikasi |
| `013` | `increment_eco_points()` | Fungsi RPC PostgreSQL atomik untuk manipulasi poin |
| `014` | — | Penambahan field profil pemerintah (NIP, instansi, dll) di `users_metadata` |
| `015` | — | Kolom bukti resolusi (`resolution_notes`, `resolution_image_url`) di tabel laporan |

Seluruh diagram ERD tersedia di [Frontend `docs/ERD.md`](https://github.com/StackHorizon-ProxoCoris/frontend-mobileapp/blob/development/docs/ERD.md).

---

## Tim

**Tim StackHorizon** — Universitas Klabat

---

*Dibangun dengan tujuan untuk ProxoCoris 2026*
