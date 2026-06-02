# 📝 Penjelasan Cara Kerja Smart Contract `ChainVote`

Dokumen ini disusun sebagai panduan untuk mempresentasikan cara kerja smart contract `ChainVote.sol` kepada dosen. Smart contract ini dirancang untuk menangani proses pemungutan suara (voting) secara terdesentralisasi, transparan, dan aman di atas jaringan blockchain.

---

## 1. Konsep Utama (Core Concept)
`ChainVote` adalah kontrak pintar berbasis Ethereum (Solidity `^0.8.20`) yang mengimplementasikan sistem voting berbasis waktu dengan mekanisme pencegahan pemungutan suara ganda (*double voting*). Semua data voting (kandidat, status pemilih, dan perolehan suara) disimpan secara permanen (immutable) di dalam blockchain.

---

## 2. Arsitektur Penyimpanan Data (State Variables & Structs)
Kontrak ini menyimpan beberapa data penting di dalam *state blockchain*:

- **`struct Candidate`**: Struktur data untuk mendefinisikan seorang kandidat. Berisi `id` (unik), `name` (nama kandidat), dan `voteCount` (jumlah perolehan suara).
- **`string title`**: Menyimpan judul atau nama dari agenda pemilihan.
- **`address owner`**: Alamat dompet (wallet) pihak yang mendeploy (menginisialisasi) kontrak ini ke blockchain.
- **`uint256 startTime` & `uint256 endTime`**: Batas waktu (dalam format Unix timestamp) kapan voting boleh dimulai dan kapan harus ditutup.
- **`Candidate[] candidates`**: *Array* (daftar) untuk menyimpan semua objek kandidat yang bertanding.
- **`mapping(address => bool) hasVoted`**: Peta data yang melacak apakah suatu alamat *wallet* (pemilih) sudah pernah memberikan suara (bernilai `true`) atau belum. Ini adalah fitur **utama** untuk mencegah *double voting*.
- **`mapping(address => uint256) selectedCandidate`**: Melacak kandidat mana yang dipilih oleh suatu alamat.

---

## 3. Alur Kerja Sistem (Workflow)

### A. Fase Inisialisasi (Deployment / `constructor`)
Saat kontrak pertama kali di-deploy ke blockchain, fungsi `constructor` akan dieksekusi.
- **Input:** Membutuhkan judul pemilu, daftar nama kandidat, waktu mulai, dan waktu selesai.
- **Validasi:** 
  - Harus ada minimal 1 kandidat (mencegah `EmptyCandidates`).
  - Waktu mulai harus lebih awal daripada waktu selesai (mencegah `InvalidVotingWindow`).
- **Proses:** Mengatur `owner` sebagai pengirim transaksi (`msg.sender`), menetapkan jadwal, dan mendaftarkan kandidat ke dalam *array* `candidates` dengan perolehan suara awal 0.

### B. Fase Pemungutan Suara (Fungsi `vote`)
Ini adalah fungsi utama di mana pemilih memberikan suaranya (`function vote(uint256 candidateId)`).
1. **Pengecekan Waktu:** Memastikan waktu saat ini (`block.timestamp`) sudah melewati `startTime` dan belum melewati `endTime`. Jika tidak, transaksi ditolak (revert).
2. **Pengecekan Double Voting:** Memastikan alamat pengirim (`msg.sender`) belum ada di mapping `hasVoted`. Jika sudah bernilai `true`, transaksi ditolak.
3. **Pengecekan Kandidat:** Memastikan ID kandidat valid (lebih dari 0 dan tidak melebihi jumlah kandidat terdaftar).
4. **Pencatatan State:**
   - Menandai pengirim sudah memilih: `hasVoted[msg.sender] = true`.
   - Mencatat pilihan kandidat: `selectedCandidate[msg.sender] = candidateId`.
   - Menambah 1 suara untuk kandidat tersebut: `candidates[candidateId - 1].voteCount += 1`.
5. **Pemancaran Event (Event Emission):** Memicu `event VoteCast` agar aplikasi frontend/DApp (seperti Next.js) dapat mendeteksi bahwa ada suara baru yang masuk secara *real-time*.

### C. Fase Pengambilan Data (View Functions)
Terdapat fungsi-fungsi yang tidak memakan biaya gas (berlabel `view`) untuk membaca data dari blockchain:
- `getCandidate(candidateId)`: Menarik data spesifik satu kandidat.
- `getCandidates()`: Menarik seluruh daftar kandidat beserta jumlah suaranya (berguna untuk menampilkan hasil klasemen di frontend).
- `candidateCount()`: Mengetahui total kandidat yang bertanding.

---

## 4. Mekanisme Keamanan dan Efisiensi

### Keamanan (Security)
- **Desentralisasi Identitas:** Sistem mengandalkan `msg.sender` (alamat kriptografi) sebagai identitas pemilih yang tidak bisa dipalsukan (membutuhkan *private key* dari *wallet*).
- **Time-Locked:** Suara tidak bisa dimasukkan sebelum atau sesudah jadwal yang ditentukan.
- **Immutable Logic:** Sekali di-deploy, aturan voting tidak dapat diubah, tidak ada fungsi bagi admin/owner untuk memanipulasi suara (bahkan owner pun tidak punya akses untuk mengubah `voteCount` secara sepihak).

### Efisiensi Biaya (Gas Optimization)
- Menggunakan **Custom Errors** (seperti `error AlreadyVoted()`) dibandingkan fungsi `require("Pesan Error")`. Custom error pada Solidity `^0.8.x` jauh lebih hemat gas (*gas efficient*) ketika transaksi gagal dibandingkan menyimpan pesan error berbentuk *string*.

---

## 💡 Tips untuk Presentasi ke Dosen

1. **Fokus pada Transparansi & Integritas Data:** Tekankan bahwa "Di sistem tradisional, database bisa dimanipulasi admin. Di ChainVote, logika terprogram secara *hard-coded* di blockchain; bahkan pembuat aplikasi tidak bisa memanipulasi suara kandidat."
2. **Jelaskan Konsep `msg.sender`:** Beri tahu dosen bahwa otentikasi tidak menggunakan email/password biasa, melainkan *cryptographic signature* (tanda tangan digital) dari dompet pemilih, yang diidentifikasi dari `msg.sender`.
3. **Sebutkan Efisiensi Gas:** Jika ditanya teknis Solidity, sebutkan bahwa penggunaan custom error (`error NamaError();`) adalah langkah optimasi untuk menekan biaya transaksi pengguna saat transaksi gagal.
4. **Peran Event:** Jelaskan bahwa `event VoteCast` bertindak sebagai *trigger* notifikasi agar *frontend web* (UI) bisa memperbarui grafik perolehan suara tanpa harus me-refresh halaman berulang kali.
