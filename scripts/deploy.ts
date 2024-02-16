import { ethers } from "hardhat";

async function main() {
  const SAVINGTOKEN = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const saveerc20 = await ethers.deployContract("SaveERC20", [SAVINGTOKEN]);

  await saveerc20.waitForDeployment();

  console.log(
    `deployed to ${saveerc20.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
