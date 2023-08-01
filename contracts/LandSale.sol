//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "hardhat/console.sol";

import "./Land.sol";
import "./BaseWithStorage/SuperOperators.sol";

/**
 * @title Land Sale contract
 * @notice This contract mananges the sale of our lands
 */
contract LandSale is SuperOperators {
    uint256 internal constant GRID_SIZE = 300; // 300 is the size of the Land

    Land internal _land;
    ERC20 internal _token;
    address payable internal _wallet;
    bytes32 internal _merkleRoot;

    event LandQuadPurchased(
        address indexed buyer,
        address indexed to,
        uint256 indexed topCornerId,
        uint256 size,
        uint256 price
    );

    constructor(
        address landAddress,
        address tokenContractAddress,
        address admin,
        address payable initialWalletAddress,
        bytes32 merkleRoot_
    ) {
        _land = Land(landAddress);
        _token = ERC20(tokenContractAddress);
        _admin = admin;
        _wallet = initialWalletAddress;
        _merkleRoot = merkleRoot_;
    }

    /**
     * @notice set the wallet receiving the proceeds
     * @param newWallet address of the new receiving wallet
     */
    function setReceivingWallet(address payable newWallet) external onlyAdmin {
        require(newWallet != address(0), "receiving wallet cannot be zero address");
        _wallet = newWallet;
    }

    /**
     * @notice buy Land using the merkle proof associated with it
     * @param buyer address that perform the payment
     * @param to address that will own the purchased Land
     * @param x x coordinate of the Land
     * @param y y coordinate of the Land
     * @param size size of the pack of Land to purchase
     * @param price amount of Sand to purchase that Land
     * @param proof merkleProof for that particular Land
     */
    function buyLand(
        address buyer,
        address to,
        uint256 x,
        uint256 y,
        uint256 size,
        uint256 price,
        bytes32[] calldata proof
    ) external {
        /* solhint-disable-next-line not-rely-on-time */
        require(_superOperators[msg.sender], "only operator can sell land");
        bytes32 leaf = _generateLandHash(x, y, size, price);

        require(_verify(proof, leaf), "Invalid land provided");

        _token.transferFrom(buyer, _wallet, price);

        _land.mintQuad(to, size, x, y, "");
        emit LandQuadPurchased(buyer, to, x + (y * GRID_SIZE), size, price);
    }

    /**
     * @notice Gets the Merkle root associated with the current sale
     * @return The Merkle root, as a bytes32 hash
     */
    function merkleRoot() external view returns (bytes32) {
        return _merkleRoot;
    }

    function _generateLandHash(
        uint256 x,
        uint256 y,
        uint256 size,
        uint256 price
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(x, y, size, price));
    }

    function _verify(bytes32[] memory proof, bytes32 leaf) internal view returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash < proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == _merkleRoot;
    }
}
