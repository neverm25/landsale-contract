import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

import { LandSale, LandSale__factory, USDT, USDT__factory } from "../typechain";
import { calculateLandHash, setupMerkleTree } from "./utils/helpers";

describe("Land sale test", () => {
  // Define contract
  let landSale: LandSale;
  let usdt: USDT;
  // Define users
  let deployer: SignerWithAddress;
  let user0: SignerWithAddress;

  beforeEach(async () => {
    [deployer, user0] = await ethers.getSigners();

    const usdtFacotry: USDT__factory = await ethers.getContractFactory("USDT");
    usdt = await usdtFacotry.deploy();

    const landFacotry = await ethers.getContractFactory("Land");
    const land = await landFacotry.deploy();

    const [, merkleRoot] = setupMerkleTree();

    const landSaleFactory: LandSale__factory = await ethers.getContractFactory("LandSale");
    landSale = await landSaleFactory.deploy(land.address, usdt.address, deployer.address, deployer.address, merkleRoot);

    await land.setMinter(landSale.address, true);
  });

  it("Check merkle tree's root", async () => {
    const [, merkleRoot] = setupMerkleTree();
    expect(await landSale.merkleRoot()).to.be.equal(merkleRoot);
  });

  it("should NOT accept address 0 as wallet", async () => {
    await expect(landSale.setReceivingWallet(ethers.constants.AddressZero)).to.be.revertedWith(
      "receiving wallet cannot be zero address",
    );
    await expect(landSale.setReceivingWallet(user0.address)).not.to.be.reverted;
  });

  it("should sell by only operator", async () => {
    const leaf = calculateLandHash(0, 0, 3, 9);
    expect(await landSale.isSuperOperator(deployer.address)).to.be.false;
    await expect(landSale.buyLand(user0.address, user0.address, 0, 0, 3, 9, [leaf])).to.be.revertedWith(
      "only operator can sell land",
    );
  });

  it("should verify with merkle tree", async () => {
    const leaf = calculateLandHash(0, 0, 3, 9);
    await landSale.setSuperOperator(deployer.address, true);
    await expect(landSale.buyLand(user0.address, user0.address, 0, 0, 3, 9, [leaf])).to.be.revertedWith(
      "Invalid land provided",
    );
  });

  it("should NOT accept to sell twice the land", async () => {
    const [merkleTree, , leaves] = setupMerkleTree();

    await usdt.transfer(user0.address, 1000);
    await usdt.connect(user0).approve(landSale.address, 100);
    await landSale.setSuperOperator(deployer.address, true);
    await expect(landSale.buyLand(user0.address, user0.address, 0, 0, 1, 1, merkleTree.getProof(leaves[3])))
      .to.emit(landSale, "LandQuadPurchased")
      .withArgs(user0.address, user0.address, 0, 1, 1);
    await expect(landSale.buyLand(user0.address, user0.address, 0, 0, 1, 1, merkleTree.getProof(leaves[3]))).to.be
      .reverted;
  });
});
