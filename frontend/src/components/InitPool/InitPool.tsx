import { useState } from "react";
import type { InitPoolFormData } from "../../types/Forms/initPoolFormData";
import type { PoolKey } from "../../types/poolKey";
import { baseWalletClient } from "../../constants/clients";
import {
  poolManagerAddress,
  hookAddress,
} from "../../constants/contractAddresses";
import PoolManagerABI from "../../ABI/poolManager.json";

function InitPool() {
  const [initPoolFormData, setinitPoolFormData] = useState<InitPoolFormData>({
    currency1Address: "",
    fee: 0,
    sqrtPriceX96: 0,
  });

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setinitPoolFormData({
      ...initPoolFormData,
      [event.target.name]: event.target.value,
    });
  }

  async function submitInitPoolRequest(e: any) {
    e.preventDefault();

    try {
      const poolKey: PoolKey = {
        currency0: "0x0000000000000000000000000000000000000000",
        currency1: initPoolFormData.currency1Address,
        fee: initPoolFormData.fee,
        tickSpacing: 60,
        hooks: hookAddress,
      };

      const [userAddress] = await baseWalletClient.requestAddresses();

      const hash = await baseWalletClient.writeContract({
        address: poolManagerAddress,
        abi: PoolManagerABI,
        functionName: "initialize",
        args: [poolKey, initPoolFormData.sqrtPriceX96],
        account: userAddress,
      });

      console.log("Transaction successful, the hash is:", hash);
    } catch (e) {
      console.error("The error in submitInitPoolRequest function is", e);
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
          <label>SqrtPriceX96</label>
          <input
            type="number"
            name="sqrtPriceX96"
            placeholder="Price of the pool"
            value={initPoolFormData.sqrtPriceX96}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Create Liquidity Pool</button>
      </form>
    </>
  );
}

export default InitPool;
