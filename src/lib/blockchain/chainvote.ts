/**
 * Integrasi Frontend ke Smart Contract ChainVote
 * File ini berisi fungsi-fungsi untuk berinteraksi dengan blockchain
 * menggunakan dompet pengguna (seperti MetaMask) dan pustaka ethers.js.
 */
import { BrowserProvider, Contract, ContractFactory, type Provider } from "ethers";
import chainVoteArtifact from "@/lib/blockchain/ChainVote.json";
export { getTargetNetwork, getTargetNetworkName } from "@/lib/blockchain/network";

// Mendefinisikan tipe untuk provider Ethereum yang disuntikkan oleh browser (contoh: window.ethereum dari MetaMask)
type EthereumProvider = NonNullable<typeof window.ethereum>;

/**
 * Mengambil ABI (Application Binary Interface) dari Contract.
 * ABI ibarat "buku panduan" agar frontend tahu fungsi apa saja yang ada di dalam Contract.
 */
export function getChainVoteAbi() {
  return chainVoteArtifact.abi;
}

/**
 * Mengambil Bytecode dari Contract.
 * Bytecode adalah kode mesin contract yang sudah dikompilasi, dibutuhkan saat mendeploy Contract baru.
 */
export function getChainVoteBytecode() {
  return chainVoteArtifact.bytecode;
}

/**
 * Mendapatkan Signer (Penandatangan) dari MetaMask.
 * Signer merepresentasikan akun dompet pengguna yang memiliki izin untuk menandatangani dan mengirim transaksi.
 */
export async function getMetaMaskSigner(ethereum: EthereumProvider) {
  const provider = new BrowserProvider(ethereum);
  return provider.getSigner();
}

/**
 * Fungsi internal untuk memastikan bahwa Contract benar-benar ada (sudah dideploy)
 * di alamat (address) yang diberikan pada jaringan aktif saat ini.
 */
async function assertContractExists(provider: Provider, contractAddress: string) {
  const code = await provider.getCode(contractAddress);

  if (code === "0x") {
    throw new Error("CONTRACT_NOT_FOUND_ON_ACTIVE_NETWORK");
  }
}

/**
 * Mendeploy (mengunggah) Smart Contract ChainVote baru ke blockchain.
 * Dipanggil biasanya oleh Admin saat membuat sesi pemilihan baru.
 * 
 * @param input Objek yang berisi ethereum provider, judul pemilihan, daftar kandidat, serta waktu mulai dan selesai.
 * @returns Alamat contract yang baru dideploy, hash transaksi, dan nomor blok.
 */
export async function deployChainVoteContract(input: {
  ethereum: EthereumProvider;
  title: string;
  candidateNames: string[];
  startTime: string;
  endTime: string;
}) {
  const signer = await getMetaMaskSigner(input.ethereum);
  
  // ContractFactory digunakan untuk mendeploy contract baru menggunakan ABI, Bytecode, dan Signer
  const factory = new ContractFactory(getChainVoteAbi(), getChainVoteBytecode(), signer);
  
  const contract = await factory.deploy(
    input.title,
    input.candidateNames,
    // Mengubah waktu dari format string (JS Date) menjadi detik (Unix Timestamp untuk bahasa Solidity)
    Math.floor(new Date(input.startTime).getTime() / 1000),
    Math.floor(new Date(input.endTime).getTime() / 1000)
  );
  
  // Menunggu hingga transaksi deploy selesai diverifikasi dan masuk ke dalam blok jaringan
  const receipt = await contract.deploymentTransaction()?.wait();

  return {
    contractAddress: await contract.getAddress(),
    txHash: contract.deploymentTransaction()?.hash ?? "",
    blockNumber: receipt?.blockNumber ?? 0,
  };
}

/**
 * Mengirimkan suara (vote) pengguna ke Smart Contract di blockchain.
 * 
 * @param input Objek berisi ethereum provider, alamat contract, dan indeks kandidat yang dipilih.
 * @returns Hash transaksi dan nomor blok dari transaksi vote tersebut.
 */
export async function castChainVote(input: {
  ethereum: EthereumProvider;
  contractAddress: string;
  candidateIndex: number;
}) {
  const signer = await getMetaMaskSigner(input.ethereum);
  await assertContractExists(signer.provider, input.contractAddress);
  
  // Membuat instance Contract yang sudah ada untuk berinteraksi dengannya
  const contract = new Contract(input.contractAddress, getChainVoteAbi(), signer);
  
  // Memanggil fungsi `vote` pada Smart Contract dengan parameter indeks kandidat
  const transaction = await contract.vote(input.candidateIndex);
  
  // Menunggu hingga transaksi vote selesai dan dikonfirmasi oleh penambang/validator jaringan
  const receipt = await transaction.wait();

  return {
    txHash: transaction.hash as string,
    blockNumber: receipt?.blockNumber ?? 0,
  };
}

/**
 * Mengecek apakah sebuah alamat dompet (wallet) sudah pernah melakukan voting atau belum.
 * Berbeda dengan `castChainVote`, fungsi ini hanya *membaca* data dari blockchain (tidak butuh gas fee/transaksi).
 * 
 * @param input Objek berisi ethereum provider, alamat contract, dan alamat dompet (wallet) pengguna.
 * @returns boolean `true` jika sudah voting, `false` jika belum.
 */
export async function hasChainVote(input: {
  ethereum: EthereumProvider;
  contractAddress: string;
  walletAddress: string;
}) {
  const provider = new BrowserProvider(input.ethereum);
  await assertContractExists(provider, input.contractAddress);
  
  // Instance contract menggunakan `provider` (bukan signer) karena hanya untuk membaca data (read-only)
  const contract = new Contract(input.contractAddress, getChainVoteAbi(), provider);
  
  // Memanggil fungsi `hasVoted` pada Smart Contract
  return contract.hasVoted(input.walletAddress) as Promise<boolean>;
}
