# NodeWave — Project Deliverables Management System
> **Fullstack Engineer Assessment Submission**  
> Operational backbone for managing high-value deliverables across cross-functional teams (**Product Management, UI/UX, Frontend, Backend**) with strict multi-tenant **Client Guest** isolation.

---

## Ringkasan Proyek (Overview)

Sistem ini dibangun untuk mengelola deliverable proyek secara terstruktur dengan kontrol akses berlapis. Berbeda dari aplikasi CRUD konvensional, sistem ini menyelesaikan 3 tantangan arsitektur inti:

1. **State-Based Permissions (RBAC + ABAC)**: Hak akses dinamis berdasarkan peran (*Role*), departemen (*Department*), dan status tugas (*Task State*).
2. **Inter-Task Dependencies & Cycle Prevention**: Pencegahan tugas dikerjakan sebelum prasyarat selesai, deteksi siklus dependensi melingkar via DFS, dan *auto-cascading re-evaluation*.
3. **Data Concurrency & Optimistic Locking**: Pengendalian benturan data (*race condition*) antar pengguna menggunakan mekanisme `version` dengan respon `409 Conflict`.
4. **Immutable Audit Trail & Soft Deletes**: Seluruh perubahan dicatat secara transaksional ke tabel log yang *append-only*; tidak ada entitas yang dihapus secara fisik (`deletedAt`).
5. **Client Multi-Tenant Isolation & Data Masking**: Klien hanya dapat melihat proyek miliknya dan deliverable bertanda *Client-Visible*, di mana seluruh identitas internal disaring langsung pada level API.

---

## Tech Stack

### Backend
- **Runtime**: Bun 1.4+
- **Web Framework**: Hono
- **Database & ORM**: Prisma ORM (SQLite untuk local dev, PostgreSQL ready)
- **Authentication**: JWT (`jsonwebtoken`) + `bcryptjs`
- **Validation**: Zod
- **Testing**: `bun:test` (9 test suites, 31 assertions)
- **TypeScript**: Strict Mode (`tsc --noEmit` clean)

### Frontend
- **Framework**: Next.js 16.4.6 (App Router + Turbopack)
- **UI & Core**: React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4 (Desain clean & minimalis ala modern SaaS invoice layout)
- **State & Data Fetching**: TanStack Query v5, Zustand v5, Axios
- **Icons**: Lucide React

---

## Kredensial Uji Coba (Demo Seed Accounts)

Semua akun menggunakan password yang sama: **`password123`**  
*(Pada halaman `/login`, tersedia tombol **Reviewer Quick-Login (1-Click)** untuk berpindah persona secara instan).*

| Persona / Role | Email | Password | Cakupan Akses & Perilaku |
|---|---|---|---|
| **Product Manager (PM)** | `pm@nodewave.com` | `password123` | Akses penuh CRUD, mengatur dependensi, dan toggle *Client-Visible*. **Dilarang** menyelesaikan deliverable (`IN_PROGRESS` $\rightarrow$ `DONE`). |
| **UI/UX Designer** | `uiux@nodewave.com` | `password123` | Ditugaskan di Project Alpha. Memegang Task A (UI Mockup). Mengunggah hasil desain & ubah status. |
| **Frontend Engineer** | `frontend@nodewave.com` | `password123` | Ditugaskan di Project Alpha. Memegang Task C (Frontend Slicing) yang terkunci (*Blocked*) hingga Task A dan Task B berstatus `DONE`. |
| **Backend Engineer** | `backend@nodewave.com` | `password123` | Ditugaskan di Project Alpha & Beta. Memegang Task B (Backend API Integration). |
| **Client Guest 1** | `client1@nodewave.com` | `password123` | Terisolasi di Project Alpha. Hanya melihat metrik agregat (% selesai) dan deliverable bertanda *Client-Visible* (data internal disamarkan). |
| **Client Guest 2** | `client2@nodewave.com` | `password123` | Terisolasi di Project Beta. Tolok ukur multi-tenant isolation (tidak bisa mengakses data Alpha). |

---

## Panduan Instalasi & Menjalankan (Getting Started)

### Prasyarat Sistem
- **Bun** (versi 1.1+ atau 1.4+) — [Instal Bun](https://bun.sh)
- **Node.js** (v18.18+ atau v20+) dan **npm**
- **Git**

---

### 1. Setup Backend API

Buka terminal dan jalankan langkah berikut:

```bash
# 1. Pindah ke direktori backend
cd backend

# 2. Instal dependensi
bun install

# 3. Generate Prisma client & inisialisasi schema database
bunx prisma generate
bunx prisma db push

# 4. Jalankan database seed (membuat akun, proyek, dependensi, dan audit trail)
bun run prisma/seed.ts

# 5. Jalankan backend server
bun run src/index.ts
```

> Backend API akan berjalan di: **`http://localhost:3001`**  
> Cek status API: `http://localhost:3001/api/health`

---

### 2. Setup Frontend Client

Buka terminal baru:

```bash
# 1. Pindah ke direktori frontend
cd frontend

# 2. Instal dependensi
npm install

# 3. Jalankan development server
npm run dev
```

> Frontend aplikasi akan berjalan di: **`http://localhost:3000`**  
> Buka browser dan arahkan ke: **`http://localhost:3000/login`**

---

## Menjalankan Pengujian & Quality Check

### 1. Backend Automated Integration Tests
Proyek dilengkapi dengan test suite otomatis yang memverifikasi seluruh business rules assessment:

```bash
cd backend
bun test
```
*Hasil: 9 test suites, 31 assertions passing (100%).*

### 2. Strict TypeScript Verification
Memastikan kedua repository bebas dari type error:

```bash
# Typecheck backend
cd backend
bun x tsc --noEmit

# Typecheck frontend
cd frontend
npx tsc --noEmit
```

### 3. Frontend Production Build
Memastikan seluruh rute App Router terkompilasi optimal:

```bash
cd frontend
npm run build
```

---

## Fitur Kunci & Penerapan Aturan Bisnis

### 1. Role-Based & State-Based Permissions
- **PM Limitation**: PM dapat mengalokasikan tugas kepada tim, namun tombol *Complete* dinonaktifkan di UI dan divalidasi ketat di API (`task.permissions.ts`). Hanya PIC pelaksana (*Assignee*) yang dapat menyelesaikan deliverable.
- **Internal Protection**: Tim internal dilarang mengedit judul atau deskripsi inti tugas (`403 Forbidden`); mereka hanya memiliki hak mutasi status kerja dan mengunggah attachment hasil kerja.

### 2. Dependency-Aware Task Board
- Contoh skenario benih (*seed*): **Task A (UI Design)** dan **Task B (Backend API)** menjadi prasyarat untuk **Task C (Frontend Slicing)**.
- Task C otomatis berstatus **`BLOCKED`** dan tombol *Start* berstatus **`Locked`**.
- Deteksi siklus melingkar (*circular dependency*) diterapkan menggunakan algoritma Depth-First Search (DFS) di backend, menolak upaya pembuatan dependensi yang berputar dengan error `400 Bad Request`.

### 3. Concurrency Control (Optimistic Locking)
- Setiap entity `Task` membawa field `version` integer.
- Setiap pembaruan wajib menyertakan versi saat ini. Jika terjadi *stale write*, sistem merespons dengan HTTP `409 Conflict`.
- Frontend menangani status 409 secara elegan dengan memunculkan dialog resolusi konflik untuk me-refresh data tanpa kehilangan konteks.

### 4. Client Multi-Tenant Isolation & Data Masking
- Akun `Client Guest` otomatis diarahkan ke rute `/client/projects`.
- Data internal seperti nama engineer, email, divisi, avatar, komentar internal tim, serta audit log dihapus langsung di tingkat query backend (`maskTaskForClient`), sehingga data rahasia tidak pernah terkirim ke browser.

### 5. Daily Standup Auto-Summary (Bonus Feature)
- Endpoint `GET /api/projects/:projectId/standup` menganalisis data audit trail kemarin dan menyajikan rekap per departemen:
  - *What was completed yesterday*
  - *What is blocked today*

---

## Struktur Direktori

```text
nodewave/
├── backend/                    # Repository Backend (Bun + Hono + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & relasi
│   │   └── seed.ts             # Seeder 6 persona, 2 proyek, & dependensi
│   ├── src/
│   │   ├── middleware/         # Auth JWT & RBAC/ABAC guards
│   │   ├── modules/            # Domain modules (auth, projects, tasks, comments, attachments)
│   │   └── index.ts            # Entrypoint Hono server
│   └── tests/
│       └── assessment.test.ts  # Automated integration test suite
│
├── frontend/                   # Repository Frontend (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/                # App Router (login, dashboard, projects, client portal)
│   │   ├── components/         # Komponen Kanban board, drawer task, dialog, layout
│   │   ├── hooks/              # TanStack Query custom hooks
│   │   ├── stores/             # Zustand auth & session store
│   │   └── types/              # Strict TypeScript interfaces
│   └── tailwind.config.ts      # Desain sistem & styling
│
└── README.md                   # Dokumentasi master proyek
```

