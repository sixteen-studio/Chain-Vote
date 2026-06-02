import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, formatEther, isAddress } from "ethers";

dotenv.config({ path: ".env.local" });
dotenv.config();

const LOCAL_RPC_URL = "http://127.0.0.1:8545";

function getTargetAddress() {
  const cliAddress = process.argv[2];

  if (cliAddress) return cliAddress;
  if (process.env.ADMIN_WALLET_ADDRESS) return process.env.ADMIN_WALLET_ADDRESS;
  if (process.env.DEPLOYER_PRIVATE_KEY) return new Wallet(process.env.DEPLOYER_PRIVATE_KEY).address;

  throw new Error("Masukkan address: pnpm blockchain:check-local 0x...");
}

async function main() {
  const address = getTargetAddress();

  if (!isAddress(address)) {
    throw new Error(`Address tidak valid: ${address}`);
  }

  const provider = new JsonRpcProvider(LOCAL_RPC_URL);
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(address);

  console.log("Local RPC:", LOCAL_RPC_URL);
  console.log("Network chainId:", network.chainId.toString());
  console.log("Wallet address:", address);
  console.log("Balance:", `${formatEther(balance)} ETH`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
