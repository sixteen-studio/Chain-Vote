import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, formatEther, isAddress, parseEther } from "ethers";

dotenv.config({ path: ".env.local" });
dotenv.config();

const LOCAL_RPC_URL = "http://127.0.0.1:8545";
const TARGET_BALANCE_ETH = "10000";

function getTargetAddress() {
  const cliAddress = process.argv[2];

  if (cliAddress) return cliAddress;
  if (process.env.ADMIN_WALLET_ADDRESS) return process.env.ADMIN_WALLET_ADDRESS;
  if (process.env.DEPLOYER_PRIVATE_KEY) return new Wallet(process.env.DEPLOYER_PRIVATE_KEY).address;

  throw new Error("Masukkan address: pnpm blockchain:fund-local 0x...");
}

async function main() {
  const address = getTargetAddress();

  if (!isAddress(address)) {
    throw new Error(`Address tidak valid: ${address}`);
  }

  const provider = new JsonRpcProvider(LOCAL_RPC_URL);
  const balanceHex = `0x${parseEther(TARGET_BALANCE_ETH).toString(16)}`;

  await provider.send("hardhat_setBalance", [address, balanceHex]);

  const balance = await provider.getBalance(address);

  console.log("Funded local wallet");
  console.log("Address:", address);
  console.log("Balance:", `${formatEther(balance)} ETH`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
