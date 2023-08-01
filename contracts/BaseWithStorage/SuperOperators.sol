//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";

import "./Admin.sol";

contract SuperOperators is Context, Admin {
    mapping(address => bool) internal _superOperators;

    event SuperOperator(address indexed superOperator, bool indexed enabled);

    /**
     * @notice Enable or disable the ability of `superOperator` to transfer tokens of all (superOperator rights).
     * @param superOperator address that will be given/removed superOperator right.
     * @param enabled set whether the superOperator is enabled or disabled.
     */
    function setSuperOperator(address superOperator, bool enabled) external onlyAdmin {
        require(superOperator != address(0), "address 0 is not allowed as super operator");
        require(enabled != _superOperators[superOperator], "the status should be different than the current one");
        _superOperators[superOperator] = enabled;
        emit SuperOperator(superOperator, enabled);
    }

    /**
     * @notice check whether address `who` is given superOperator rights.
     * @param who The address to query.
     * @return whether the address has superOperator rights.
     */
    function isSuperOperator(address who) public view returns (bool) {
        return _superOperators[who];
    }
}
