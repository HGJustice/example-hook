import { useState } from "react";
import type { PoolKey } from "../../types/poolKey";
import type { ModifyLiquidityParams } from "../../types/modifyLiquidityParams";
import type { ModifyLiquidityFormData } from "../../types/forms/modifyLiquidityFormData";
import { baseWalletClient } from "../../constants/clients";
import {
  poolManagerAddress,
  tokenAddress,
  hookAddress,
} from "../../constants/contractAddresses";
import PoolManagerABI from "../../ABI/poolManager.json";
import TokenABI from "../../ABI/businessToken.json";

function ModifyLiquidity() {
  const [modifyLiquidityFormData, setModifyLiquidityFormData] =
    useState<ModifyLiquidityFormData>({
      tickLower: 0,
      tickUpper: 0,
      liquidityDelta: "0",
    });

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setModifyLiquidityFormData({
      ...modifyLiquidityFormData,
      [event.target.name]: event.target.value,
    });
  }

  async function submitModifyLiquidityRequest(event: React.FormEvent) {
    event.preventDefault();

    try {
      const poolKey: PoolKey = {
        currency0: "0x0000000000000000000000000000000000000000",
        currency1: tokenAddress,
        fee: 3000,
        tickSpacing: 60,
        hooks: hookAddress,
      };

      const modifyLiquidityParms: ModifyLiquidityParams = {
        tickLower: modifyLiquidityFormData.tickLower,
        tickUpper: modifyLiquidityFormData.tickUpper,
        liquidityDelta: BigInt(modifyLiquidityFormData.liquidityDelta),
        salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
      };

      const [userAddress] = await baseWalletClient.requestAddresses();

      //   const approveTokensHash = await baseWalletClient.writeContract({
      //     address: tokenAddress,
      //     abi: TokenABI,
      //     functionName: "approve",
      //     args: [poolManagerAddress, BigInt(1000000000000000000000000)],
      //     account: userAddress,
      //   });

      //   console.log("approve hash: ", approveTokensHash);

      const modifyLiquidityHash = await baseWalletClient.writeContract({
        address: poolManagerAddress,
        abi: PoolManagerABI,
        functionName: "modifyLiquidity",
        args: [poolKey, modifyLiquidityParms, "0x"],
        account: userAddress,
      });

      console.log("Transaction successful, the hash is:", modifyLiquidityHash);
    } catch (error) {
      console.error(
        "Error happending in the submitModifyLiquidityRequest function:",
        error
      );
    }
  }

  return (
    <>
      <h1>Modify Liquidity</h1>
      <form onSubmit={submitModifyLiquidityRequest}>
        <div>
          <label>Tick Lower</label>
          <input
            type="number"
            name="tickLower"
            placeholder="Tick Lower"
            value={modifyLiquidityFormData.tickLower}
            onChange={handleInputChange}
          />
          <label>Tick Upper</label>
          <input
            type="number"
            name="tickUpper"
            placeholder="Tick Upper"
            value={modifyLiquidityFormData.tickUpper}
            onChange={handleInputChange}
          />
          <label>Liquidity Delta</label>
          <input
            type="text"
            name="liquidityDelta"
            placeholder="Tick Lower"
            value={modifyLiquidityFormData.liquidityDelta}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Add or remove liquidity</button>
      </form>
    </>
  );
}

export default ModifyLiquidity;
