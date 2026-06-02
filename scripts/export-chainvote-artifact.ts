import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type HardhatArtifact = {
  abi: unknown[];
  bytecode: string;
};

async function main() {
  const artifactPath = path.join(
    process.cwd(),
    "artifacts",
    "contracts",
    "ChainVote.sol",
    "ChainVote.json"
  );
  const outputPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "blockchain",
    "ChainVote.json"
  );

  const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as HardhatArtifact;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2)}\n`
  );

  console.log(`Exported ChainVote artifact to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
