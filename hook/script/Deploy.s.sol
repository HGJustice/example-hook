// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Script.sol";
import {PointsHook} from "../src/PointsHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";

contract DeployHookScript is Script {
    address constant POOL_MANAGER = 0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829;
    address constant CREATE2_DEPLOYER =
        0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        uint160 flags = uint160(Hooks.AFTER_SWAP_FLAG); // 0x0080

        bytes memory constructorArgs = abi.encode(POOL_MANAGER);
        bytes memory bytecode = abi.encodePacked(
            type(PointsHook).creationCode,
            constructorArgs
        );
        bytes32 bytecodeHash = keccak256(bytecode);

        // Mine salt
        bytes32 salt = mineSalt(CREATE2_DEPLOYER, flags, bytecodeHash);

        console.log("Salt found:");
        console.logBytes32(salt);

        address predictedAddress = computeCreate2Address(
            CREATE2_DEPLOYER,
            salt,
            bytecodeHash
        );
        console.log("Predicted address:", predictedAddress);

        // Deploy
        vm.startBroadcast();

        address deployed;
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(deployed != address(0), "Deploy failed");
        require(deployed == predictedAddress, "Address mismatch");

        console.log("Deployed at:", deployed);

        vm.stopBroadcast();
    }

    function mineSalt(
        address deployer,
        uint160 flags,
        bytes32 bytecodeHash
    ) internal view returns (bytes32) {
        for (uint256 i = 0; i < 100000; i++) {
            bytes32 salt = bytes32(i);
            address predicted = computeCreate2Address(
                deployer,
                salt,
                bytecodeHash
            );

            if (uint160(predicted) & Hooks.ALL_HOOK_MASK == flags) {
                return salt;
            }

            if (i % 10000 == 0) {
                console.log("Mining... tried", i);
            }
        }

        revert("Salt not found in 100k iterations");
    }

    function computeCreate2Address(
        address deployer,
        bytes32 salt,
        bytes32 bytecodeHash
    ) internal pure returns (address) {
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                deployer,
                                salt,
                                bytecodeHash
                            )
                        )
                    )
                )
            );
    }
}
