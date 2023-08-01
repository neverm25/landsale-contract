import { ethers } from "hardhat";

import config from "./config";
import { setupMerkleTree } from "../test/utils/helpers";

async function main() {
  const paramData = config.bsc;

  const landFactory = await ethers.getContractFactory("Land");
  const land = await landFactory.deploy();
  await land.deployed();
  console.log(`Land deployed to ${land.address}`);

  const [, merkleRoot] = setupMerkleTree();
  const landSaleFactory = await ethers.getContractFactory("LandSale");
  const landSale = await landSaleFactory.deploy(
    land.address,
    paramData.usdt,
    paramData.admin,
    paramData.wallet,
    merkleRoot,
  );
  await landSale.deployed();
  console.log(
    `LandSale deployed to ${landSale.address} with land address ${land.address}, USDT address ${paramData.usdt}, admin address ${paramData.admin}, wallet address ${paramData.wallet} and merkleRoot hash ${merkleRoot}`,
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
