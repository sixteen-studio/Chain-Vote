# 🗳️ ChainVote: Decentralized E-Voting System

ChainVote adalah aplikasi e-voting terdesentralisasi (DApp) berbasis **Blockchain (Ethereum/Hardhat)** dan **Next.js 14 (App Router)**. Aplikasi ini dirancang untuk mengatasi masalah manipulasi data (*double voting*, pengubahan hasil) dalam pemilihan umum konvensional dengan mencatat setiap perolehan suara secara langsung ke dalam *Smart Contract* yang bersifat *immutable* dan transparan.

## 🚀 Fitur Utama

- **🔒 Keamanan Berbasis Blockchain:** Suara disimpan secara permanen di blockchain menggunakan Smart Contract Solidity.
- **🛡️ Anti Double-Voting:** Setiap alamat dompet (wallet) hanya dapat memberikan satu suara per sesi pemilihan.
- **⚡ Real-time Data Integrity:** Sinkronisasi *on-chain* dan *off-chain* (Database PostgreSQL) menggunakan arsitektur *event listener* / sinkronisasi periodik.
- **📱 Responsif & Modern UI:** Dibangun dengan Tailwind CSS dan komponen Shadcn UI untuk pengalaman pengguna (UX) yang premium baik di perangkat *mobile* maupun *desktop*.
- **📊 Admin Dashboard:** Panel administratif komprehensif untuk mengelola sesi pemungutan suara, menambah kandidat, dan memantau status secara langsung.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend/API:** Next.js Server Actions & API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Blockchain:** Solidity `^0.8.20`, Hardhat, Ethers.js
- **Lainnya:** TypeScript, Zod (Validasi Input), ESLint

---

## 💻 Cara Menjalankan Project (Local Development)

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi secara penuh (termasuk *node* blockchain lokal).

### 1. Kebutuhan Sistem (Prerequisites)
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (versi 18+)
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)
- [PostgreSQL](https://www.postgresql.org/) (dapat berjalan di lokal atau menggunakan layanan cloud seperti Supabase)
- Extension Wallet (seperti [MetaMask](https://metamask.io/)) di browser Anda.

### 2. Instalasi Dependensi
Clone repositori ini dan masuk ke direktori proyek, lalu jalankan:

```bash
pnpm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```
Sesuaikan nilai di dalam `.env` dengan kredensial lokal Anda (URL Database PostgreSQL, *secret keys*, dll).

### 4. Setup Database
Jalankan migrasi Prisma untuk membangun skema tabel di PostgreSQL, kemudian isi data awal (seeder):

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

### 5. Setup Blockchain (Hardhat Node)
Buka terminal **baru** (biarkan berjalan) dan jalankan *node* blockchain lokal:

```bash
pnpm blockchain:node
```

Buka terminal **lainnya**, lalu *compile* dan *deploy* smart contract ke jaringan lokal tersebut:

```bash
pnpm blockchain:deploy:local
```

### 6. Menjalankan Frontend Next.js
Terakhir, jalankan server *development*:

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

---

## 🔐 Standar Keamanan & Arsitektur (Sesuai Production-Grade)
- Menggunakan validasi `zod` untuk seluruh endpoint API.
- Seluruh rahasia (*secrets*) disimpan di `.env` (tidak di-*commit*).
- Memiliki *fallback* error yang gracefully di-handle oleh *try-catch*, sehingga sistem tidak "*crash*" sepenuhnya jika terjadi kegagalan jaringan atau blockchain.

## 📄 Lisensi
[MIT License](LICENSE)
