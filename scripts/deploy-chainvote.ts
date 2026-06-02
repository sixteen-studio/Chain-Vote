import { network } from "hardhat";

async function main() {
  const title = process.env.CHAINVOTE_TITLE ?? "ChainVote Demo";
  const candidateNames = (process.env.CHAINVOTE_CANDIDATES ?? "Kandidat 1,Kandidat 2")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const now = Math.floor(Date.now() / 1000);
  const startTime = Number(process.env.CHAINVOTE_START_TIME ?? now);
  const endTime = Number(process.env.CHAINVOTE_END_TIME ?? now + 7 * 24 * 60 * 60);

  const { ethers } = await network.connect();
  const contract = await ethers.deployContract("ChainVote", [
    title,
    candidateNames,
    startTime,
    endTime,
  ]);

  await contract.waitForDeployment();

  const deploymentTransaction = contract.deploymentTransaction();
  const receipt = await deploymentTransaction?.wait();

  console.log("ChainVote deployed");
  console.log("Address:", await contract.getAddress());
  console.log("Tx hash:", deploymentTransaction?.hash);
  console.log("Block:", receipt?.blockNumber);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
