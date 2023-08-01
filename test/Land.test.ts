import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

import { Land, Land__factory, USDT, USDT__factory } from "../typechain";
import { sizes, GRID_SIZE } from "./utils/constants";

describe("Land Test", () => {
  let land: Land;

  let deployer: SignerWithAddress;
  let landAdmin: SignerWithAddress;
  let user0: SignerWithAddress;

  beforeEach(async () => {
    [deployer, landAdmin, user0] = await ethers.getSigners();

    const landFactory: Land__factory = await ethers.getContractFactory("Land");
    land = await landFactory.deploy();
  });

  describe("LandBaseToken", () => {
    describe("Check Land info", () => {
      it("should be 'Sandbox's LANDS' as the token name", async () => {
        expect(await land.name()).to.be.equal("Sandbox's LANDs");
      });

      it("should be 'LAND' as the token symbol", async () => {
        expect(await land.symbol()).to.be.equal("LAND");
      });

      it("should be exist token uri to get", async () => {
        await expect(land.tokenURI(0)).to.be.revertedWith("Id does not exist");
        await land.setMinter(deployer.address, true);
        await land.mintQuad(deployer.address, 1, 0, 0, "0x");
        await land.mintQuad(deployer.address, 6, 6, 6, "0x");
        expect(await land.tokenURI(0)).to.be.equal("https://api.sandbox.game/lands/0/metadata.json");
        expect(await land.tokenURI(1806)).to.be.equal("https://api.sandbox.game/lands/1806/metadata.json");
      });

      it("check support interfaces", async () => {
        const erc165 = "0x01ffc9a7";
        const erc721 = "0x80ac58cd";
        const erc721MetaData = "0x5b5e139f";
        const test = "0x00000000";

        expect(await land.supportsInterface(test)).to.be.false;
        expect(await land.supportsInterface(erc165)).to.be.true;
        expect(await land.supportsInterface(erc721)).to.be.true;
        expect(await land.supportsInterface(erc721MetaData)).to.be.true;
      })
    });

    describe("Check quad info", () => {
      it("check the grid size", async () => {
        expect(await land.width()).to.be.equal(GRID_SIZE);
        expect(await land.height()).to.be.equal(GRID_SIZE);
      });

      it("should exist the quad to get a coordinate", async () => {
        await expect(land.getX(1)).to.be.revertedWith("token does not exist");
        await expect(land.getY(1)).to.be.revertedWith("token does not exist");
      });

      it("Check coordinate of a quad from quad id", async () => {
        await land.setMinter(deployer.address, true);
        await land.mintQuad(deployer.address, 6, 0, 0, "0x");
        expect(await land.getX(0)).to.be.equal(0);
        expect(await land.getY(0)).to.be.equal(0);
      });
    });

    describe("Set minter", () => {
      it("should not be a minter by default", async function () {
        expect(await land.isMinter(deployer.address)).to.be.false;
      });

      it("should be an admin to set minter", async function () {
        await expect(land.connect(user0).setMinter(deployer.address, true)).to.be.revertedWith("ADMIN_ONLY");

        expect(await land.isMinter(deployer.address)).to.be.false;
      });

      it("should enable a minter", async function () {
        await expect(land.setMinter(deployer.address, true)).not.to.be.reverted;

        expect(await land.isMinter(deployer.address)).to.be.true;
      });

      it("should disable a minter", async function () {
        const admin = await land.getAdmin();
        const landAdminCon = land.connect(ethers.provider.getSigner(admin));

        await expect(landAdminCon.setMinter(deployer.address, true)).not.to.be.reverted;
        await expect(landAdminCon.setMinter(deployer.address, false)).not.to.be.reverted;

        expect(await landAdminCon.isMinter(deployer.address)).to.be.false;
      });

      it("should not accept address 0 as minter", async function () {
        const admin = await land.getAdmin();
        const landAdminCon = land.connect(ethers.provider.getSigner(admin));

        await expect(landAdminCon.setMinter(ethers.constants.AddressZero, false)).to.be.revertedWith(
          "address 0 is not allowed as minter",
        );

        await expect(landAdminCon.setMinter(ethers.constants.AddressZero, true)).to.be.revertedWith(
          "address 0 is not allowed as minter",
        );

        expect(await landAdminCon.isMinter(ethers.constants.AddressZero)).to.be.false;
      });

      it("should only be able to disable an enabled minter", async function () {
        const admin = await land.getAdmin();
        const landAdminCon = land.connect(ethers.provider.getSigner(admin));

        await expect(landAdminCon.setMinter(deployer.address, true)).not.to.be.reverted;

        expect(await landAdminCon.isMinter(deployer.address)).to.be.true;

        await expect(landAdminCon.setMinter(deployer.address, true)).to.be.revertedWith(
          "the status should be different than the current one",
        );
        await expect(landAdminCon.setMinter(deployer.address, false)).not.to.be.reverted;
      });

      it("should only be able to enable a disabled minter", async function () {
        const admin = await land.getAdmin();
        const landAdminCon = land.connect(ethers.provider.getSigner(admin));

        expect(await landAdminCon.isMinter(deployer.address)).to.be.false;

        await expect(landAdminCon.setMinter(deployer.address, false)).to.be.revertedWith(
          "the status should be different than the current one",
        );
        await expect(landAdminCon.setMinter(deployer.address, true)).not.to.be.reverted;
      });
    });

    describe("Mint quad", () => {
      beforeEach(async () => {
        await land.setMinter(deployer.address, true);
      });

      it("should not a zero address as to address", async () => {
        await expect(land.mintQuad(ethers.constants.AddressZero, 1, 0, 0, "0x")).to.be.revertedWith(
          "to is zero address",
        );
      });

      it("should mint by a minter", async () => {
        await expect(land.connect(user0).mintQuad(user0.address, 1, 0, 0, "0x")).to.be.revertedWith(
          "Only a minter can mint",
        );
      });

      it("Size should include in 1, 3, 6, 12 when", async () => {
        await expect(land.mintQuad(user0.address, 24, 0, 0, "0x")).to.be.revertedWith("Invalid size");
      });

      it("should be valid coordinates", async () => {
        await expect(land.mintQuad(user0.address, 6, 5, 6, "0x")).to.be.revertedWith("Invalid coordinates");
        await expect(land.mintQuad(user0.address, 6, 6, 5, "0x")).to.be.revertedWith("Invalid coordinates");
        await expect(land.mintQuad(user0.address, 6, 5, 5, "0x")).to.be.revertedWith("Invalid coordinates");
        await expect(land.mintQuad(user0.address, 6, 300, 6, "0x")).to.be.revertedWith("Out of bounds");
        await expect(land.mintQuad(user0.address, 6, 6, 300, "0x")).to.be.revertedWith("Out of bounds");
        await expect(land.mintQuad(user0.address, 6, 300, 300, "0x")).to.be.revertedWith("Out of bounds");
      });

      it("Burnt land cannot be minted again", async function () {
        // await land.setSuperOperator(deployer.address, true);
        const x = 0;
        const y = 0;
        const tokenId = x + y * GRID_SIZE;

        await land.mintQuad(deployer.address, 3, x, y, "0x");

        await land.burn(tokenId);

        await expect(land.mintQuad(deployer.address, 1, x, y, "0x")).to.be.revertedWith("Already minted as 3x3");
      });

      sizes.forEach(size1 => {
        sizes.forEach(size2 => {
          it(`should NOT be able to mint ${size2}x${size2} quad twice from ${size1}x${size1} quad`, async function () {
            await land.mintQuad(deployer.address, size1, 0, 0, "0x");
            await expect(land.mintQuad(deployer.address, size2, 0, 0, "0x")).to.be.reverted;
          });
        });
      });
    });

    describe("Transfer quad", () => {
      const mintX = 120;
      const mintY = 120;
      const mintSize = 12;
      const mintData = "0x";

      beforeEach(async () => {
        await land.setMinter(deployer.address, true);
        await land.setSuperOperator(deployer.address, true);
        await land.mintQuad(deployer.address, mintSize, mintX, mintY, mintData);
      });

      it("should NOT accept address 0 as from", async () => {
        await expect(
          land.transferQuad(ethers.constants.AddressZero, user0.address, mintSize, mintX, mintY, mintData),
        ).to.be.revertedWith("from is zero address");
      });

      it("should NOT accept address 0 as to", async () => {
        await expect(
          land.transferQuad(deployer.address, ethers.constants.AddressZero, mintSize, mintX, mintY, mintData),
        ).to.be.revertedWith("can't send to zero address");
      });

      it("should athorize to transfer quad", async () => {
        await land.mintQuad(user0.address, 6, 60, 60, mintData);
        await land.setSuperOperator(deployer.address, false);
        await expect(land.transferQuad(user0.address, deployer.address, 6, 60, 60, mintData)).to.be.revertedWith(
          "not authorized to transferQuad",
        );
        await land.setSuperOperator(deployer.address, true);
        await expect(land.transferQuad(user0.address, deployer.address, 6, 60, 60, mintData)).not.to.be.reverted;
      });

      it("should be valid the coordinate to transfer", async () => {
        await expect(land.transferQuad(deployer.address, user0.address, 24, mintX, mintY, mintData)).to.be.revertedWith(
          "Invalid size",
        );
        await expect(
          land.transferQuad(deployer.address, user0.address, mintSize, 199, 199, mintData),
        ).to.be.revertedWith("Invalid coordinates");
        await expect(
          land.transferQuad(deployer.address, user0.address, mintSize, 300, 300, mintData),
        ).to.be.revertedWith("Out of bounds");
      });

      it("should exist the quad to transfer", async () => {
        await expect(land.transferQuad(deployer.address, user0.address, 1, 60, 60, mintData)).to.be.revertedWith(
          "token does not exist",
        );
      });

      it("should own all sub quads or parent quads to transfer", async () => {
        await land.mintQuad(deployer.address, 3, 0, 0, "0x");
        await land.transferQuad(deployer.address, user0.address, 1, 0, 0, "0x");
        await expect(land.transferQuad(user0.address, user0.address, 3, 0, 0, "0x")).to.be.revertedWith(
          "not owner of all sub quads nor parent quads",
        );
      });

      sizes.forEach(size1 => {
        sizes.forEach(size2 => {
          if (size2 > size1) return;
          it(`should NOT be able to transfer ${size2}x${size2} quad twice from ${size1}x${size1} quad`, async function () {
            await land.mintQuad(deployer.address, size1, 0, 0, "0x");
            await land.transferQuad(deployer.address, landAdmin.address, size2, 0, 0, "0x");
            await expect(land.transferQuad(deployer.address, landAdmin.address, size2, 0, 0, "0x")).to.be.reverted;
          });
        });
      });

      sizes.forEach(size1 => {
        sizes.forEach(size2 => {
          if (size2 >= size1) return;
          it(`should NOT be able to transfer burned ${size2}x${size2} quad twice from ${size1}x${size1} quad`, async function () {
            await land.mintQuad(deployer.address, size1, 0, 0, "0x");
            for (let x = 0; x < size2; x++) {
              for (let y = 0; y < size2; y++) {
                const tokenId = x + y * GRID_SIZE;
                await land.burn(tokenId);
              }
            }
            await expect(land.transferQuad(deployer.address, landAdmin.address, size1, 0, 0, "0x")).to.be.revertedWith(
              "not owner",
            );
          });
        });
      });
    });

    describe("batch transfer quads", () => {
      const batchSizes = [3, 3];
      const batchXs = [0, 9];
      const batchYs = [0, 9];
      const batchData = "0x";

      beforeEach(async () => {
        await land.setMinter(deployer.address, true);
        await land.mintQuad(deployer.address, batchSizes[0], batchXs[0], batchYs[0], batchData);
        await land.mintQuad(deployer.address, batchSizes[1], batchXs[1], batchYs[1], batchData);
      });

      it("should NOT accept address 0 as from to transfer batch", async () => {
        await expect(
          land.batchTransferQuad(ethers.constants.AddressZero, user0.address, batchSizes, batchXs, batchYs, batchData),
        ).to.be.revertedWith("from is zero address");
      });

      it("should NOT accept address 0 as to", async () => {
        await expect(
          land.batchTransferQuad(
            deployer.address,
            ethers.constants.AddressZero,
            batchSizes,
            batchXs,
            batchYs,
            batchData,
          ),
        ).to.be.revertedWith("can't send to zero address");
      });

      it("should equal x's length and y's length", async () => {
        await expect(
          land.batchTransferQuad(deployer.address, user0.address, batchSizes, [0], batchYs, batchData),
        ).to.be.revertedWith("invalid data");
      });

      it("should athorize to transfer quad", async () => {
        await land.mintQuad(user0.address, 6, 60, 60, batchData);
        await land.mintQuad(user0.address, 6, 90, 90, batchData);
        await expect(
          land.batchTransferQuad(user0.address, deployer.address, [6, 6], [60, 90], [60, 90], batchData),
        ).to.be.revertedWith("not authorized to transferMultiQuads");
        await land.setSuperOperator(deployer.address, true);
        await expect(land.batchTransferQuad(user0.address, deployer.address, [6, 6], [60, 90], [60, 90], batchData)).not
          .to.be.reverted;
      });

      it("should NOT able to transfer quads twice", async () => {
        await expect(land.batchTransferQuad(deployer.address, user0.address, [3, 3], [0, 9], [0, 9], "0x")).not.to.be
          .reverted;
        await expect(land.batchTransferQuad(deployer.address, user0.address, [3, 3], [0, 9], [0, 9], "0x")).to.be
          .reverted;
      });

      it("Check batch transfer quads to contract", async () => {
        const usdtFactory: USDT__factory = await ethers.getContractFactory("USDT");
        const usdt = await usdtFactory.deploy();
        await land.setMetaTransactionProcessor(usdt.address, true);
        await expect(land.batchTransferQuad(deployer.address, usdt.address, [3, 3], [0, 9], [0, 9], "0x")).not.to.be
          .reverted;
      });
    });
  });

  describe("MetaTransactionReceiverV2", function () {
    let usdt: USDT;

    before(async () => {
      const usdtFactory: USDT__factory = await ethers.getContractFactory("USDT");
      usdt = await usdtFactory.deploy();
    });
    it("should not be a meta transaction processor", async function () {
      expect(await land.isMetaTransactionProcessor(usdt.address)).to.be.false;
    });

    it("should enable a meta transaction processor", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.setMetaTransactionProcessor(usdt.address, true)).not.to.be.reverted;

      expect(await land.isMetaTransactionProcessor(usdt.address)).to.be.true;
    });

    it("should disable a meta transaction processor", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.setMetaTransactionProcessor(usdt.address, false)).not.to.be.reverted;

      expect(await land.isMetaTransactionProcessor(usdt.address)).to.be.false;
    });

    it("should only be a contract as meta transaction processor", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.setMetaTransactionProcessor(admin, true)).to.be.revertedWith(
        "only contracts can be meta transaction processor",
      );
    });

    it("should only be the admin able to set a meta transaction processor", async function () {
      const contract = land.connect(user0);
      const admin = await land.getAdmin();
      const contractAsAdmin = land.connect(ethers.provider.getSigner(admin));

      await expect(contract.setMetaTransactionProcessor(usdt.address, true)).to.be.revertedWith("ADMIN_ONLY");

      await expect(contractAsAdmin.setMetaTransactionProcessor(usdt.address, true)).not.to.be.reverted;
    });
  });

  describe("AdminV2", function () {
    it("should get the current admin", async function () {
      expect(await land.getAdmin()).to.be.equal(deployer.address);
    });

    it("should change the admin to a new address", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.changeAdmin(user0.address)).not.to.be.reverted;

      expect(await landAdminCon.getAdmin()).to.be.equal(user0.address);
    });

    it("should only be changed to a new admin", async function () {
      const landAdminCon = land.connect(user0);

      await expect(landAdminCon.changeAdmin(user0.address)).to.be.reverted;
    });
  });

  describe("SuperOperatorsV2", function () {
    it("should not be a super operator by default", async function () {
      expect(await land.isSuperOperator(deployer.address)).to.be.false;
    });

    it("should be an admin to set super operator", async function () {
      const landAdminCon = land.connect(user0);

      await expect(landAdminCon.setSuperOperator(deployer.address, true)).to.be.revertedWith("ADMIN_ONLY");

      expect(await land.isSuperOperator(deployer.address)).to.be.false;
    });

    it("should enable a super operator", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.setSuperOperator(admin, true)).not.to.be.reverted;

      expect(await land.isSuperOperator(admin)).to.be.true;
    });

    it("should disable a super operator", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.setSuperOperator(admin, true)).not.to.be.reverted;
      await expect(landAdminCon.setSuperOperator(admin, false)).not.to.be.reverted;

      expect(await land.isSuperOperator(admin)).to.be.false;
    });

    it("should not accept address 0 as super operator", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.setSuperOperator(ethers.constants.AddressZero, false)).to.be.revertedWith(
        "address 0 is not allowed as super operator",
      );

      await expect(landAdminCon.setSuperOperator(ethers.constants.AddressZero, true)).to.be.revertedWith(
        "address 0 is not allowed as super operator",
      );

      expect(await land.isSuperOperator(ethers.constants.AddressZero)).to.be.false;
    });

    it("should only be able to disable an enabled super operator", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      await expect(landAdminCon.setSuperOperator(admin, true)).not.to.be.reverted;

      expect(await land.isSuperOperator(admin)).to.be.true;

      await expect(landAdminCon.setSuperOperator(admin, true)).to.be.revertedWith(
        "the status should be different than the current one",
      );
      await expect(landAdminCon.setSuperOperator(admin, false)).not.to.be.reverted;
    });

    it("should only be able to enable a disabled super operator", async function () {
      const admin = await land.getAdmin();
      const landAdminCon = land.connect(ethers.provider.getSigner(admin));

      expect(await land.isSuperOperator(admin)).to.be.false;

      await expect(landAdminCon.setSuperOperator(admin, false)).to.be.revertedWith(
        "the status should be different than the current one",
      );
      await expect(landAdminCon.setSuperOperator(admin, true)).not.to.be.reverted;
    });
  });
});
