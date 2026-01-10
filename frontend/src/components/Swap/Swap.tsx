import { useState } from "react";
import { encodeAbiParameters, encodeFunctionData } from "viem";
import type { PoolKey } from "../../types/poolKey";
import type { SwapParams } from "../../types/swapParams";
import type { SwapParamsFormData } from "../../types/Forms/swapParamsFormData";
import { baseWalletClient } from "../../constants/clients";
import {
  poolManagerAddress,
  tokenAddress,
  hookAddress,
} from "../../constants/contractAddresses";
import PoolManagerABI from "../../ABI/poolManager.json";

function Swap() {
  const [ethAmount, setEthAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [hookData, setHookData] = useState("");

  async function submitSwap(event: React.FormEvent) {
    event.preventDefault();

    const zeroForOne = ethAmount !== "" && ethAmount !== "0";
    const amount = zeroForOne ? ethAmount : tokenAmount;

    try {
      const poolKey: PoolKey = {
        currency0: "0x0000000000000000000000000000000000000000",
        currency1: tokenAddress,
        fee: 3000,
        tickSpacing: 60,
        hooks: hookAddress,
      };

      const swapParams: SwapParams = {
        zeroForOne,
        amountSpecified: -BigInt(parseFloat(amount) * 1e18),
        sqrtPriceLimitX96: zeroForOne
          ? BigInt("4295128740")
          : BigInt("1461446703485210103287273052203988822378723970341"),
      };

      const [userAddress] = await baseWalletClient.requestAddresses();

      const encodedHookData = encodeAbiParameters(
        [{ type: "address" }],
        [userAddress]
      );

      const swapCalldata = encodeFunctionData({
        abi: PoolManagerABI,
        functionName: "swap",
        args: [poolKey, swapParams, encodedHookData],
      });

      const hash = await baseWalletClient.writeContract({
        address: poolManagerAddress,
        abi: PoolManagerABI,
        functionName: "unlock",
        args: [swapCalldata],
        account: userAddress,
      });

      console.log("unlock tx hash:", hash);
    } catch (error) {
      console.log("Error occured in the submitSwap function", error);
    }
  }

  return (
    <>
      <h1>Swap</h1>
      <form onSubmit={submitSwap}>
        <div>
          <label>ETH</label>
          <input
            type="number"
            name="currency0"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="Enter ETH amount to swap"
          />
          <label>Example Token</label>
          <input
            type="number"
            name="currency1"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="Enter Token amount to swap"
          />
          <label>Hook Data</label>
          <input
            type="text"
            name="hookData"
            value={hookData}
            placeholder="0x.."
            onChange={(e) => setHookData(e.target.value)}
          />
        </div>
        <button type="submit">Swap</button>
      </form>
    </>
  );
}

export default Swap;
