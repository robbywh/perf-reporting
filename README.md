# Performance Reporting

Aplikasi untuk melacak dan memvisualisasikan kinerja tim engineering selama sprint development.

## Deskripsi

Performance Reporting adalah aplikasi berbasis web untuk memantau dan menganalisis performa engineer selama sprint development. Aplikasi ini memungkinkan pengguna untuk:

- Melacak story point dan jam coding
- Melihat statistik tugas berdasarkan kategori
- Menganalisis performa engineer berdasarkan sprint
- Mengelola cuti dan hari libur
- Menghasilkan laporan performa
- Sinkronisasi otomatis data dari ClickUp dan GitLab

Aplikasi ini dibangun menggunakan Next.js, Prisma ORM, dan Clerk untuk otentikasi.

## Fitur Utama

- **Dashboard**: Menampilkan visual analitik kinerja tim selama sprint
- **Top Performers**: Menampilkan engineer dengan performa terbaik
- **Manajemen Sprint**: Membuat dan mengelola sprint
- **Manajemen Tugas**: Melacak tugas, status, dan kategori
- **Jam Coding**: Mencatat dan memantau jam coding engineer
- **Manajemen Cuti**: Mencatat cuti engineer dan hari libur
- **Ekspor Data**: Mengunduh data dalam format Excel

## Teknologi

- **Frontend**: Next.js, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL dengan Prisma ORM
- **Autentikasi**: Clerk
- **Visualisasi**: Recharts
- **Deployment**: Vercel
- **Integrasi API**: ClickUp API dan GitLab API
- **Otomatisasi**: Vercel Cron Jobs

## Persyaratan Sistem

- Node.js 18.0.0 atau lebih baru
- PostgreSQL
- npm atau yarn

## Instalasi

1. Clone repositori:

   ```bash
   git clone https://github.com/yourusername/perf-reporting.git
   cd perf-reporting
   ```

2. Instal dependensi:

   ```bash
   npm install
   ```

3. Siapkan variabel lingkungan:

   ```bash
   cp env.example .env
   ```

   Isi file `.env` dengan nilai yang diperlukan, termasuk koneksi database dan kunci API Clerk.

4. Jalankan migrasi database:

   ```bash
   npx prisma migrate dev
   ```

5. Seeding data awal (sesuaikan dengan perusahaan):

   ```bash
   npx prisma db seed
   ```

6. Jalankan aplikasi dalam mode development:
   ```bash
   npm run dev
   ```

## Struktur Database

Aplikasi menggunakan model data berikut:

- **Sprint**: Periode waktu development
- **Engineer**: Anggota tim engineering
- **Task**: Tugas yang dikerjakan selama sprint
- **Status**: Status tugas (e.g., In Progress, Done)
- **Category**: Kategori tugas
- **Tag**: Tag untuk mengklasifikasikan tugas
- **Leave**: Catatan cuti engineer

## Integrasi API dan Cron Jobs

Aplikasi menggunakan Cron Jobs di Vercel untuk sinkronisasi otomatis data dari platform eksternal:

### ClickUp API

- **Sinkronisasi Sprint**: Mengambil data sprint dari ClickUp Lists
- **Sinkronisasi Tugas**: Mengambil detail tugas, status, dan metadata lainnya
- **Sinkronisasi Assignee**: Mengambil informasi penugasan engineer
- **Sinkronisasi Reviewer**: Mengambil informasi penugasan reviewer

### GitLab API

- **Merge Requests**: Mengambil data MR yang telah di-merge dalam periode sprint

### Konfigurasi Cron Jobs

Aplikasi menggunakan Vercel Cron Jobs untuk menjalankan sinkronisasi secara otomatis:

```json
{
  "crons": [
    {
      "path": "/api/sprints/sync",
      "schedule": "0 17 * * *"
    }
  ]
}
```

Endpoint `/api/sprints/sync` berjalan setiap hari pukul 17:00 untuk:

1. Mengambil data sprint terbaru dari ClickUp
2. Menyinkronkan tugas dan statusnya
3. Memperbarui data MR dari GitLab

### Variabel Lingkungan untuk API

Tambahkan variabel berikut ke file `.env`:

```
CRON_SECRET=
BLOB_READ_WRITE_TOKEN=
CLERK_SECRET_KEY=
CLICKUP_API_TOKEN=
CLICKUP_FOLDER_ID=
CLICKUP_BASE_URL=
DATABASE_URL=
GITLAB_BASE_URL=
GITLAB_GROUP_ID=
GITLAB_PERSONAL_ACCESS_TOKEN=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NODE_ENV=
```

## Penggunaan

1. Login menggunakan akun Clerk
2. Pilih sprint dari dropdown untuk melihat data
3. Gunakan panel navigasi untuk mengakses fitur berbeda:
   - Dashboard: Tampilan utama dengan chart dan statistik
   - Engineer: Lihat detail performa per engineer

## Kontribusi

Jika ingin berkontribusi pada proyek ini:

1. Fork repositori
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## Lisensi

[MIT License]

## Kontak

Untuk pertanyaan atau dukungan, silakan hubungi [robby.widyahartono@gmail.com]
