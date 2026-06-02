// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainVote
 * @dev Kontrak pintar (Smart Contract) untuk pemungutan suara (voting) terdesentralisasi secara transparan dan aman.
 * Kontrak ini memiliki batas waktu (start/end time) dan mencatat hak pilih setiap alamat agar tidak memilih dua kali.
 */
contract ChainVote {
    
    // Struktur data untuk mendefinisikan informasi setiap kandidat
    struct Candidate {
        uint256 id;          // ID unik kandidat (mulai dari 1)
        string name;         // Nama kandidat
        uint256 voteCount;   // Jumlah perolehan suara kandidat
    }

    // Variabel State (disimpan langsung di blockchain)
    string public title;                             // Judul atau nama pemilihan/voting
    address public owner;                            // Alamat pembuat kontrak (pemilik/deployer)
    uint256 public startTime;                        // Waktu mulai voting (Unix timestamp)
    uint256 public endTime;                          // Waktu berakhir voting (Unix timestamp)

    // Variabel penyimpanan internal/private
    Candidate[] private candidates;                  // Array dinamis untuk menyimpan daftar semua kandidat
    
    // Pemetaan (Mapping) untuk melacak status dan pilihan pemilih (voter)
    mapping(address => bool) public hasVoted;        // Mengecek apakah suatu alamat blockchain sudah memilih (true/false)
    mapping(address => uint256) public selectedCandidate; // Menyimpan ID kandidat yang dipilih oleh suatu alamat

    // Event yang dipicu setiap kali ada suara masuk (sangat berguna untuk dideteksi oleh Frontend / DApp secara real-time)
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);

    // Kumpulan custom error untuk menghemat biaya gas (gas efficiency) ketika transaksi dibatalkan (revert)
    error VotingNotStarted();      // Gagal karena voting belum dimulai
    error VotingEnded();           // Gagal karena waktu voting sudah habis
    error AlreadyVoted();          // Gagal karena alamat ini sudah memberikan suara sebelumnya
    error InvalidCandidate();      // Gagal karena memilih kandidat dengan ID yang tidak terdaftar
    error InvalidVotingWindow();   // Gagal karena waktu mulai lebih besar/sama dengan waktu selesai
    error EmptyCandidates();       // Gagal karena daftar kandidat kosong saat inisialisasi

    /**
     * @notice Konstruktor untuk menginisialisasi kontrak voting saat dideploy ke blockchain
     * @param _title Judul dari pemilu/voting
     * @param _candidateNames Daftar nama kandidat dalam bentuk array string
     * @param _startTime Unix timestamp waktu mulai voting
     * @param _endTime Unix timestamp waktu selesai voting
     */
    constructor(
        string memory _title,
        string[] memory _candidateNames,
        uint256 _startTime,
        uint256 _endTime
    ) {
        // Validasi: Harus ada minimal 1 kandidat
        if (_candidateNames.length == 0) revert EmptyCandidates();
        // Validasi: Waktu mulai harus lebih awal dibanding waktu berakhir
        if (_startTime >= _endTime) revert InvalidVotingWindow();

        title = _title;
        owner = msg.sender; // msg.sender adalah alamat dompet yang mendeploy kontrak ini (pemilik)
        startTime = _startTime;
        endTime = _endTime;

        // Memasukkan daftar nama kandidat ke dalam array candidates
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                id: i + 1, // ID kandidat dimulai dari angka 1
                name: _candidateNames[i],
                voteCount: 0 // Inisialisasi perolehan suara awal yaitu 0
            }));
        }
    }

    /**
     * @notice Fungsi bagi pemilih (voter) untuk memberikan suara pada kandidat tertentu
     * @param candidateId ID kandidat yang ingin dipilih
     */
    function vote(uint256 candidateId) external {
        // Validasi 1: Voting harus sudah dimulai
        if (block.timestamp < startTime) revert VotingNotStarted();
        // Validasi 2: Voting tidak boleh melebihi batas waktu akhir
        if (block.timestamp > endTime) revert VotingEnded();
        // Validasi 3: Pengirim transaksi belum pernah melakukan voting
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        // Validasi 4: ID kandidat yang dipilih harus valid (antara 1 sampai jumlah total kandidat)
        if (candidateId == 0 || candidateId > candidates.length) revert InvalidCandidate();

        // Mengubah status pengirim transaksi menjadi sudah memilih (mencegah double voting)
        hasVoted[msg.sender] = true;
        // Mencatat ID kandidat yang dipilih oleh pengirim transaksi
        selectedCandidate[msg.sender] = candidateId;
        // Menambah jumlah suara kandidat terpilih sebesar 1
        candidates[candidateId - 1].voteCount += 1;

        // Memicu Event VoteCast ke blockchain log
        emit VoteCast(msg.sender, candidateId, block.timestamp);
    }

    /**
     * @notice Mengambil data lengkap kandidat tertentu berdasarkan ID-nya
     * @param candidateId ID kandidat yang ingin dicari
     * @return Data struct Candidate (id, name, voteCount)
     */
    function getCandidate(uint256 candidateId) external view returns (Candidate memory) {
        if (candidateId == 0 || candidateId > candidates.length) revert InvalidCandidate();
        return candidates[candidateId - 1];
    }

    /**
     * @notice Mengambil seluruh daftar kandidat beserta jumlah suaranya
     * @return Array berisi seluruh Candidate
     */
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice Mendapatkan jumlah total kandidat yang terdaftar
     * @return Jumlah total kandidat
     */
    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }

    // Fungsi Fallback: Dipicu jika kontrak menerima transaksi dengan data yang tidak cocok dengan fungsi manapun
    fallback() external {}

    // Fungsi Receive: Memungkinkan kontrak menerima Ether langsung tanpa pemanggilan fungsi
    receive() external payable {}
}
