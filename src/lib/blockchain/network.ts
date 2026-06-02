/**
 * Konfigurasi Jaringan (Network) Blockchain
 * File ini mengatur ke jaringan mana aplikasi kita akan terhubung.
 * Secara bawaan (default), kita menggunakan jaringan lokal Hardhat.
 */

// Chain ID bawaan untuk jaringan lokal Hardhat
export const DEFAULT_CHAIN_ID = 31337;

/**
 * Mengambil Chain ID target dari environment variables (.env)
 * Jika tidak diatur, maka akan menggunakan DEFAULT_CHAIN_ID (31337)
 */
export function getTargetChainId() {
  const configured = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_CHAIN_ID;
}

/**
 * Mengubah angka Chain ID (desimal) menjadi format Hexadesimal (misal: 31337 -> 0x7a69)
 * Format hex diperlukan oleh dompet kripto (seperti MetaMask)
 */
export function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

/**
 * Mengembalikan objek detail jaringan target.
 * Berisi informasi lengkap seperti nama chain, RPC URL (titik koneksi node),
 * dan mata uang asli (native currency) yang digunakan.
 */
export function getTargetNetwork() {
  const chainId = getTargetChainId();

  return {
    chainId,
    chainIdHex: toHexChainId(chainId),
    chainName: chainId === 31337 ? "Hardhat Localhost" : `Local EVM Chain ${chainId}`,
    // RPC URL adalah alamat server tempat kita berkomunikasi dengan blockchain
    rpcUrls: [process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545"],
    nativeCurrency: { name: "Hardhat ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: [] as string[],
  };
}

/**
 * Fungsi utilitas untuk mengambil nama jaringan target dengan cepat
 */
export function getTargetNetworkName() {
  return getTargetNetwork().chainName;
}
