# PerfReporting
test
Multi-organization performance tracking system untuk melacak dan memvisualisasikan kinerja tim engineering selama sprint development.

## Deskripsi

Performance Reporting adalah aplikasi berbasis web multi-tenant untuk memantau dan menganalisis performa engineer selama sprint development. Aplikasi ini mendukung multiple organisasi dengan isolasi data yang ketat dan memungkinkan pengguna untuk:

- Melacak story point dan jam coding
- Melihat statistik tugas berdasarkan kategori
- Menganalisis performa engineer berdasarkan sprint
- Mengelola cuti dan hari libur
- Menghasilkan laporan performa
- Sinkronisasi otomatis data dari ClickUp dan GitLab
- **Multi-Organization Support**: Isolasi data per organisasi dengan konfigurasi API terpisah
- **Organization Selector**: Interface untuk beralih antar organisasi

Aplikasi ini dibangun menggunakan Next.js, Prisma ORM, dan Clerk untuk otentikasi.

## Fitur Utama

### Core Features

- **Dashboard**: Visual analitik kinerja tim selama sprint dengan filtering per organisasi
- **Top Performers**: Ranking engineer dengan performa terbaik per organisasi
- **Manajemen Sprint**: Membuat dan mengelola sprint dengan sinkronisasi ClickUp
- **Manajemen Tugas**: Melacak tugas, status, dan kategori dengan isolasi organisasi
- **Jam Coding**: Mencatat dan memantau jam coding engineer dengan upload file
- **Manajemen Cuti**: Mencatat cuti engineer dan hari libur
- **Ekspor Data**: Mengunduh data dalam format Excel

### Multi-Organization Features

- **Organization Isolation**: Data sepenuhnya terisolasi per organisasi
- **Organization Selector**: Dropdown untuk beralih antar organisasi
- **Separate API Configuration**: Setiap organisasi memiliki konfigurasi ClickUp/GitLab terpisah
- **Role-based Access**: Akses engineer dibatasi berdasarkan organisasi mereka

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

Aplikasi menggunakan model data multi-tenant berikut:

### Core Models

- **Organization**: Entitas organisasi utama untuk isolasi data
- **Sprint**: Periode waktu development dengan `organizationId`
- **Engineer**: Anggota tim engineering dengan relasi many-to-many ke organisasi
- **Reviewer**: Reviewer dengan relasi many-to-many ke organisasi
- **Task**: Tugas yang dikerjakan selama sprint
- **User**: Authentication users linked ke engineers via Clerk

### Configuration Models

- **Status**: Status tugas per organisasi (e.g., In Progress, Done)
- **Category**: Kategori tugas per organisasi
- **Tag**: Tag untuk mengklasifikasikan tugas per organisasi
- **Setting**: Konfigurasi API (ClickUp, GitLab) per organisasi

### Activity Models

- **Leave**: Catatan cuti engineer
- **PublicHoliday**: Hari libur nasional
- **SprintGitlab**: Relasi GitLab MR dengan sprint dan engineer

### Junction Tables

- **EngineerOrganization**: Many-to-many engineer-organization
- **ReviewerOrganization**: Many-to-many reviewer-organization
- **UserOrganization**: Many-to-many user-organization

## Integrasi API dan Cron Jobs

Aplikasi menggunakan Cron Jobs di Vercel untuk sinkronisasi otomatis data dari platform eksternal:

## Arsitektur Sistem

Berikut adalah arsitektur sistem PerfReporting yang menggambarkan aliran data dan integrasi antar komponen:

![Arsitektur Sistem PerfReporting](/public/architecture.png)

Arsitektur sistem terdiri dari:

- **Vercel Cron Jobs**: Menjalankan job setiap 5 PM untuk sinkronisasi data
- **Vercel Blob**: Untuk menyimpan dan mengambil gambar/file
- **PerfReporting**: Aplikasi utama yang menyediakan endpoint API dan antarmuka pengguna
- **Clerk**: Sistem autentikasi untuk pengelolaan pengguna
- **GitLab & ClickUp**: Sumber data eksternal untuk mendapatkan data tugas dan aktivitas coding
- **Prisma ORM**: Layer abstraksi untuk interaksi dengan database
- **Prisma Accelerate**: Connection Pool Caching untuk meningkatkan performa database
- **Prisma Postgres**: Database yang menyimpan semua data aplikasi

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

**Penting**: Konfigurasi API sekarang disimpan dalam database per organisasi, bukan environment variables.

Tambahkan variabel berikut ke file `.env`:

```
# System Configuration
CRON_SECRET=your-cron-secret
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/perf_reporting

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

CLICKUP_BASE_URL=
GITLAB_BASE_URL=
```

### Konfigurasi API Per Organization

Setiap organisasi memiliki setting terpisah yang disimpan dalam tabel `Setting`:

- `CLICKUP_API_TOKEN`: Token API ClickUp untuk organisasi
- `CLICKUP_FOLDER_ID`: ID folder ClickUp untuk sprint
- `CLICKUP_BASE_URL`: Base URL ClickUp API
- `GITLAB_PERSONAL_ACCESS_TOKEN`: Token GitLab untuk organisasi
- `GITLAB_GROUP_ID`: ID group GitLab
- `GITLAB_BASE_URL`: Base URL GitLab instance

## Penggunaan

### Setup Multi-Organization

1. Setup organisasi dan user mappings melalui database seeding
2. Konfigurasi API tokens untuk setiap organisasi melalui tabel `Setting`
3. Assign engineers dan reviewers ke organisasi yang sesuai

### Daily Usage

1. **Login**: Gunakan akun Clerk yang telah dikaitkan dengan engineer
2. **Pilih Organisasi**: Gunakan organization selector di header untuk memilih organisasi
3. **Filter Sprint**: Pilih sprint dari dropdown untuk melihat data spesifik
4. **Navigasi**:
   - **Dashboard**: Tampilan utama dengan chart dan statistik per organisasi
   - **Engineer Detail**: Lihat detail performa individual per engineer
   - **Data Export**: Download laporan dalam format Excel

### Data Isolation

- Semua data terisolasi per organisasi
- User hanya dapat melihat data organisasi yang mereka assigned
- API sync berjalan terpisah untuk setiap organisasi
- GitLab dan task data tidak tercampur antar organisasi

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
