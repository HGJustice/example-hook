import { useState } from "react";
import type { InitPoolFormData } from "../../types/Forms/initPoolFormData";
import type { PoolConfig } from "../../types/poolConfig";
import { baseWalletClient, client } from "../../constants/clients";
import {
  poolManagerAddress,
  hookAddress,
  tokenAddress,
  stateViewAddress,
} from "../../constants/contractAddresses";
import PoolManagerABI from "../../ABI/poolManager.json";

function InitPool() {
  const [initPoolFormData, setinitPoolFormData] = useState<InitPoolFormData>({
    currency1Address: tokenAddress,
    fee: 3000,
    tickSpacing: 60,
  });

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setinitPoolFormData({
      ...initPoolFormData,
      [event.target.name]: event.target.value,
    });
  }

  async function submitInitPoolRequest(event: React.FormEvent) {
    event.preventDefault();

    // Build the poolKey as per Uniswap docs
    const poolKey = {
      currency0: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      currency1: initPoolFormData.currency1Address as `0x${string}`,
      fee: Number(initPoolFormData.fee),
      tickSpacing: Number(initPoolFormData.tickSpacing),
      hooks: hookAddress as `0x${string}`,
    };

    // Convert sqrtPriceX96 to BigInt (viem requires this for large numbers)
    const sqrtPriceX96 = BigInt("79228162514264337593543950336");
    const [userAddress] = await baseWalletClient.requestAddresses();

    try {
      const hash = await baseWalletClient.writeContract({
        address: poolManagerAddress as `0x${string}`,
        abi: PoolManagerABI,
        functionName: "initialize",
        args: [poolKey, sqrtPriceX96],
        account: userAddress,
      });

      console.log("Pool initialized! Transaction hash:", hash);

      // Wait for confirmation
      const receipt = await client.waitForTransactionReceipt({ hash });
      console.log("Transaction confirmed:", receipt);
    } catch (error) {
      console.error("Error initializing pool:", error);
    }
  }

  return (
    <>
      <h1>Initialize Liquidity Pool</h1>
      <form onSubmit={submitInitPoolRequest}>
        <div>
          <label>Currency 1 address</label>
          <input
            type="text"
            name="currency1Address"
            placeholder="Currency 1 base address"
            value={initPoolFormData.currency1Address}
            onChange={handleInputChange}
          />
          <label>Pool Fee Rate</label>
          <input
            type="number"
            name="fee"
            placeholder="Pool Fee Rate"
            value={initPoolFormData.fee}
            onChange={handleInputChange}
          />
          <label>Tick Spacing</label>
          <input
            type="number"
            name="tickSpacing"
            placeholder="Tick Spacing"
            value={initPoolFormData.tickSpacing}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Create Liquidity Pool</button>
      </form>
    </>
  );
}

export default InitPool;
