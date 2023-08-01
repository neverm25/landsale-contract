# 🌆 Land 

## 📝 Overview
- Please check the following website to have some understandings of [Land NFT](https://www.sandbox.game/en/map).
- Please study more about [ERC721](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721) if you don’t have enough knowledge
- Other reference: [Sandbox Smart Contracts](https://github.com/thesandboxgame/sandbox-smart-contracts)

## 📖 About
-	We have a land 300*300. And we’re going to sell our land as NFT.
-	Users can buy these kinds of land pieces: `1*1, 3*3, 6*6, 12*12`

## 🏧 Core contracts
- Land contract
- LandSale contract

## 🖋 Specs
- Land contract
  Its functionality should be the same as Sandbox Land NFT.
  Please check the code and do fully understand. And do your changes.
- LandSale contract
  - It will sell land pieces with usdt token. (one erc20 token)
  - It will have a whitelist functionality.
  - Please use merkle-tree for whitelist functionality.
  - Whitelist function is called by contract operator only. 
  - When do whitelisting, it will use the following info:
    Position(x,y), size(1,3,6,12), and price.
    If it’s whitelisted, the user can buy that land piece with whitelisted price.
    When user buys, it will mint that land piece to the user

## 🔎 Reference
- If you want to know about land, please click [here](https://sandboxgame.gitbook.io/the-sandbox/land/what-is-land)

## 💻 Command
This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
