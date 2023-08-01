//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";

contract Admin is Context {
    address internal _admin;

    /**
     * @dev Emits when the contract administrator is changed.
     * @param oldAdmin The address of the previous administrator.
     * @param newAdmin The address of the new administrator.
     */
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(_msgSender() == _admin, "ADMIN_ONLY");
        _;
    }

    /**
     * @dev Get the current administrator of this contract.
     * @return The current administrator of this contract.
     */
    function getAdmin() external view returns (address) {
        return _admin;
    }

    /**
     * @dev Change the administrator to be `newAdmin`.
     * @param newAdmin The address of the new administrator.
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        address admin = _admin;
        _admin = newAdmin;
        emit AdminChanged(admin, newAdmin);
    }
}
