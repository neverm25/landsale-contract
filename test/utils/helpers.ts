import hre, { ethers } from "hardhat";

import MerkleTree from "./merkleTree";

export const timeTravel = async (seconds: number) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

export const getTimeStamp = async () => {
  const blockNumber = await hre.network.provider.send("eth_blockNumber");
  const blockTimestamp = (await hre.network.provider.send("eth_getBlockByNumber", [blockNumber, false])).timestamp;
  return parseInt(blockTimestamp.slice(2), 16);
};

export const getLatestBlockTimestamp = async (): Promise<number> => {
  const latestBlock = await ethers.provider.getBlock("latest");
  return latestBlock.timestamp;
};

export const calculateLandHash = (x: number, y: number, size: number, price: number): string => {
  const types = ["uint256", "uint256", "uint256", "uint256"];
  const values = [x, y, size, price];

  return ethers.utils.solidityKeccak256(types, values);
};

export const setupMerkleTree = (): [MerkleTree, string, string[]] => {
  const leaves = [
    calculateLandHash(0, 1, 1, 1),
    calculateLandHash(6, 6, 3, 9),
    calculateLandHash(1, 0, 1, 1),
    calculateLandHash(0, 0, 1, 1),
    calculateLandHash(3, 3, 3, 9),
    calculateLandHash(1, 1, 1, 1),
  ];
  const merkleTree = new MerkleTree(leaves);
  const merkleRoot = merkleTree.getRoot().hash;

  return [merkleTree, merkleRoot, leaves];
};
