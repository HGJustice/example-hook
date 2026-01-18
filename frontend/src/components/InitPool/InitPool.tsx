import { useState } from "react";
import type { InitPoolFormData } from "../../types/forms/initPoolFormData";
import { initializePool, getPoolState } from "../../lib/poolFunctions";
import { userFormInput } from "../../hooks/userFormInput";

function InitPool() {
  const { formData, handleInputChange } = userFormInput<InitPoolFormData>({
    currency1Address: "0xCC04941338f101EF09623E3BE0e1d5545e3cab8a",
    fee: 3000,
    tickSpacing: 60,
    hooks: "0x238a9DdAbcf2AE2449979F196107d3AeAE31C040",
  });
  const [initPoolTxHash, setinitPoolTxHash] = useState<string | null>(null);
  const [currentTick, setCurrentTick] = useState<number | null>(null);
  const [currentSqrtPrice, setSqrtPrice] = useState<bigint | null>(null);

  function resetState() {
    setinitPoolTxHash(null);
    setCurrentTick(null);
    setSqrtPrice(null);
  }

  async function submitInitializePool(event: React.FormEvent) {
    event.preventDefault();

    try {
      const transactionHash = await initializePool(
        formData.currency1Address,
        formData.fee,
        formData.tickSpacing,
        formData.hooks
      );
      setinitPoolTxHash(transactionHash);
    } catch (error) {
      console.error("Error in the submitInitializePool function", error);
    }
  }

  async function fetchPoolState(event: React.FormEvent) {
    event.preventDefault();
    try {
      const [sqrtPrice, currentTick] = await getPoolState();
      setCurrentTick(currentTick);
      setSqrtPrice(sqrtPrice);
    } catch (error) {
      console.error("Error in the fetchPoolState function", error);
    }
  }

  return (
    <>
      <h1>Initialize Liquidity Pool</h1>
      <form onSubmit={submitInitializePool}>
        <div>
          <label>Currency 1 address</label>
          <input
            type="text"
            name="currency1Address"
            placeholder="Currency 1 base address"
            value={formData.currency1Address}
            onChange={handleInputChange}
          />
          <label>Pool Fee Rate</label>
          <input
            type="number"
            name="fee"
            placeholder="Pool Fee Rate"
            value={formData.fee}
            onChange={handleInputChange}
          />
          <label>Tick Spacing</label>
          <input
            type="number"
            name="tickSpacing"
            placeholder="Tick Spacing"
            value={formData.tickSpacing}
            onChange={handleInputChange}
          />
          <label>Hook Address</label>
          <input
            type="text"
            name="hooks"
            placeholder="Hook Address"
            value={formData.hooks}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Create Liquidity Pool</button>
        <button type="button" onClick={fetchPoolState}>
          Check Pool Data
        </button>
        <button type="button" onClick={resetState}>
          Reset Search
        </button>
      </form>
      {initPoolTxHash && (
        <a href={`https://sepolia.basescan.org/tx/${initPoolTxHash}`}>
          https://sepolia.basescan.org/tx/{initPoolTxHash}
        </a>
      )}
      {currentTick && (
        <p>The current tick from initialized pool is {currentTick}</p>
      )}
      {currentSqrtPrice && (
        <p>
          The square root price of the initialized pool is {currentSqrtPrice}
        </p>
      )}
    </>
  );
}

export default InitPool;
